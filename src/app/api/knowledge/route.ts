import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// 获取知识点列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("knowledge_points")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category && category !== "全部") {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,content.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 创建知识点
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, tags, source } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: "标题、内容和分类为必填项" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("knowledge_points")
      .insert({
        title,
        content,
        category,
        tags: tags || [],
        source: source || "",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
