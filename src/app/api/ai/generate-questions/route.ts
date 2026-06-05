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

  const systemPrompt = `你是**南方新华猎头公司**航空机务竞聘命题组专家，正在为某大型航空集团机务系统执行层干部竞聘考试命题。

考生画像：MCC维修控制中心值班经理/车间主任等执行层干部，竞聘分公司管理岗。他们长期在一线带团队、处理突发故障、协调跨部门资源。

考试定位：管理能力和胜任力评估，而非知识记忆测验。

**命题铁律：**
1. 每道题必须是一个**真实管理场景**——把自己当成考生，你会在值班时遇到的那种情况
2. 场景类型覆盖：AOG故障资源调配、跨部门目标冲突调解、安全管理决策、团队士气激励、应急指挥决断、成本与安全平衡、变革管理推进、制度执行与灵活应变
3. 四个选项要代表**四种典型管理风格**（如命令型/协商型/授权型/回避型），每个选项读起来都像有经验的干部会做的选择
4. 正确答案应体现：系统思维 > 单一思维、主动担当 > 被动等待、机制建设 > 临时救火、安全底线 > 效率优先
5. 解析要求：点出正确选项的管理学依据（可用菲德勒权变、目标管理、双因素等理论），同时分析每个干扰选项的思维误区

**参考真题风格示例：**
"某MCC值班经理发现近期维修差错率上升，分析发现新员工占比30%且培训不足，老员工存在经验主义倾向。以下哪种措施最能有效解决问题？"
A.加大处罚力度，对出现差错的人员从重处理
B.实施师徒结对，建立传帮带机制并配套激励
C.增加培训频次，每周组织全员程序培训和考核
D.调整排班，新老员工分开作业避免相互影响
→ 答案B，解析：建立制度化的知识传递机制，标本兼治。A是负向激励，C缺乏实践转化，D人为割裂团队。

严格JSON格式（只输出JSON，不要任何其他文字）：
{"questions":[{"type":"single_choice","stem":"","options":[{"label":"A","text":""},{"label":"B","text":""},{"label":"C","text":""},{"label":"D","text":""}],"answer":"","explanation":"","difficulty":3}]}`;

  const userMessage = `命题素材（来自该航空集团内部文件）：\n\n${kpText}\n\n请基于上述素材，以南方新华猎头公司命题专家身份，生成${count}道管理胜任力单选题。`;

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
