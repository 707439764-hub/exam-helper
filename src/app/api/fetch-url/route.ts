import { NextRequest, NextResponse } from "next/server";

/**
 * 抓取外部 URL 的内容
 * 支持基本认证（如果需要）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = body.url?.trim();
    const cookie = body.cookie?.trim(); // 可选的 Cookie 认证
    const username = body.username?.trim();
    const password = body.password?.trim();

    if (!url) {
      return NextResponse.json(
        { error: "请输入 URL 地址" },
        { status: 400 }
      );
    }

    // 构建请求头
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    };

    // Cookie 认证
    if (cookie) {
      headers["Cookie"] = cookie;
    }

    // HTTP Basic 认证
    let authHeader: string | undefined;
    if (username && password) {
      authHeader =
        "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
    }

    const fetchOptions: RequestInit = {
      method: "GET",
      headers,
      redirect: "follow",
    };

    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `请求失败 (${response.status})。可能需要登录认证，请尝试复制 Cookie 后粘贴。`,
        },
        { status: 400 }
      );
    }

    const html = await response.text();

    // 简单提取正文文本
    const text = extractText(html);

    if (!text || text.length < 50) {
      return NextResponse.json(
        {
          error:
            "未能提取到有效内容，页面可能需要登录。请在浏览器中打开该页面，全选复制内容后粘贴到左侧文本框。",
        },
        { status: 400 }
      );
    }

    // 尝试提取标题
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    return NextResponse.json({
      success: true,
      title,
      content: text.slice(0, 10000), // 限制长度
      length: text.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "抓取失败";
    return NextResponse.json(
      {
        error: `抓取失败: ${message}。请检查链接是否可访问，或尝试手动复制内容。`,
      },
      { status: 500 }
    );
  }
}

/**
 * 从 HTML 中提取正文文本
 */
function extractText(html: string): string {
  // 去掉 script/style 标签
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");

  // 去掉 HTML 标签，保留文本
  text = text.replace(/<[^>]+>/g, " ");

  // 解码 HTML 实体
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));

  // 清理空白
  text = text.replace(/\s+/g, " ").trim();

  return text;
}
