/**
 * 批量生成题库脚本
 * 管理500 + 党建200 + 公司200 + 行测100 = 1000题
 * node --env-file=../.env.local scripts/gen-questions.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public", "data", "question-bank.json");
const KEY = process.env.DEEPSEEK_API_KEY;
const BASE = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/anthropic";

const PLAN = [
  { category: "管理学", module: "管理学", count: 500, perBatch: 20 },
  { category: "党建", module: "党建时政", count: 200, perBatch: 15 },
  { category: "公文新闻", module: "南航专项", count: 200, perBatch: 15 },
  { category: "行业知识", module: "行测", count: 100, perBatch: 10 },
];

let allQuestions = [];
let completed = {};

// 加载已有进度
if (fs.existsSync(OUT)) {
  try {
    const existing = JSON.parse(fs.readFileSync(OUT, "utf-8"));
    if (Array.isArray(existing)) allQuestions = existing;
  } catch (_) {}
}

// 统计已完成的
for (const p of PLAN) {
  completed[p.module] = allQuestions.filter((q) => q.module === p.module).length;
}

async function callAI(module, batchSize) {
  const systemPrompt = `你是南方新华猎头公司，给南航央企机务维修执行层干部竞聘笔试命题人员。全卷单项选择题，A/B/C/D四个选项。

出题范围（本次只出"${module}"类题目）：
- 管理学：机务班组长/项目负责人实景案例分析+管理学基础理论，紧贴飞机定检、排故管控、班组管理、项目统筹
- 党建时政：党章基础、正确政绩观、十五五规划、央企党建、航空时政
- 南航专项：南航发展战略、机务管理新规、安全方针、集团管理制度
- 行测：数字运算、逻辑判断、图形推理（文字描述规律）、言语理解

命题要求：
1. 题干具体、场景真实，不笼统（具体机型/故障/约束/冲突）
2. 干扰项贴合机务人员常见认知误区，不出现明显错项
3. 解析精炼，含考点速记
4. 严格JSON：{"questions":[{"module":"${module}","stem":"","options":[{"label":"A","text":""},...],"answer":"","explanation":""}]}`;

  const response = await fetch(`${BASE}/v1/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "deepseek-v4-pro", max_tokens: 8192, temperature: 1.0,
      thinking: { type: "disabled" },
      system: systemPrompt,
      messages: [{ role: "user", content: `生成${batchSize}道"${module}"类单选题，要求具体不笼统。` }],
    }),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const textContent = data.content?.find((c) => c.type === "text");
  const text = textContent?.text || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("无JSON");
  const parsed = JSON.parse(jsonMatch[0]);
  return (parsed.questions || []).map((q, i) => ({
    id: `${module}_${Date.now()}_${i}_${Math.random().toString(36).slice(2,6)}`,
    module: q.module || module,
    stem: q.stem,
    options: q.options || [],
    answer: q.answer,
    explanation: q.explanation || "",
  }));
}

async function main() {
  if (!KEY) { console.error("❌ 未设置 DEEPSEEK_API_KEY"); process.exit(1); }

  console.log("==========================================");
  console.log("  批量生成题库 — 目标 1000 题");
  console.log("==========================================");

  for (const plan of PLAN) {
    const remaining = plan.count - completed[plan.module];
    if (remaining <= 0) {
      console.log(`\n✅ ${plan.module} 已完成 (${completed[plan.module]}/${plan.count})，跳过`);
      continue;
    }

    const batches = Math.ceil(remaining / plan.perBatch);
    console.log(`\n📝 ${plan.module}: 还需 ${remaining} 题，分 ${batches} 批生成...`);

    for (let b = 0; b < batches; b++) {
      const size = Math.min(plan.perBatch, remaining - b * plan.perBatch);
      process.stdout.write(`  第 ${b+1}/${batches} 批 (${size}题)... `);
      try {
        const qs = await callAI(plan.module, size);
        allQuestions.push(...qs);
        completed[plan.module] += qs.length;
        // 每批保存
        fs.writeFileSync(OUT, JSON.stringify(allQuestions, null, 2));
        console.log(`✅ +${qs.length} | 总计 ${completed[plan.module]}/${plan.count}`);
      } catch (err) {
        console.log(`❌ ${err.message.slice(0, 60)}`);
        // 失败等待后重试
        await sleep(3000);
      }
      // 避免限流
      await sleep(1500);
    }
  }

  console.log(`\n==========================================`);
  console.log(`✅ 完成！题库共 ${allQuestions.length} 题`);
  console.log(`   保存至: ${OUT}`);
  console.log(`==========================================`);
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

main().catch(console.error);
