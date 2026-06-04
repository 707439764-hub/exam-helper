import { NextRequest, NextResponse } from "next/server";
import { generateQuestions } from "@/lib/deepseek";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, questionType, count = 5 } = body;

    // 从数据库获取知识点
    let query = supabase
      .from("knowledge_points")
      .select("id, title, content, category");

    if (category && category !== "全部") {
      query = query.eq("category", category);
    }

    const { data: kps, error } = await query.limit(10);

    if (error) throw error;

    if (!kps || kps.length === 0) {
      return NextResponse.json(
        { error: "没有找到相关知识点，请先添加知识点" },
        { status: 400 }
      );
    }

    // 调用 AI 生成题目
    const questions = await generateQuestions(
      kps.map((kp) => ({
        title: kp.title,
        content: kp.content,
        category: kp.category,
      })),
      questionType || "single_choice",
      count
    );

    // 将生成的题目存入数据库
    const questionsToInsert = questions.map((q) => ({
      type: q.type,
      stem: q.stem,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      difficulty: q.difficulty || 3,
    }));

    const { data: saved, error: insertError } = await supabase
      .from("questions")
      .insert(questionsToInsert)
      .select();

    if (insertError) {
      console.error("保存题目失败:", insertError);
    }

    return NextResponse.json({
      questions: saved || questions.map((q, i) => ({
        id: `generated_${i}`,
        ...q,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "AI出题失败";
    console.error("AI 出题失败:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
