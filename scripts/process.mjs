/**
 * 知识库处理脚本
 * 读取桌面知识库文件夹中的所有文件，通过 AI 提炼知识点，更新网站数据
 *
 * 使用方法：
 *   node scripts/process.mjs
 *
 * 使用前请确保 .env.local 中已配置 DEEPSEEK_API_KEY
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.join(process.env.HOME, "Desktop", "知识库");
const DATA_FILE = path.join(__dirname, "..", "src", "data", "knowledge.ts");
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/anthropic";

// 分类映射
const CATEGORY_MAP = {
  公文新闻: "公文新闻",
  管理学: "管理学",
  党建: "党建",
  行业知识: "行业知识",
};

async function main() {
  console.log("=====================================");
  console.log("  知识库处理工具");
  console.log("=====================================\n");

  if (!DEEPSEEK_API_KEY) {
    console.log("❌ 未配置 DEEPSEEK_API_KEY");
    console.log("   请在 .env.local 中设置后重试");
    process.exit(1);
  }

  // 扫描文件夹
  const files = [];
  for (const [catName, catKey] of Object.entries(CATEGORY_MAP)) {
    const folder = path.join(DESKTOP, catName);
    if (!fs.existsSync(folder)) {
      console.log(`⚠️  文件夹不存在: ${catName}`);
      continue;
    }
    const items = fs.readdirSync(folder);
    for (const item of items) {
      const filePath = path.join(folder, item);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if ([".txt", ".md", ".doc", ".docx", ".pdf"].includes(ext)) {
          files.push({ name: item, path: filePath, category: catKey });
        }
      }
    }
  }

  if (files.length === 0) {
    console.log("📭 知识库文件夹中没有待处理的文件");
    console.log(`   请将文件放入 ${DESKTOP} 下的分类文件夹`);
    process.exit(0);
  }

  console.log(`📁 找到 ${files.length} 个文件，开始处理...\n`);

  // 读取现有数据
  let existingData = [];
  try {
    const content = fs.readFileSync(DATA_FILE, "utf-8");
    const match = content.match(/export const knowledgeData: KnowledgeItem\[\] = (\[[\s\S]*?\]);/);
    if (match) {
      existingData = JSON.parse(match[1]);
    }
  } catch (e) {
    // 使用默认数据
  }

  const newItems = [];

  for (const file of files) {
    console.log(`🔍 处理: [${file.category}] ${file.name}`);

    try {
      let text;
      if (file.path.endsWith(".pdf")) {
        console.log("   ⚠️  PDF 文件暂不支持，跳过");
        continue;
      } else if (file.path.endsWith(".docx") || file.path.endsWith(".doc")) {
        console.log("   ⚠️  Word 文件暂不支持，请先转换为 .txt");
        continue;
      } else {
        text = fs.readFileSync(file.path, "utf-8");
      }

      if (text.length < 50) {
        console.log("   ⚠️  内容太短，跳过");
        continue;
      }

      // 调用 AI 提取知识点
      const points = await extractKnowledge(text, file.category, file.name);
      newItems.push(...points);
      console.log(`   ✅ 提取 ${points.length} 个知识点`);
    } catch (err) {
      console.log(`   ❌ 处理失败: ${err.message}`);
    }
  }

  if (newItems.length === 0) {
    console.log("\n📭 没有提取到新的知识点");
    process.exit(0);
  }

  // 合并去重
  const allTitles = new Set(existingData.map((d) => d.title));
  const uniqueNew = newItems.filter((item) => !allTitles.has(item.title));

  const merged = [...uniqueNew, ...existingData];
  const newDataStr = JSON.stringify(merged, null, 2)
    .replace(/\"([^\"]+)\":/g, "$1:")
    .replace(/: \"([^\"]+)\"/g, (_, v) => {
      // 简单字符串，不需要额外处理
      return `: "${v}"`;
    });

  // 生成新的数据文件
  const template = `// 知识点数据（由桌面知识库文件夹自动生成）
// 运行 node scripts/process.mjs 可更新此文件

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: "公文新闻" | "管理学" | "党建" | "行业知识";
  tags: string[];
  source: string;
  created_at: string;
}

export const knowledgeData: KnowledgeItem[] = ${JSON.stringify(merged, null, 2)};
`;

  // 备份旧文件
  const backupPath = DATA_FILE + ".bak";
  if (fs.existsSync(DATA_FILE)) {
    fs.copyFileSync(DATA_FILE, backupPath);
  }

  fs.writeFileSync(DATA_FILE, template, "utf-8");
  console.log(`\n=====================================`);
  console.log(`✅ 完成！新增 ${uniqueNew.length} 个知识点`);
  console.log(`   数据文件: ${DATA_FILE}`);
  console.log(`   备份文件: ${backupPath}`);
  console.log(`=====================================`);
}

/**
 * 调用 DeepSeek API 提取知识点
 */
async function extractKnowledge(text, category, fileName) {
  const systemPrompt = `你是一位学习知识整理助手。从用户提供的文档中提取知识点。

知识范围：
1. 公文新闻 - 内部公文、新闻报道中的重要信息
2. 管理学 - 管理学理论、案例分析要点
3. 党建 - 党建基础知识、政策方针
4. 行业知识 - 航空行业专业知识

请仔细阅读，提取所有重要内容。每个知识点：
- title: 简洁明确的标题
- content: 2-3句话概括要点
- tags: 2-4个关键词

以JSON格式返回：{"points": [{"title": "...", "content": "...", "tags": [...]}, ...]}`;

  const userMessage = `文件分类：${category}\n文件名：${fileName}\n\n${text.slice(0, 8000)}`;

  const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": DEEPSEEK_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "deepseek-v4-pro",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    throw new Error(`API 错误: ${response.status}`);
  }

  const data = await response.json();
  const result = data.content[0].text;
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return (parsed.points || []).map((p) => ({
      id: generateId(),
      title: p.title,
      content: p.content,
      category,
      tags: p.tags || [],
      source: fileName,
      created_at: new Date().toISOString().slice(0, 10),
    }));
  }

  return [];
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

main().catch(console.error);
