"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, XCircle, Lightbulb, Brain, RefreshCw } from "lucide-react";

// 模拟错题数据
const mockWrongQuestions = [
  {
    id: "w1",
    type: "single_choice",
    stem: "以下哪项不属于SMS的四大支柱？",
    options: [
      { label: "A", text: "安全政策" },
      { label: "B", text: "风险管理" },
      { label: "C", text: "市场营销" },
      { label: "D", text: "安全增值" },
    ],
    answer: "C",
    userAnswer: "D",
    explanation:
      "SMS四大支柱是：安全政策、风险管理、安全保证和安全促进。其中'安全保证'不等于'安全增值'，而市场营销不属于SMS体系。正确答案是C。",
    category: "行业知识",
    wrongCount: 3,
    date: "2024-06-03",
  },
  {
    id: "w2",
    type: "multi_choice",
    stem: "波特五力模型包含哪些力量？（多选）",
    options: [
      { label: "A", text: "供应商议价能力" },
      { label: "B", text: "购买者议价能力" },
      { label: "C", text: "内部管理能力" },
      { label: "D", text: "替代品威胁" },
    ],
    answer: "A,B,D",
    userAnswer: "A,D",
    explanation:
      "波特五力模型：供应商议价能力、购买者议价能力、新进入者威胁、替代品威胁、同业竞争者竞争程度。你漏选了B（购买者议价能力），这也是五力之一。",
    category: "管理学",
    wrongCount: 2,
    date: "2024-06-01",
  },
  {
    id: "w3",
    type: "true_false",
    stem: "'党建'工作中提到的'四个意识'包括政治意识、大局意识、核心意识、看齐意识。",
    options: [
      { label: "A", text: "正确" },
      { label: "B", text: "错误" },
    ],
    answer: "A",
    userAnswer: "B",
    explanation:
      "四个意识确实是指：政治意识、大局意识、核心意识、看齐意识。这是正确的。",
    category: "党建",
    wrongCount: 1,
    date: "2024-05-30",
  },
];

export default function ReviewPage() {
  const [category, setCategory] = useState("全部");
  const [wrongQuestions] = useState(mockWrongQuestions);

  const filtered = wrongQuestions.filter(
    (q) => category === "全部" || q.category === category
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/quiz">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">错题回顾</h1>
          <p className="text-muted-foreground text-sm mt-1">
            回顾做错的题目，加深理解
          </p>
        </div>
      </div>

      {/* 筛选和统计 */}
      <div className="flex gap-3 items-center flex-wrap">
        <Select value={category} onValueChange={(v) => setCategory(v || "全部")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="全部">全部</SelectItem>
            <SelectItem value="公文新闻">公文新闻</SelectItem>
            <SelectItem value="管理学">管理学</SelectItem>
            <SelectItem value="党建">党建</SelectItem>
            <SelectItem value="行业知识">行业知识</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="gap-1">
          <XCircle size={14} />
          共 {filtered.length} 道错题
        </Badge>
        {filtered.length > 0 && (
          <Link href="/quiz/practice?review=true">
            <Button variant="outline" size="sm">
              <RefreshCw size={14} className="mr-1" />
              重新练习错题
            </Button>
          </Link>
        )}
      </div>

      {/* 错题列表 */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Brain size={48} className="mx-auto mb-4 text-green-500 opacity-50" />
            <p className="text-lg font-medium">暂无错题记录</p>
            <p className="text-sm text-muted-foreground mt-1">
              继续练习，做错了就会在这里看到
            </p>
            <Link href="/quiz/practice">
              <Button className="mt-4">
                <Brain size={16} className="mr-1" />
                去练习
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((q) => (
            <Card key={q.id} className="border-l-4 border-l-red-400">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{q.category}</Badge>
                  <Badge
                    variant="secondary"
                    className={
                      q.type === "single_choice"
                        ? "bg-blue-100 text-blue-700"
                        : q.type === "multi_choice"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }
                  >
                    {q.type === "single_choice"
                      ? "单选"
                      : q.type === "multi_choice"
                      ? "多选"
                      : "判断"}
                  </Badge>
                  {q.wrongCount > 1 && (
                    <Badge variant="destructive" className="text-xs">
                      错了 {q.wrongCount} 次
                    </Badge>
                  )}
                </div>

                <p className="font-medium mb-3">{q.stem}</p>

                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 font-medium shrink-0">
                      你的答案：
                    </span>
                    <span className="text-red-500 line-through">
                      {q.userAnswer}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 font-medium shrink-0">
                      正确答案：
                    </span>
                    <span className="text-green-500 font-medium">
                      {q.answer}
                    </span>
                  </div>
                </div>

                <div className="mt-3 bg-blue-50 rounded-lg p-3 flex items-start gap-2">
                  <Lightbulb size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {q.explanation}
                  </p>
                </div>

                <div className="text-xs text-muted-foreground mt-2">
                  最近答错：{q.date}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
