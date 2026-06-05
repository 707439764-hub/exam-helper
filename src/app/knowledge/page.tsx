"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, FileText, Tag, FolderOpen, Database } from "lucide-react";
import { knowledgeData } from "@/data/knowledge";

const categories = ["全部", "公文新闻", "管理学", "党建", "行业知识"];

// 知识库文件清单
const fileInventory = [
  { folder: "公文新闻", count: 28, key: "files" },
  { folder: "管理学", count: 28, key: "files" },
  { folder: "党建", count: 6, key: "files" },
  { folder: "行业知识", count: 3, key: "files" },
];

export default function KnowledgePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("全部");

  const filtered = knowledgeData.filter((kp) => {
    const matchSearch = kp.title.includes(search) || kp.content.includes(search);
    const matchCategory = category === "全部" || kp.category === category;
    return matchSearch && matchCategory;
  });

  // 各分类知识点数量
  const catCounts: Record<string, number> = {};
  categories.slice(1).forEach((cat) => {
    catCounts[cat] = knowledgeData.filter((k) => k.category === cat).length;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">知识库</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {knowledgeData.length} 个知识点 · 来源 65+ 个文件 · 覆盖四大分类
          </p>
        </div>
        <Link href="/knowledge/new">
          <Button>
            <Plus size={16} className="mr-1" />
            新增知识点
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="knowledge" className="w-full">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="knowledge" className="flex items-center gap-1">
            <Database size={14} /> 知识条目
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-1">
            <FolderOpen size={14} /> 源文件
          </TabsTrigger>
        </TabsList>

        {/* 知识条目 Tab */}
        <TabsContent value="knowledge" className="space-y-4 mt-4">
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索知识条目..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={category} onValueChange={(v) => setCategory(v || "全部")}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat} {cat !== "全部" ? `(${catCounts[cat] || 0})` : `(${knowledgeData.length})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>没有找到匹配的内容</p>
              </div>
            )}
            {filtered.map((kp) => (
              <Link key={kp.id} href={`/knowledge/${kp.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={
                            kp.category === "公文新闻" ? "bg-blue-100 text-blue-700"
                            : kp.category === "管理学" ? "bg-green-100 text-green-700"
                            : kp.category === "党建" ? "bg-red-100 text-red-700"
                            : "bg-purple-100 text-purple-700"
                          }>
                            {kp.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{kp.created_at}</span>
                        </div>
                        <h3 className="font-medium text-base">{kp.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{kp.content}</p>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {kp.tags.map((tag) => (
                            <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded">
                              <Tag size={10} className="inline mr-0.5" />{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        {/* 源文件 Tab */}
        <TabsContent value="files" className="space-y-4 mt-4">
          <div className="grid gap-4">
            {[
              {
                cat: "公文新闻",
                icon: "📰",
                color: "border-blue-200 bg-blue-50",
                files: [
                  "南航高质量发展总体思路解读.pdf", "2025年机务系统年中工作报告.pdf",
                  "战略解码启动会PPT材料汇编.pdf", "2026年战略解码实施方案.docx",
                  "严实细管理提升方案通知.pdf", "七场硬仗通知.pdf",
                  "补短板提质量创一流报告.pdf", "集团十五五规划建议通知.pdf",
                  "四季度机务安全工作通知.pdf", "内外部环境分析报告.pdf",
                  "科技创新与数字化转型交流材料.pdf", "2024年机务系统年中工作报告.pdf",
                  "吴榕新同志标准化讲话.pdf", "工程技术分公司标准化工作会纪要.pdf",
                  "故障风险分级管控工作会纪要.pdf", "标准化一季度/二季度/三季度会议纪要.pdf",
                  "机务人才工作会通知.pdf", "句子.docx", "知识库.docx",
                  "笔试技巧总结.docx", "素材库.docx", "报名人员信息汇总表.pdf",
                  "竞争性选拔报名表.pdf/xlsx", "硬仗策略建议收集表.ksheet",
                  "企业架构方法论与应用.pdf", "数据对标行动方案通知.pdf",
                  "重大故障管控提升方案通知.pdf",
                ],
              },
              {
                cat: "管理学",
                icon: "📊",
                color: "border-green-200 bg-green-50",
                files: [
                  "机务系统运行事件管理体系R8.docx", "如何提升MEL管控效率.docx",
                  "如何提升应急能力建设.docx", "如何提升航线能力建设.docx",
                  "如何管控停场或封存飞机.docx", "如何推动国产民机航线能力建设.docx",
                  "副本如何提升标准化.docx", "标准化项目如何落地.docx",
                  "文字文稿.docx", "标准化宣贯督导人才库通知.pdf",
                  "大运行机务值班管控课程包(7件套)", "硬仗推进表.ksheet",
                  "各二级部门工作职责.pdf", "职责第6章.pdf",
                  "附件4：项目揭榜响应书.doc", "答题.docx",
                ],
              },
              {
                cat: "党建",
                icon: "🚩",
                color: "border-red-200 bg-red-50",
                files: [
                  "2026年党建工作要点.pdf", "2026年党风廉政工作要点.pdf",
                  "四中全会必刷预测80题.pdf", "二十届四中全会考点总结.pdf",
                  "2025年机务人才队伍建设工作报告.pdf", "班组长队伍建设三周年材料汇编.pdf",
                ],
              },
              {
                cat: "行业知识",
                icon: "✈️",
                color: "border-purple-200 bg-purple-50",
                files: [
                  "竞聘考试(第一套).docx", "竞聘考试(第二套闭卷).docx",
                  "业务架构培训视频.mp4",
                ],
              },
              {
                cat: "额外工作文件",
                icon: "📋",
                color: "border-orange-200 bg-orange-50",
                files: [
                  "维修控制工作指引-定.pdf", "航空器维修运行应急方案.docx",
                  "航班大面积延误处置方案.pdf", "电签特情处置预案.docx",
                  "岗位工作清单.docx", "工作现场管理程序.docx",
                  "业务会议工作要点(冰雪中心).docx", "生产运行线标准化方案.docx",
                  "重要故障和重要系统保留工作提示.pdf", "应急医疗设备放行研讨.docx",
                  "试滑流程.docx", "春运保障检查报告.docx", "空客窄体日报.docx",
                ],
              },
            ].map((group) => (
              <Card key={group.cat} className={`border-l-4 ${group.color}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{group.icon}</span>
                    <h3 className="font-bold">{group.cat}</h3>
                    <Badge variant="secondary">{group.files.length} 个文件</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {group.files.map((f, i) => (
                      <div key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileText size={10} className="shrink-0" />
                        <span className="truncate">{f}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center py-4">
            📁 源文件位于桌面"知识库"文件夹 · 总计 65+ 个文件 · 已提取 77 个知识条目
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
