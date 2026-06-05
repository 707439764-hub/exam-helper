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
import { Plus, Search, FileText, Tag } from "lucide-react";
import { knowledgeData } from "@/data/knowledge";

const categories = ["全部", "公文新闻", "管理学", "党建", "行业知识"];

export default function KnowledgeListPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("全部");

  const filtered = knowledgeData.filter((kp) => {
    const matchSearch =
      kp.title.includes(search) || kp.content.includes(search);
    const matchCategory = category === "全部" || kp.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">知识点管理</h1>
          <p className="text-muted-foreground text-sm mt-1">
            管理所有学习知识点，按分类浏览和搜索
          </p>
        </div>
        <Link href="/knowledge/new">
          <Button>
            <Plus size={16} className="mr-1" />
            新增知识点
          </Button>
        </Link>
      </div>

      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="搜索知识点..."
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
