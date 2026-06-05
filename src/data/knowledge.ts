// 知识点数据（由桌面知识库文件夹自动生成）
// 运行 node scripts/process.mjs 可更新此文件

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: "公文新闻" | "管理学" | "党建" | "行业知识";
  tags: string[];
  source: string;
  created_at: string;
}

export const knowledgeData: KnowledgeItem[] = [
  {
    id: "1",
    title: "2024年度工作报告要点",
    content:
      "报告强调安全运行是民航的生命线。2024年将进一步完善安全管理体系（SMS），强化风险分级管控和隐患排查治理双重预防机制。推进数字化转型，打造'亲和精细'服务品牌，提升旅客满意度。实施人才强企战略，加强团队建设和专业人才培养。",
    category: "公文新闻",
    tags: ["年度报告", "安全工作", "高质量发展"],
    source: "内部资料",
    created_at: "2024-06-01",
  },
  {
    id: "2",
    title: "SWOT分析法在航空企业管理中的应用",
    content:
      "SWOT分析法是战略管理中的重要工具。S（Strengths）优势：企业内部有利因素，如品牌知名度高、航线网络完善。W（Weaknesses）劣势：企业内部不利因素，如运营成本高。O（Opportunities）机会：外部有利因素，如航空市场需求增长。T（Threats）威胁：外部不利因素，如高铁竞争、油价波动。应用要点：客观全面分析、制定SO/WO/ST/WT组合策略、定期更新分析结果。",
    category: "管理学",
    tags: ["战略管理", "SWOT", "案例分析"],
    source: "",
    created_at: "2024-05-28",
  },
  {
    id: "3",
    title: "新时代党的建设总要求",
    content:
      "坚持和加强党的全面领导，坚持党要管党、全面从严治党。以加强党的长期执政能力建设、先进性和纯洁性建设为主线，以党的政治建设为统领，以坚定理想信念宗旨为根基，以调动全党积极性、主动性、创造性为着力点。全面推进党的政治建设、思想建设、组织建设、作风建设、纪律建设，把制度建设贯穿其中。",
    category: "党建",
    tags: ["党建理论", "从严治党"],
    source: "",
    created_at: "2024-05-25",
  },
  {
    id: "4",
    title: "民用航空安全管理体系(SMS)要点",
    content:
      "安全管理体系（SMS）包括四大支柱：安全政策、风险管理、安全保证和安全促进。安全政策是顶层设计，明确安全目标和承诺。风险管理通过危险识别和风险评估来预防事故。安全保证通过持续监控和审计确保安全绩效。安全促进通过培训和沟通建立安全文化。",
    category: "行业知识",
    tags: ["SMS", "安全管理", "民航"],
    source: "",
    created_at: "2024-05-20",
  },
];
