"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, XCircle, Lightbulb, Trash2 } from "lucide-react";

interface WrongEntry {
  q: { id: string; stem: string; answer: string; explanation: string };
  userAnswer: string;
  date: string;
}

export default function ReviewPage() {
  const [wrongList, setWrongList] = useState<WrongEntry[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("wrong_answers");
      if (stored) setWrongList(JSON.parse(stored).reverse());
    } catch (_) {}
  }, []);

  const clearAll = () => {
    localStorage.removeItem("wrong_answers");
    setWrongList([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/quiz"><Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">错题回顾</h1>
          <p className="text-muted-foreground text-sm mt-1">答题时做错的题目自动记录在这里</p>
        </div>
      </div>

      {wrongList.length > 0 && (
        <div className="flex gap-2">
          <span className="text-sm text-muted-foreground flex items-center gap-1"><XCircle size={14} />共 {wrongList.length} 道错题</span>
          <Button variant="ghost" size="sm" className="text-red-500" onClick={clearAll}><Trash2 size={14} className="mr-1" />清空</Button>
        </div>
      )}

      {wrongList.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <p className="text-lg text-muted-foreground">暂无错题记录</p>
          <p className="text-sm text-muted-foreground mt-1">去练习答题，做错的会自动出现在这里</p>
          <Link href="/quiz/practice"><Button className="mt-4">去练习</Button></Link>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {wrongList.map((w, i) => (
            <Card key={i} className="border-l-4 border-l-red-400">
              <CardContent className="p-4">
                <p className="font-medium mb-2">{w.q.stem}</p>
                <div className="text-sm space-y-1 mb-2">
                  <p className="text-red-500">你的答案：{w.userAnswer}</p>
                  <p className="text-green-600 font-medium">正确答案：{w.q.answer}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 flex gap-2">
                  <Lightbulb size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{w.q.explanation}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">答错日期：{w.date}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
