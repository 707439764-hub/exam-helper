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

    // 随机抽取素材——喂给AI的素材量随题量增加，确保30题模考有足够多样的素材
    const shuffled = [...kps].sort(() => Math.random() - 0.5);
    const materialCount = Math.min(Math.max(count, 12), shuffled.length);
    const selected = shuffled.slice(0, materialCount);

    let questions;
    let usedAI = false;
    try {
      questions = await callAI(selected, count);
      usedAI = true;
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

    return NextResponse.json({ questions, usedAI });
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

  const systemPrompt = `身份：受聘南方新华猎头，专职命制【南航央企机务维修执行层干部竞聘笔试单选题】，全卷统一为单项选择题，每题配备A、B、C、D四个备选答案。

出题范围&固定题量配比（按需出题，优先遵循配比）：
1.管理学模块：含机务班组长、维修项目负责人实景案例分析+经典管理学基础理论，案例紧贴飞机定检、排故管控、班组人员管理、项目统筹等机务一线场景；
2.党建时政模块：党章基础知识、树立正确政绩观、十五五发展规划、央企国企党建、航空领域时政政策；
3.南航专项模块：南航集团发展战略、机务管理新规、安全管理方针、集团现行管理制度；
4.行测模块：公务员行测题型，包含数字运算、逻辑判断、图形推理、言语逻辑四类。

命题硬性要求：
1.干扰项设置贴合机务人员常见易错认知，不出现明显错项；
2.题干立足MCC管控、维修基地运营、执行层管理实务，贴合机务中层干部岗位考点；
3.题目不重复，结合本年度最新南航发文、时政文件；
4.每道题附带精炼考点速记解析。

【避免笼统——这是质量红线】
- 管理学案例题必须有具体情境：具体机型(B737/A320/C909)、具体故障(液压渗漏/EDP漏油/发动机滑油消耗超标)、具体约束(过站45分钟/航材未到/人员资质)、具体冲突(运行正点vs安全裕度)，让考生像在真实值班一样做决策。严禁出现"关于XX，以下理解正确的是"这类空泛问法。
- 党建时政题要落到具体表述、具体文件、具体数字(如"十五五"规划期2026-2030、四中全会时间、四个意识具体内容)，考查精确记忆而非模糊判断。
- 行测题要给出完整可解的题目(数字运算给全数据、逻辑判断给完整前提、图形推理用文字描述规律)，确保有唯一正确答案。
- 四个选项长度相近、迷惑性强，正确答案位置随机分布(不要总是某个字母)。
- 解析要点出"为什么对"和"错项错在哪"，附记忆口诀或要点。

严格JSON格式：
{"questions":[{"type":"single_choice","module":"管理学|党建时政|南航专项|行测|民航法规","stem":"","options":[{"label":"A","text":""},{"label":"B","text":""},{"label":"C","text":""},{"label":"D","text":""}],"answer":"","explanation":""}]}`;

  const userMessage = `命题素材（仅供参考，可结合你掌握的南航及时政知识扩展）：\n${kpText}\n\n请生成${count}道高质量单选题，优先按配比：管理学约${Math.round(count*8/30)}题、党建时政约${Math.round(count*9/30)}题、南航专项约${Math.round(count*5/30)}题、行测约${Math.round(count*6/30)}题、民航法规约${Math.round(count*2/30)}题。务必具体、不笼统，每道题都要让考生有真实考场的感觉。`;

  const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": DEEPSEEK_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "deepseek-v4-pro", max_tokens: 8192, temperature: 1.0, system: systemPrompt, messages: [{ role: "user", content: userMessage }] }),
  });

  if (!response.ok) throw new Error(`API错误: ${response.status}`);
  const data = await response.json();
  const text = data.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return (parsed.questions || []).map((q: Record<string, unknown>, i: number) => ({
      id: `ai_${Date.now()}_${i}`, type: "single_choice",
      module: q.module || "",
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
