"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Tag,
  ExternalLink,
  Brain,
  Trash2,
  Edit,
} from "lucide-react";

// 模拟数据
const mockData: Record<string, {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  source: string;
  created_at: string;
}> = {
  "1": {
    id: "1",
    title: "南航2024年度工作报告要点",
    content: `南航2024年度工作报告强调了以下几个核心要点：

一、安全运行是生命线
民航工作的首要任务是确保绝对安全。2024年南航将进一步完善安全管理体系（SMS），强化风险分级管控和隐患排查治理双重预防机制。

二、高质量发展目标
提升服务品质，优化航线网络布局，推进数字化转型。重点打造"亲和精细"服务品牌，提升旅客满意度。

三、深化改革创新
持续推进三项制度改革，完善市场化经营机制。加强科技创新投入，推动智慧民航建设。

四、人才队伍建设
实施人才强企战略，加强干部队伍建设和专业人才培养，为高质量发展提供人才支撑。`,
    category: "公文新闻",
    tags: ["年度报告", "安全工作", "高质量发展", "2024"],
    source: "南航内网",
    created_at: "2024-06-01",
  },
  "2": {
    id: "2",
    title: "SWOT分析法在航空企业管理中的应用",
    content: `SWOT分析法是战略管理中的重要工具，在航空企业管理中有广泛应用：

一、SWOT模型概述
S（Strengths）优势：企业内部的有利因素
W（Weaknesses）劣势：企业内部的不利因素
O（Opportunities）机会：外部环境中的有利因素
T（Threats）威胁：外部环境中的不利因素

二、航空企业SWOT分析示例
优势：品牌知名度高、航线网络完善、机队规模大
劣势：运营成本高、体制机制不够灵活
机会：航空市场需求增长、政策支持
威胁：高铁竞争、油价波动、疫情风险

三、应用要点
1. 客观全面分析内外部因素
2. 制定SO、WO、ST、WT组合策略
3. 定期更新SWOT分析结果`,
    category: "管理学",
    tags: ["战略管理", "SWOT", "案例分析"],
    source: "",
    created_at: "2024-05-28",
  },
};

export default function KnowledgeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const kp = mockData[id];

  if (!kp) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">知识点不存在</p>
        <Link href="/knowledge">
          <Button variant="outline" className="mt-4">
            <ArrowLeft size={16} className="mr-1" />
            返回列表
          </Button>
        </Link>
      </div>
    );
  }

  const categoryColor =
    kp.category === "公文新闻"
      ? "bg-blue-100 text-blue-700"
      : kp.category === "管理学"
      ? "bg-green-100 text-green-700"
      : kp.category === "党建"
      ? "bg-red-100 text-red-700"
      : "bg-purple-100 text-purple-700";

  const categoryIcon =
    kp.category === "公文新闻"
      ? "📰"
      : kp.category === "管理学"
      ? "📊"
      : kp.category === "党建"
      ? "🚩"
      : "✈️";

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <Link href="/knowledge">
        <Button variant="ghost">
          <ArrowLeft size={16} className="mr-1" />
          返回知识点列表
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{categoryIcon}</span>
            <Badge className={categoryColor}>{kp.category}</Badge>
            <span className="text-xs text-muted-foreground">
              创建于 {kp.created_at}
            </span>
          </div>
          <CardTitle className="text-xl">{kp.title}</CardTitle>
          <div className="flex gap-1 flex-wrap">
            {kp.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-muted px-2 py-0.5 rounded inline-flex items-center gap-1"
              >
                <Tag size={10} />
                {tag}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {kp.content}
          </div>

          {kp.source && (
            <div className="mt-4 flex items-center gap-1 text-sm text-muted-foreground">
              <ExternalLink size={14} />
              来源：{kp.source}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 操作区 */}
      <div className="flex gap-3 flex-wrap">
        <Button variant="outline">
          <Edit size={16} className="mr-1" />
          编辑知识点
        </Button>
        <Button variant="outline" className="text-green-600">
          <Brain size={16} className="mr-1" />
          基于此生成题目
        </Button>
        <Button variant="outline" className="text-red-500">
          <Trash2 size={16} className="mr-1" />
          删除
        </Button>
      </div>
    </div>
  );
}
