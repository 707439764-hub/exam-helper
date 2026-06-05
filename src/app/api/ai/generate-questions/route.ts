import { NextRequest, NextResponse } from "next/server";
import { knowledgeData } from "@/data/knowledge";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!;
const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/anthropic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category = "全部", count = 5 } = body;

    // 筛选知识点
    let kps = knowledgeData.map((k) => ({
      title: k.title,
      content: k.content,
      category: k.category,
    }));
    if (category !== "全部") {
      kps = kps.filter((k) => k.category === category);
    }
    if (kps.length === 0) {
      return NextResponse.json({ error: "该分类下暂无知识点" }, { status: 400 });
    }

    // 随机抽取，确保每次不同
    const shuffled = [...kps].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(8, shuffled.length));

    let questions;
    try {
      questions = await callAI(selected, count);
    } catch (aiError) {
      console.error("AI调用失败，使用本地:", aiError);
      questions = generateLocal(selected, count);
    }

    // 尝试存数据库
    if (isSupabaseConfigured()) {
      try {
        const db = getSupabase();
        await db.from("questions").insert(
          questions.map((q: { type: string; stem: string; options: { label: string; text: string }[]; answer: string; explanation: string; difficulty: number }) => ({
            type: q.type, stem: q.stem, options: q.options, answer: q.answer,
            explanation: q.explanation, difficulty: q.difficulty || 3,
          }))
        );
      } catch (_) {}
    }

    return NextResponse.json({ questions });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "出题失败" },
      { status: 500 }
    );
  }
}

async function callAI(
  kps: { title: string; content: string; category: string }[],
  count: number
) {
  if (!DEEPSEEK_API_KEY) throw new Error("未配置 DEEPSEEK_API_KEY");

  const kpText = kps.map((kp, i) =>
    `[${i + 1}]【${kp.category}】${kp.title}\n${kp.content}`
  ).join("\n\n");

  const systemPrompt = `你是一名南方新华猎头公司，给南方航空（央企）机务维修执行层干部竞聘考试的命题人员，题目为选择题，一个题目，四个选项。内容包括管理学案例分析（机务班组长/项目负责人视角）、管理学理论、南航企业文化和公司战略、党建基础知识、十五五规划、树立正确政绩观等时政热点题目，公务员行测（图推、计算、逻辑推理、文字类）题目。

请严格按照JSON格式返回：
{"questions":[{"type":"single_choice","stem":"","options":[{"label":"A","text":""},{"label":"B","text":""},{"label":"C","text":""},{"label":"D","text":""}],"answer":"","explanation":""}]}`;

  const userMessage = `命题素材：\n${kpText}\n\n请基于素材，生成${count}道选择题。题型请涵盖：管理学案例分析（机务班组长/项目负责人视角）、管理学理论、南航企业文化和公司战略、党建基础知识、十五五规划与政绩观等时政热点、公务员行测（逻辑推理/计算/文字理解）。`;

  const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": DEEPSEEK_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "deepseek-v4-pro", max_tokens: 4096, system: systemPrompt, messages: [{ role: "user", content: userMessage }] }),
  });

  if (!response.ok) throw new Error(`API错误: ${response.status}`);
  const data = await response.json();
  const text = data.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return (parsed.questions || []).map((q: Record<string, unknown>, i: number) => ({
      id: `ai_${Date.now()}_${i}`, type: "single_choice",
      stem: q.stem, options: q.options || [],
      answer: q.answer, explanation: q.explanation || "", difficulty: 3,
    }));
  }
  throw new Error("AI返回格式异常");
}

function generateLocal(
  kps: { title: string; content: string; category: string }[],
  count: number
) {
  const shuffled = [...kps].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  const questions = [];
  for (let i = 0; i < selected.length; i++) {
    const kp = selected[i];
    const s = kp.content.split(/[。；]/).filter((x: string) => x.trim().length > 10);
    const correct = s[0]?.trim().slice(0, 80) || kp.content.slice(0, 80);
    const wrong = s[1]?.trim().slice(0, 80) || "与正确表述有偏差的理解";
    questions.push({
      id: `local_${Date.now()}_${i}`, type: "single_choice",
      stem: `作为值班经理，以下是关于"${kp.title}"的工作场景。以下理解最准确的是？`,
      options: [
        { label: "A", text: correct },
        { label: "B", text: wrong },
        { label: "C", text: "应结合实际情况灵活处理，不可机械执行" },
        { label: "D", text: "应优先保障运行效率，在安全允许范围内操作" },
      ],
      answer: "A", explanation: `"${kp.title}"的核心要点：${kp.content.slice(0, 200)}`, difficulty: 3,
    });
  }
  return questions;
}
