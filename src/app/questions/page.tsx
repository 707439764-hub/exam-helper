"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Brain, Search, Database, BookOpen } from "lucide-react";

interface Question {
  id: string;
  module: string;
  stem: string;
  answer: string;
  explanation: string;
}

const MODULES = ["全部", "管理学", "党建时政", "南航专项", "行测"];
const MODULE_LABELS: Record<string, string> = { "南航专项": "专项知识" };
const label = (m: string) => MODULE_LABELS[m] ?? m;

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("全部");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PER_PAGE = 30;

  useEffect(() => {
    fetch("/data/bank-index.json")
      .then((r) => r.json())
      .then((data) => setQuestions(data))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() =>
    questions.filter((q) => {
      const m = filter === "全部" || q.module === filter;
      const s = !search || q.stem.includes(search) || q.explanation.includes(search);
      return m && s;
    }),
    [questions, filter, search]
  );

  const total = filtered.length;
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(total / PER_PAGE);

  const counts: Record<string, number> = {};
  MODULES.slice(1).forEach((m) => {
    counts[m] = questions.filter((q) => q.module === m).length;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">题库</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? "加载中..." : `${questions.length} 道题目 · AI 生成`}
          </p>
        </div>
        <Link href="/quiz/practice">
          <Button>
            <Brain size={16} className="mr-1" />随机练习
          </Button>
        </Link>
      </div>

      {/* 分类统计 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MODULES.slice(1).map((m) => (
          <Card key={m} className={`cursor-pointer hover:shadow-md transition-shadow ${filter === m ? "ring-2 ring-primary" : ""}`}
            onClick={() => { setFilter(m === filter ? "全部" : m); setPage(0); }}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{counts[m] || 0}</p>
              <p className="text-xs text-muted-foreground">{label(m)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 搜索筛选 */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="搜索题目..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-10" />
        </div>
        <Select value={filter} onValueChange={(v) => { setFilter(v || "全部"); setPage(0); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>{MODULES.map((m) => <SelectItem key={m} value={m}>{label(m)}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* 题目列表 */}
      {loading ? (
        <div className="text-center py-12"><Database size={48} className="mx-auto mb-2 opacity-30 animate-pulse" /><p className="text-muted-foreground">加载题库...</p></div>
      ) : total === 0 ? (
        <div className="text-center py-12"><BookOpen size={48} className="mx-auto mb-2 opacity-30" /><p className="text-muted-foreground">题库为空</p><p className="text-xs text-muted-foreground mt-1">运行 node scripts/gen-questions.mjs 生成题目</p></div>
      ) : (
        <>
          <div className="grid gap-3">
            {paged.map((q, i) => (
              <Card key={q.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={
                      q.module === "管理学" ? "bg-green-100 text-green-700" :
                      q.module === "党建时政" ? "bg-red-100 text-red-700" :
                      q.module === "南航专项" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }>{label(q.module)}</Badge>
                    <span className="text-xs text-muted-foreground">#{page * PER_PAGE + i + 1}</span>
                  </div>
                  <p className="text-sm font-medium">{q.stem}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">答案：{q.answer}</Badge>
                    <span className="text-xs text-muted-foreground line-clamp-1">{q.explanation.slice(0, 80)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>上一页</Button>
              <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>下一页</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
