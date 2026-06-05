"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle, XCircle, Lightbulb, Loader2, Brain, RotateCcw, BookOpen, StopCircle,
} from "lucide-react";

interface Question {
  id: string;
  module?: string;
  stem: string;
  options: { label: string; text: string }[];
  answer: string;
  explanation: string;
}

// 历史记录项
interface HistoryItem {
  q: Question;
  userAnswer: string;
  isCorrect: boolean;
}

export default function PracticePage() {
  const [started, setStarted] = useState(false);
  const [category, setCategory] = useState("全部");

  // 当前题目
  const [current, setCurrent] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [curAns, setCurAns] = useState("");
  const [genError, setGenError] = useState("");

  // 历史记录
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stopped, setStopped] = useState(false);

  // 防止重复请求
  const fetchingRef = useRef(false);

  const correctCount = history.filter((h) => h.isCorrect).length;

  // 保存错题
  const saveWrong = (q: Question, userAnswer: string) => {
    try {
      const stored = localStorage.getItem("wrong_answers");
      const wrong = stored ? JSON.parse(stored) : [];
      wrong.push({ q: { ...q, id: Date.now().toString() }, userAnswer, date: new Date().toISOString().slice(0, 10) });
      localStorage.setItem("wrong_answers", JSON.stringify(wrong.slice(-50)));
    } catch (_) {}
  };

  // 获取一道新题
  const fetchQuestion = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setGenError("");
    setSubmitted(false);
    setCurAns("");
    try {
      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, count: 1 }),
      });
      const data = await res.json();
      if (data.questions?.length) {
        setCurrent(data.questions[0]);
      } else {
        setGenError(data.error || "出题失败");
      }
    } catch {
      setGenError("网络错误，请重试");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  // 开始练习
  const handleStart = async () => {
    setStarted(true);
    setHistory([]);
    setStopped(false);
    await fetchQuestion();
  };

  // 提交答案
  const handleSubmit = () => {
    if (!current || !curAns) return;
    setSubmitted(true);
    const isCorrect = curAns === current.answer;
    setHistory((prev) => [...prev, { q: current, userAnswer: curAns, isCorrect }]);
    if (!isCorrect) saveWrong(current, curAns);
  };

  // 下一题
  const handleNext = async () => {
    setCurrent(null);
    await fetchQuestion();
  };

  // 结束练习
  const handleStop = () => {
    setStopped(true);
  };

  // ===== 首页：选择分类 =====
  if (!started) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">随机练习</h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI 逐题出题 · 无限练习 · 不限题量
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">选择知识范围</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>出题范围</Label>
              <Select value={category} onValueChange={(v) => setCategory(v || "全部")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="全部">全部范围</SelectItem>
                  <SelectItem value="管理学">管理学案例 + 理论</SelectItem>
                  <SelectItem value="党建">党建 + 时政 + 政绩观</SelectItem>
                  <SelectItem value="公文新闻">南航文化 + 公司战略</SelectItem>
                  <SelectItem value="行业知识">十五五规划 + 行业知识</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleStart} className="w-full" size="lg">
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

  // ===== 加载中 =====
  if (loading || !current) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 size={32} className="animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">AI 命题组出题中...</p>
        </div>
      </div>
    );
  }

  // ===== 答题中 =====
  return (
    <div className="space-y-6 max-w-3xl">
      {/* 顶部信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            📝 第 {history.length + 1} 题
          </Badge>
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

      {genError && (
        <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm flex gap-2">
          <XCircle size={16} className="mt-0.5 shrink-0" />{genError}
        </div>
      )}

      {/* 题目 */}
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

      {/* 解析 */}
      {submitted && (
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {curAns === current.answer
                ? <><CheckCircle size={18} className="text-green-500" /><span className="font-medium text-green-700">正确！</span></>
                : <><XCircle size={18} className="text-red-500" /><span className="font-medium text-red-700">错误 · 正确答案：{current.answer}</span></>}
            </div>
            <div className="flex gap-2">
              <Lightbulb size={16} className="text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">{current.explanation}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 按钮 */}
      <div className="flex gap-3 justify-center">
        {!submitted ? (
          <Button onClick={handleSubmit} disabled={!curAns} size="lg" className="px-12">提交答案</Button>
        ) : (
          <Button onClick={handleNext} size="lg" className="px-12">
            下一题 <Loader2 size={16} className={`ml-2 ${loading ? "animate-spin" : "hidden"}`} />
          </Button>
        )}
      </div>
    </div>
  );
}
