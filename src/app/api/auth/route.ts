import { NextRequest, NextResponse } from "next/server";

const CORRECT_PASSWORD = "023022";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (password === CORRECT_PASSWORD) {
      const response = NextResponse.json({ success: true });

      // 设置 auth Cookie（30 天有效）
      response.cookies.set("auth_token", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 天
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: "密码错误" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "请求无效" },
      { status: 400 }
    );
  }
}
