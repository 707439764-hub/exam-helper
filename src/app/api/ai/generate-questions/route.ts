import { NextRequest, NextResponse } from "next/server";
import { knowledgeData } from "@/data/knowledge";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!;
const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/anthropic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, questionType = "single_choice", count = 10 } = body;

    // 从知识库获取知识点（本地数据）
    let kps = knowledgeData.map((k) => ({
      title: k.title,
      content: k.content,
      category: k.category,
    }));

    // 按分类筛选
    if (category && category !== "全部") {
      kps = kps.filter((k) => k.category === category);
    }

    if (kps.length === 0) {
      return NextResponse.json(
        { error: `"${category}"分类下暂无知识点` },
        { status: 400 }
      );
    }

    // 随机选取知识点（避免每次都一样）
    const shuffled = kps.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    // 调用 AI 生成题目
    let questions;
    try {
      questions = await callAI(selected, count);
    } catch (aiError) {
      console.error("AI 调用失败，使用本地生成:", aiError);
      questions = generateLocal(selected, count);
    }

    // 如果 Supabase 已配置，存入数据库
    if (isSupabaseConfigured()) {
      try {
        const db = getSupabase();
        await db.from("questions").insert(
          questions.map((q: { type: string; stem: string; options: { label: string; text: string }[]; answer: string; explanation: string; difficulty: number }) => ({
            type: q.type,
            stem: q.stem,
            options: q.options,
            answer: q.answer,
            explanation: q.explanation,
            difficulty: q.difficulty || 3,
          }))
        );
      } catch (e) {
        // 数据库存储失败不影响返回
      }
    }

    return NextResponse.json({ questions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "出题失败";
    console.error("出题失败:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * 调用 DeepSeek AI 生成题目
 */
async function callAI(
  kps: { title: string; content: string; category: string }[],
  count: number
) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY 未配置");
  }

  const kpText = kps
    .map((kp, i) => `[${i + 1}]【${kp.category}】${kp.title}\n${kp.content}`)
    .join("\n\n");

  const systemPrompt = `你是航空机务管理系统竞聘考试命题专家。考生是MCC维修控制中心值班经理，竞聘分公司管理岗。请基于知识点生成高区分度单选题。

命题原则：
1. **场景化**：将知识点嵌入机务运行实际场景（AOG处置、MEL管控、大面积延误、跨部门协调、应急指挥等）
2. **管理视角**：从执行层干部视角考察管理决策能力，而非纯记忆
3. **选项精良**：四个选项都应有合理性和迷惑性，区分度体现在对管理原理的深层理解
4. **解析透彻**：不仅说明对错，更要关联管理理论和实际工作

题型：单选题，4个选项，1个正确答案
难度：中等偏上（考察理解运用，非死记硬背）

严格JSON格式返回：
{"questions":[{"type":"single_choice","stem":"场景化题干","options":[{"label":"A","text":"选项"},{"label":"B","text":"选项"},{"label":"C","text":"选项"},{"label":"D","text":"选项"}],"answer":"A","explanation":"解析：说明正确选项的理由和管理原理，同时解释干扰项的误区","difficulty":3}]}`;

  const userMessage = `以下${kps.length}个知识点来自机务管理系统资料，请据此生成${count}道高质量单选题。要求场景真实、考察管理思维、选项有区分度：\n\n${kpText}`;

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
    throw new Error(`AI API 错误: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return (parsed.questions || []).map((q: Record<string, unknown>, i: number) => ({
      id: `ai_${Date.now()}_${i}`,
      type: q.type || "single_choice",
      stem: q.stem,
      options: q.options || [],
      answer: q.answer,
      explanation: q.explanation || "",
      difficulty: q.difficulty || 3,
    }));
  }

  throw new Error("AI 返回格式异常");
}

/**
 * 本地生成题目（AI不可用时的智能备用方案）
 * 从知识点中提取关键信息构建有区分度的选择题
 */
function generateLocal(
  kps: { title: string; content: string; category: string }[],
  count: number
) {
  const questions: Array<{
    id: string;
    type: string;
    stem: string;
    options: { label: string; text: string }[];
    answer: string;
    explanation: string;
    difficulty: number;
  }> = [];

  // 随机打乱知识点
  const shuffled = [...kps].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  // 出题模板
  const templates = [
    // 模板1：考察核心概念
    (kp: typeof selected[0]) => {
      const sentences = kp.content.split(/[。；]/).filter(s => s.trim().length > 10);
      const correct = sentences[0]?.trim().slice(0, 80) || kp.content.slice(0, 80);
      return {
        stem: `关于"${kp.title}"，以下理解最准确的是？`,
        options: [
          { label: "A", text: correct },
          { label: "B", text: (sentences[1]?.trim() || kp.content.slice(40, 120)).slice(0, 80) },
          { label: "C", text: `${kp.title}的理解应结合实际情况，不可一概而论` },
          { label: "D", text: "以上说法均不完全准确" },
        ],
        answer: "A" as const,
        explanation: correct + "。这是最完整准确的表述。",
      };
    },
    // 模板2：考察应用场景
    (kp: typeof selected[0]) => {
      const words = kp.content.replace(/[，。；、\s]/g, '').slice(0, 30);
      return {
        stem: `作为MCC值班经理，需要在工作中运用"${kp.title}"相关的知识。以下做法最恰当的是？`,
        options: [
          { label: "A", text: `严格遵循${kp.title}的核心原则，结合实际场景灵活应用` },
          { label: "B", text: `优先考虑运行效率，在不影响安全的前提下酌情调整` },
          { label: "C", text: `遇到复杂情况时上报领导决策，避免独立判断` },
          { label: "D", text: `按照个人经验处理，${kp.title}仅作为参考` },
        ],
        answer: "A" as const,
        explanation: `${kp.title}要求：${kp.content.slice(0, 150)}。选项A体现了对原则的坚守和灵活运用的平衡，是管理岗位应有的思维。`,
      };
    },
    // 模板3：考察关键数据
    (kp: typeof selected[0]) => {
      const numMatch = kp.content.match(/(\d+[一-龥]*[个次条项月年%天])/g);
      const keyNum = numMatch?.[0] || "具体";
      return {
        stem: `"${kp.title}"中涉及的关键数据/要求是？`,
        options: [
          { label: "A", text: keyNum + "（正确数据）" },
          { label: "B", text: "根据实际情况灵活调整，无硬性要求" },
          { label: "C", text: "上级文件另行规定" },
          { label: "D", text: "以上都不是" },
        ],
        answer: "A" as const,
        explanation: `根据资料，该知识点明确提到了${keyNum}的数据/要求。`,
      };
    },
  ];

  for (let i = 0; i < selected.length; i++) {
    const kp = selected[i];
    const template = templates[i % templates.length];
    const q = template(kp);
    questions.push({
      id: `local_${Date.now()}_${i}`,
      type: "single_choice",
      stem: q.stem,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      difficulty: 3,
    });
  }

  return questions;
}
