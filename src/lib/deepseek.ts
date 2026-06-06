/**
 * DeepSeek API 调用工具
 * 用于 AI 总结知识点和生成题目
 */

const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/anthropic";

function getApiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("未配置 DEEPSEEK_API_KEY，请检查环境变量");
  return key;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

async function callDeepSeek(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  const DEEPSEEK_API_KEY = getApiKey();
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
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API 调用失败: ${response.status}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((c: { type: string; text?: string }) => c.type === "text");
  if (!textBlock?.text) throw new Error("AI返回格式异常，未找到文本内容");
  return textBlock.text;
}

/**
 * 从文本中提取学习知识点
 */
export async function extractKnowledgePoints(
  articleText: string
): Promise<
  {
    title: string;
    content: string;
    category: string;
    tags: string[];
  }[]
> {
  const systemPrompt = `你是一位学习知识整理助手。你的任务是从用户提供的公文中提取学习相关的知识点。

知识范围包括四大类：
1. 公文新闻 - 内部公文、新闻报道中的重要信息
2. 管理学 - 管理学理论、案例分析要点
3. 党建 - 党建基础知识、政策方针
4. 行业知识 - 航空行业专业知识

请仔细阅读用户提供的文章，提取出所有可能成为考点的内容。每个知识点包括：
- title: 知识点标题（简洁明确）
- content: 知识点详细内容（2-3句话概括要点）
- category: 所属分类（公文新闻/管理学/党建/行业知识）
- tags: 相关标签，2-4个关键词

请以JSON格式返回，格式为：{"points": [{"title": "...", "content": "...", "category": "...", "tags": [...]}, ...]}`;

  const userMessage = `请从以下文章中提取学习知识点：\n\n${articleText}`;

  const result = await callDeepSeek(
    [{ role: "user", content: userMessage }],
    systemPrompt
  );

  // 尝试从回复中提取JSON
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.points || [];
  }
  throw new Error("无法解析AI返回的知识点");
}

/**
 * 基于知识点生成题目
 */
export async function generateQuestions(
  knowledgePoints: { title: string; content: string; category: string }[],
  questionType: string,
  count: number
): Promise<
  {
    type: string;
    stem: string;
    options: { label: string; text: string }[];
    answer: string;
    explanation: string;
    difficulty: number;
  }[]
> {
  const kpText = knowledgePoints
    .map(
      (kp, i) =>
        `[${i + 1}] 标题: ${kp.title}\n分类: ${kp.category}\n内容: ${kp.content}`
    )
    .join("\n\n");

  const systemPrompt = `你是一位知识题库出题助手。请根据提供的知识点生成高质量的练习题目。

题目要求：
- 紧扣知识点，考察核心内容
- 题目难度适中，适合学习
- 每道题都要有详细的解析，解释为什么选这个答案
- 案例分析题要结合管理实践

题型说明：
- single_choice: 单选题（4个选项，1个正确答案）
- multi_choice: 多选题（4个选项，至少2个正确答案）
- true_false: 判断题（对/错两个选项）
- essay: 案例分析题（提供场景，要求分析作答）

请以JSON格式返回：{"questions": [{"type": "single_choice|multi_choice|true_false|essay", "stem": "题干", "options": [{"label": "A", "text": "选项内容"}], "answer": "正确答案（单选题用字母，多选题用字母逗号分隔，判断题用对/错，论述题给出要点）", "explanation": "详细解析", "difficulty": 1-5}]}`;

  const userMessage = `请根据以下知识点生成${count}道${questionType}类型的题目：\n\n${kpText}`;

  const result = await callDeepSeek(
    [{ role: "user", content: userMessage }],
    systemPrompt
  );

  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.questions || [];
  }
  throw new Error("无法解析AI生成的题目");
}
