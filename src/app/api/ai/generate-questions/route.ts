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

  const systemPrompt = `你是一位专业出题助手。请根据提供的知识点生成高质量的**单选题**。

要求：
- 每题4个选项（A/B/C/D），只有1个正确答案
- 题目紧扣知识点核心内容
- 选项要有迷惑性，干扰项要合理
- 每题附带详细解析，说明为什么选这个答案
- 难度适中，考察理解和应用能力

请严格以JSON格式返回：
{"questions": [{"type": "single_choice", "stem": "题干", "options": [{"label": "A", "text": "选项"}, {"label": "B", "text": "选项"}, {"label": "C", "text": "选项"}, {"label": "D", "text": "选项"}], "answer": "正确选项字母", "explanation": "详细解析", "difficulty": 1-5}]}`;

  const userMessage = `请根据以下${kps.length}个知识点，生成${count}道单选题：\n\n${kpText}`;

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
 * 本地生成题目（AI 不可用时的备用方案）
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

  for (let i = 0; i < Math.min(count, kps.length); i++) {
    const kp = kps[i];
    questions.push({
      id: `local_${Date.now()}_${i}`,
      type: "single_choice",
      stem: `关于"${kp.title}"，以下说法正确的是？`,
      options: [
        { label: "A", text: extractKeyPoint(kp.content, 0) },
        { label: "B", text: extractKeyPoint(kp.content, 1) },
        { label: "C", text: extractKeyPoint(kp.content, 2) },
        { label: "D", text: "以上说法均不正确" },
      ],
      answer: "A",
      explanation: kp.content.slice(0, 200),
      difficulty: 3,
    });
  }

  return questions;
}

function extractKeyPoint(content: string, index: number): string {
  const sentences = content.split(/[。；]/).filter((s) => s.trim().length > 5);
  if (index < sentences.length) {
    return sentences[index].trim().slice(0, 80);
  }
  return "相关内容见知识点详情";
}
