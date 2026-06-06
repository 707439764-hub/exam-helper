"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle, XCircle, Lightbulb, Brain, RotateCcw, BookOpen, StopCircle,
  Database,
} from "lucide-react";

interface Question {
  id: string;
  module: string;
  stem: string;
  options: { label: string; text: string }[];
  answer: string;
  explanation: string;
}

interface HistoryItem {
  q: Question;
  userAnswer: string;
  isCorrect: boolean;
}

const MOD_MAP: Record<string, string> = {
  "全部": "",
  "管理学": "管理学",
  "党建时政": "党建时政",
  "南航专项": "南航专项",
  "行测": "行测",
};

export default function PracticePage() {
  const [started, setStarted] = useState(false);
  const [category, setCategory] = useState("全部");
  const [bank, setBank] = useState<Question[]>([]);
  const [bankLoaded, setBankLoaded] = useState(false);

  const [current, setCurrent] = useState<Question | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [curAns, setCurAns] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stopped, setStopped] = useState(false);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());

  const correctCount = history.filter((h) => h.isCorrect).length;

  // 加载题库
  const loadBank = () => {
    const url = category === "全部"
      ? "/data/question-bank.json"
      : `/data/bank-${category}.json`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setBank(Array.isArray(data) ? data : []); setBankLoaded(true); })
      .catch(() => setBankLoaded(true));
  };

  useEffect(() => { loadBank(); }, [category]);

  const saveWrong = (q: Question, userAnswer: string) => {
    try {
      const stored = localStorage.getItem("wrong_answers");
      const wrong: { q: Question; userAnswer: string; date: string }[] = stored ? JSON.parse(stored) : [];
      const entry = { q: { ...q }, userAnswer, date: new Date().toISOString().slice(0, 10) };
      const idx = wrong.findIndex((w) => w.q.stem === q.stem);
      if (idx >= 0) {
        wrong[idx] = entry; // 同一题更新而非追加
      } else {
        wrong.push(entry);
      }
      localStorage.setItem("wrong_answers", JSON.stringify(wrong.slice(-100)));
    } catch (_) {}
  };

  // 从题库随机取一题
  const pickQuestion = (currentBank: Question[] = bank) => {
    const modFilter = MOD_MAP[category] || "";
    const pool = modFilter ? currentBank.filter((q) => q.module === modFilter) : currentBank;
    const available = pool.filter((q) => !usedIds.has(q.id));
    if (available.length === 0) {
      setUsedIds(new Set());
      const q = pool[Math.floor(Math.random() * pool.length)];
      if (!q) return null;
      setUsedIds(new Set([q.id]));
      return q;
    }
    const q = available[Math.floor(Math.random() * available.length)];
    setUsedIds((prev) => new Set(prev).add(q.id));
    return q;
  };

  const handleStart = () => {
    setStarted(true);
    setHistory([]);
    setStopped(false);
    setUsedIds(new Set());
    setCurrent(pickQuestion(bank));
  };

  const handleSubmit = () => {
    if (!current || !curAns) return;
    setSubmitted(true);
    const isCorrect = curAns === current.answer;
    setHistory((prev) => [...prev, { q: current, userAnswer: curAns, isCorrect }]);
    if (!isCorrect) saveWrong(current, curAns);
  };

  const handleNext = () => {
    setSubmitted(false);
    setCurAns("");
    setCurrent(pickQuestion());
  };

  const handleStop = () => setStopped(true);

  // ===== 首页 =====
  if (!started) {
    const counts: Record<string, number> = { "管理学": 0, "党建时政": 0, "南航专项": 0, "行测": 0 };
    bank.forEach((q) => { if (q.module in counts) counts[q.module]++; });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">随机练习</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {bankLoaded ? `题库 ${bank.length} 题 · 随机出题 · 无限练习` : "加载题库中..."}
          </p>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">选择范围</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>出题范围</Label>
              <Select value={category} onValueChange={(v) => setCategory(v || "全部")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="全部">全部（{bank.length}题）</SelectItem>
                  <SelectItem value="管理学">管理学（{counts["管理学"]}题）</SelectItem>
                  <SelectItem value="党建时政">党建时政（{counts["党建时政"]}题）</SelectItem>
                  <SelectItem value="南航专项">南航专项（{counts["南航专项"]}题）</SelectItem>
                  <SelectItem value="行测">行测（{counts["行测"]}题）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {bank.length === 0 && bankLoaded && (
              <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-700 flex items-center gap-2">
                ⚠️ 题库为空，请运行 <code className="bg-white px-1 rounded">node scripts/gen-questions.mjs</code> 生成题目
              </div>
            )}
            <Button onClick={handleStart} className="w-full" size="lg" disabled={bank.length === 0}>
              <Brain size={18} className="mr-2" />开始随机练习
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== 结束页 =====
  if (stopped) {
    const acc = history.length > 0 ? Math.round((correctCount / history.length) * 100) : 0;
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card className="text-center">
          <CardContent className="p-8">
            <div className="text-4xl mb-4">{acc >= 60 ? "🎉" : "📚"}</div>
            <h2 className="text-2xl font-bold mb-2">练习结束</h2>
            <div className="text-5xl font-bold text-primary my-6">{correctCount}/{history.length}</div>
            <p className="text-muted-foreground">正确率 {acc}%</p>
          </CardContent>
        </Card>
        {history.length > 0 && (
          <div className="space-y-3">
            {history.map((h, i) => (
              <Card key={i} className={h.isCorrect ? "border-l-4 border-l-green-400" : "border-l-4 border-l-red-400"}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">第{i + 1}题</span>
                    {h.isCorrect ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                  </div>
                  <p className="text-sm">{h.q.stem}</p>
                  {!h.isCorrect && (
                    <p className="mt-1 text-sm"><span className="text-red-500">你选：{h.userAnswer}</span>{" → "}<span className="text-green-600 font-medium">正确：{h.q.answer}</span></p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <Button onClick={() => { setStarted(false); setStopped(false); }} size="lg"><RotateCcw size={16} className="mr-1" />重新开始</Button>
          <Link href="/quiz/review"><Button variant="outline" size="lg"><BookOpen size={16} className="mr-1" />错题回顾</Button></Link>
        </div>
      </div>
    );
  }

  // ===== 无题目 =====
  if (!current) {
    return (
      <div className="flex items-center justify-center py-20">
        <Database size={32} className="animate-pulse text-muted-foreground" />
      </div>
    );
  }

  // ===== 答题中 =====
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm px-3 py-1">📝 第 {history.length + 1} 题</Badge>
          {current.module && <Badge className="text-xs" variant="outline">{current.module}</Badge>}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>✅ {correctCount}</span>
          <span>❌ {history.length - correctCount}</span>
          <Button variant="ghost" size="sm" onClick={handleStop} className="text-muted-foreground">
            <StopCircle size={14} className="mr-1" />结束
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-normal leading-relaxed">{current.stem}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {current.options?.map((opt) => {
            const sel = curAns === opt.label;
            const correct = submitted && current.answer === opt.label;
            const wrong = submitted && sel && !correct;
            return (
              <button key={opt.label} onClick={() => { if (!submitted) setCurAns(opt.label); }} disabled={submitted}
                className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center gap-3 ${
                  correct ? "border-green-500 bg-green-50" : wrong ? "border-red-500 bg-red-50"
                  : sel ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                <span className={`w-7 h-7 rounded-full border flex items-center justify-center text-sm shrink-0 ${sel ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>{opt.label}</span>
                <span className="text-sm">{opt.text}</span>
                {correct && <CheckCircle size={18} className="text-green-500 ml-auto" />}
                {wrong && <XCircle size={18} className="text-red-500 ml-auto" />}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {submitted && (
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {curAns === current.answer
                ? <><CheckCircle size={18} className="text-green-500" /><span className="font-medium text-green-700">正确！</span></>
                : <><XCircle size={18} className="text-red-500" /><span className="font-medium text-red-700">错误 · 正确答案：{current.answer}</span></>}
            </div>
            <div className="flex gap-2"><Lightbulb size={16} className="text-yellow-500 mt-0.5 shrink-0" /><p className="text-sm text-muted-foreground">{current.explanation}</p></div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 justify-center">
        {!submitted ? (
          <Button onClick={handleSubmit} disabled={!curAns} size="lg" className="px-12">提交答案</Button>
        ) : (
          <Button onClick={handleNext} size="lg" className="px-12">下一题</Button>
        )}
      </div>
    </div>
  );
}
