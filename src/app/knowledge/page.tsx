"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Search, FileText, Tag, Trash2 } from "lucide-react";

// 模拟数据
const mockData = [
  {
    id: "1",
    title: "南航2024年度工作报告要点",
    content: "报告强调安全运行是民航的生命线...",
    category: "公文新闻",
    tags: ["年度报告", "安全工作", "2024"],
    created_at: "2024-06-01",
  },
  {
    id: "2",
    title: "SWOT分析法在航空企业管理中的应用",
    content: "SWOT分析通过评估企业的优势、劣势、机会和威胁...",
    category: "管理学",
    tags: ["战略管理", "SWOT", "案例分析"],
    created_at: "2024-05-28",
  },
  {
    id: "3",
    title: "新时代党的建设总要求",
    content: "坚持和加强党的全面领导，坚持党要管党、全面从严治党...",
    category: "党建",
    tags: ["党建理论", "从严治党"],
    created_at: "2024-05-25",
  },
  {
    id: "4",
    title: "民用航空安全管理体系(SMS)要点",
    content: "安全管理体系包括安全政策、风险管理、安全保证和安全促进四大支柱...",
    category: "行业知识",
    tags: ["SMS", "安全管理", "民航"],
    created_at: "2024-05-20",
  },
  {
    id: "5",
    title: "波特五力模型分析航空市场竞争格局",
    content: "五力模型帮助分析行业竞争态势...",
    category: "管理学",
    tags: ["竞争战略", "波特五力", "行业分析"],
    created_at: "2024-05-18",
  },
  {
    id: "6",
    title: "党的二十大报告关于国企改革论述",
    content: "深化国资国企改革，加快国有经济布局优化和结构调整...",
    category: "党建",
    tags: ["二十大", "国企改革", "政策"],
    created_at: "2024-05-15",
  },
];

const categories = ["全部", "公文新闻", "管理学", "党建", "行业知识"];

export default function KnowledgeListPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("全部");
  const [knowledge, setKnowledge] = useState(mockData);

  const filtered = knowledge.filter((kp) => {
    const matchSearch =
      kp.title.includes(search) || kp.content.includes(search);
    const matchCategory = category === "全部" || kp.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* 顶部栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">知识点管理</h1>
          <p className="text-muted-foreground text-sm mt-1">
            管理你的所有复习知识点，按分类浏览和搜索
          </p>
        </div>
        <Link href="/knowledge/new">
          <Button>
            <Plus size={16} className="mr-1" />
            新增知识点
          </Button>
        </Link>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="搜索知识点标题或内容..."
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
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 知识点列表 */}
      <div className="grid gap-4">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>没有找到匹配的知识点</p>
            <p className="text-sm">试试调整筛选条件或新增知识点</p>
          </div>
        )}
        {filtered.map((kp) => (
          <Link key={kp.id} href={`/knowledge/${kp.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="secondary"
                        className={
                          kp.category === "公文新闻"
                            ? "bg-blue-100 text-blue-700"
                            : kp.category === "管理学"
                            ? "bg-green-100 text-green-700"
                            : kp.category === "党建"
                            ? "bg-red-100 text-red-700"
                            : "bg-purple-100 text-purple-700"
                        }
                      >
                        {kp.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {kp.created_at}
                      </span>
                    </div>
                    <h3 className="font-medium text-base">{kp.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {kp.content}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {kp.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-muted px-2 py-0.5 rounded"
                        >
                          <Tag size={10} className="inline mr-0.5" />
                          {tag}
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
    </div>
  );
}
