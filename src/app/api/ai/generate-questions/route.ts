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

  const systemPrompt = `你是南方新华猎头公司航空机务竞聘命题组首席专家。你正在为某大型航空集团机务系统执行层干部竞聘分公司管理岗命题。

考生是MCC值班经理/车间主任，长期带团队、处理突发放行故障、协调跨部门资源。考试目的是评估其管理胜任力：决策质量、系统思维、团队领导、应急决断、安全底线意识。

【命题规范——务必遵守】
1. 每道题是一个真实的机务管理场景，不是知识问答
2. 四个选项代表四种不同层次的管理思维，每个看起来都"像正确答案"，区分度在于管理成熟度
3. 正确答案体现：系统思维、主动担当、机制建设、安全第一
4. 干扰项代表常见管理误区：简单粗暴、推卸上交、头痛医头、经验主义

【参考真题——严格按照这个深度和风格出题】

真题1: 某维修车间班组长接到紧急任务：一架B737MAX飞机过站时发现左发液压系统泄漏，需在45分钟内排故避免航班取消。车间有3名具备液压资质工程师，1人正在执行定检，2人刚完成夜班在休息。最合理处置？
A.立即召回2名休息工程师，承诺加班补偿
B.暂停定检任务，抽调该工程师优先处理
C.评估泄漏程度，与运控协商是否可延长过站时间
D.同时召回休息人员并申请MCC协调其他车间支援→答案D，考察系统思维和风险分散

真题2: MCC值班经理发现维修差错率上升，新员工占30%培训不足，老员工经验主义。最有效措施？
A.加大处罚力度，从严处理
B.实施师徒结对，建立传帮带机制并配套激励
C.增加培训频次，每周全员考核
D.调整排班，新老分开作业→答案B，考察团队建设和知识管理

真题3: 项目组引进AR辅助维修系统，一线抵触认为增加负担。最有效推进策略？
A.强制执行，不使用者按违规处理
B.选择接受度高的班组先行试点，以点带面推广
C.邀请厂家培训，强调系统先进性
D.征求一线意见，大幅修改系统满足所有需求→答案B，考察变革管理

真题4: 关于国企党的领导，习近平总书记强调坚持党的领导、加强党的建设是国有企业的？
A.根本原则 B.光荣传统和独特优势 C."根"和"魂" D.政治保证→答案C

真题5: 根据菲德勒权变理论，在高度有利或高度不利情境下，最有效的领导方式是？
A.关系导向型 B.任务导向型 C.民主参与型 D.授权型→答案B

请以完全相同的命题深度和风格，生成${count}道单选题。严格JSON：
{"questions":[{"type":"single_choice","stem":"","options":[{"label":"A","text":""},{"label":"B","text":""},{"label":"C","text":""},{"label":"D","text":""}],"answer":"","explanation":"","difficulty":3}]}`;

  const userMessage = `命题素材：\n${kpText}\n\n请基于素材，以南方新华命题专家身份，生成${count}道与参考真题同等深度的管理情景单选题。`;

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
