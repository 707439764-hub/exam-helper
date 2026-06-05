"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle, XCircle, Lightbulb, ArrowRight, RotateCcw,
  Loader2, Brain,
} from "lucide-react";

interface Question {
  id: string;
  stem: string;
  options: { label: string; text: string }[];
  answer: string;
  explanation: string;
}

const BATCH_SIZE = 5;

export default function PracticePage() {
  const [started, setStarted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [category, setCategory] = useState("全部");
  const [genError, setGenError] = useState("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // 错题记录
  const saveWrongAnswer = (q: Question, userAnswer: string) => {
    try {
      const stored = localStorage.getItem("wrong_answers");
      const wrong: { q: Question; userAnswer: string; date: string }[] = stored ? JSON.parse(stored) : [];
      wrong.push({ q: { ...q, id: Date.now().toString() }, userAnswer, date: new Date().toISOString().slice(0, 10) });
      localStorage.setItem("wrong_answers", JSON.stringify(wrong.slice(-50))); // 最多存50道
    } catch (_) {}
  };

  const cur = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const curAns = answers[cur?.id] || "";
  const isCorrect = submitted && curAns === cur?.answer;
  const correctCount = questions.filter((q) => answers[q.id] === q.answer).length;
  const allDone = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined);

  const handleSelect = (label: string) => {
    if (submitted) return;
    setAnswers({ ...answers, [cur.id]: label });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (curAns !== cur?.answer) saveWrongAnswer(cur, curAns);
  };

  const handleNext = () => {
    setSubmitted(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const generateQuestions = async () => {
    setGenError("");
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, count: BATCH_SIZE }),
      });
      const data = await res.json();
      if (data.questions?.length) {
        setQuestions(data.questions);
        setCurrentIndex(0);
        setAnswers({});
        setSubmitted(false);
        setStarted(true);
      } else {
        setGenError(data.error || "生成失败");
      }
    } catch {
      setGenError("网络错误");
    } finally {
      setGenerating(false);
    }
  };

  const handleNewBatch = async () => {
    setStarted(false);
    await generateQuestions();
  };

  // ===== 选择分类 =====
  if (!started) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">管理胜任力测评</h1>
          <p className="text-muted-foreground text-sm mt-1">
            南方新华命题风格 · AI随机出题 · 每次{BATCH_SIZE}道 · 无限练习
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
                  <SelectItem value="全部">全部（推荐）</SelectItem>
                  <SelectItem value="管理学">管理学案例 + 理论</SelectItem>
                  <SelectItem value="党建">党建 + 时政 + 政绩观</SelectItem>
                  <SelectItem value="公文新闻">南航文化 + 公司战略</SelectItem>
                  <SelectItem value="行业知识">十五五规划 + 行业知识</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {genError && (
              <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm flex gap-2">
                <XCircle size={16} className="mt-0.5 shrink-0" />{genError}
              </div>
            )}

            <Button onClick={generateQuestions} className="w-full" size="lg" disabled={generating}>
              {generating ? <><Loader2 size={18} className="mr-2 animate-spin" />命题组出题中...</> : <><Brain size={18} className="mr-2" />开始随机练习</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== 答题完成 =====
  if (allDone && submitted) {
    const accuracy = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card className="text-center">
          <CardContent className="p-8">
            <div className="text-4xl mb-4">{accuracy >= 60 ? "🎉" : "📚"}</div>
            <h2 className="text-2xl font-bold mb-2">本组完成</h2>
            <div className="text-5xl font-bold text-primary my-6">{correctCount}/{questions.length}</div>
            <p className="text-muted-foreground">正确率 {accuracy}%</p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {questions.map((q, i) => {
            const isRight = answers[q.id] === q.answer;
            return (
              <Card key={q.id} className={isRight ? "border-l-4 border-l-green-400" : "border-l-4 border-l-red-400"}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">第{i + 1}题</span>
                    {isRight ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                  </div>
                  <p className="text-sm">{q.stem}</p>
                  {!isRight && (
                    <div className="mt-1 text-sm">
                      <span className="text-red-500">你选：{answers[q.id]}</span>
                      {" → "}<span className="text-green-600 font-medium">正确：{q.answer}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{q.explanation.slice(0, 100)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-3 justify-center">
          <Button onClick={handleNewBatch} size="lg"><RotateCcw size={16} className="mr-1" />再来一组</Button>
          <Link href="/quiz/review"><Button variant="outline" size="lg">错题回顾</Button></Link>
        </div>
      </div>
    );
  }

  // ===== 答题中 =====
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>第 {currentIndex + 1}/{questions.length} 题</span>
        <span>已答 {Object.keys(answers).length} 题</span>
        <Badge className="bg-blue-100 text-blue-700">单选题</Badge>
      </div>

      <div className="w-full bg-muted rounded-full h-1.5">
        <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-normal leading-relaxed">{cur.stem}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cur.options?.map((opt) => {
            const sel = curAns === opt.label;
            const correct = submitted && cur.answer === opt.label;
            const wrong = submitted && sel && !correct;
            return (
              <button key={opt.label} onClick={() => handleSelect(opt.label)} disabled={submitted}
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
              {isCorrect ? <><CheckCircle size={18} className="text-green-500" /><span className="font-medium text-green-700">正确！</span></> : <><XCircle size={18} className="text-red-500" /><span className="font-medium text-red-700">错误</span></>}
            </div>
            <div className="flex gap-2"><Lightbulb size={16} className="text-yellow-500 mt-0.5 shrink-0" /><p className="text-sm text-muted-foreground">{cur.explanation}</p></div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 justify-between">
        <Button variant="outline" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>上一题</Button>
        {!submitted ? <Button onClick={handleSubmit} disabled={!curAns}>提交</Button>
         : isLast ? <Button onClick={handleNext}>查看结果<ArrowRight size={16} className="ml-1" /></Button>
         : <Button onClick={handleNext}>下一题<ArrowRight size={16} className="ml-1" /></Button>}
        <div />
      </div>
    </div>
  );
}
