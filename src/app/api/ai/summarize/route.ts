import { NextRequest, NextResponse } from "next/server";
import { extractKnowledgePoints } from "@/lib/deepseek";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "请提供需要分析的文章内容" },
        { status: 400 }
      );
    }

    const points = await extractKnowledgePoints(text);

    return NextResponse.json({ points });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "AI分析失败";
    console.error("AI 总结失败:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
