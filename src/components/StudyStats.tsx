"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { XCircle, CheckCircle2 } from "lucide-react";
import { knowledgeData } from "@/data/knowledge";

const CATEGORIES = ["公文新闻", "管理学", "党建", "行业知识"] as const;

export function StudyStats() {
  const [wrongCount, setWrongCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    try {
      const wrong = JSON.parse(localStorage.getItem("wrong_answers") || "[]");
      setWrongCount(wrong.length);

      const history = JSON.parse(localStorage.getItem("quiz_history") || "[]");
      setTotalAnswered(history.length);
      setCorrectCount(history.filter((h: { isCorrect: boolean }) => h.isCorrect).length);
    } catch (_) {}
  }, []);

  const totalKnowledge = knowledgeData.length;

  return (
    <div className="space-y-4">
      {CATEGORIES.map((cat) => {
        const count = knowledgeData.filter((k) => k.category === cat).length;
        const pct = Math.round((count / totalKnowledge) * 100);
        return (
          <div key={cat}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{cat}</span>
              <span className="text-muted-foreground">{count} 个知识点</span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
        );
      })}

      <div className="pt-2 flex items-center justify-between border-t">
        {totalAnswered > 0 ? (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle2 size={14} />
            已答 {totalAnswered} 题，正确率{" "}
            {Math.round((correctCount / totalAnswered) * 100)}%
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">尚未开始练习</span>
        )}
        {wrongCount > 0 && (
          <Link
            href="/quiz/review"
            className="flex items-center gap-1 text-sm text-red-500 hover:underline"
          >
            <XCircle size={14} />
            错题 {wrongCount} 道
          </Link>
        )}
      </div>
    </div>
  );
}
