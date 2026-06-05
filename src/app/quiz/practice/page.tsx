"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Loader2,
  Brain,
} from "lucide-react";

interface Question {
  id: string;
  type: string;
  stem: string;
  options: { label: string; text: string }[];
  answer: string;
  explanation: string;
  difficulty: number;
}

export default function PracticePage() {
  // 设置状态
  const [started, setStarted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [category, setCategory] = useState("全部");
  const [questionCount, setQuestionCount] = useState("10");
  const [genError, setGenError] = useState("");

  // 答题状态
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const currentAnswer = answers[currentQuestion?.id] || "";

  const handleSelectOption = (label: string) => {
    if (submitted) return;
    setAnswers({ ...answers, [currentQuestion.id]: label });
  };

  const handleSubmit = () => setSubmitted(true);

  const handleNext = () => {
    setSubmitted(false);
    if (isLast) {
      // 所有题目答完
      return;
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const handleStart = async () => {
    setGenError("");
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          questionType: "single_choice",
          count: parseInt(questionCount),
        }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setCurrentIndex(0);
        setAnswers({});
        setSubmitted(false);
        setStarted(true);
      } else {
        setGenError(data.error || "生成失败，请重试");
      }
    } catch {
      setGenError("网络错误，请检查网络后重试");
    } finally {
      setGenerating(false);
    }
  };

  const isCorrect = submitted && currentAnswer === currentQuestion?.answer;

  const correctCount = questions.filter(
    (q) => answers[q.id] === q.answer
  ).length;

  const allDone = questions.length > 0 &&
    questions.every((q) => answers[q.id] !== undefined);

  // ===== 设置页面 =====
  if (!started) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">AI 智能出题</h1>
          <p className="text-muted-foreground text-sm mt-1">
            基于知识库内容，AI 实时生成单选题
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-500" />
              出题设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>知识范围</Label>
              <Select value={category} onValueChange={(v) => setCategory(v || "全部")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="全部">全部知识</SelectItem>
                  <SelectItem value="公文新闻">公文新闻</SelectItem>
                  <SelectItem value="管理学">管理学</SelectItem>
                  <SelectItem value="党建">党建</SelectItem>
                  <SelectItem value="行业知识">行业知识</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>题目数量</Label>
              <Select value={questionCount} onValueChange={(v) => setQuestionCount(v || "10")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 道</SelectItem>
                  <SelectItem value="10">10 道</SelectItem>
                  <SelectItem value="15">15 道</SelectItem>
                  <SelectItem value="20">20 道</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {genError && (
              <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm flex items-start gap-2">
                <XCircle size={16} className="mt-0.5 shrink-0" />
                {genError}
              </div>
            )}

            <Button
              onClick={handleStart}
              className="w-full"
              disabled={generating}
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  AI 正在生成题目...
                </>
              ) : (
                <>
                  <Brain size={18} className="mr-2" />
                  开始 AI 出题
                </>
              )}
            </Button>

            <div className="bg-indigo-50 rounded-lg p-3 text-xs text-muted-foreground">
              <p>AI 会根据你知识库中的内容实时生成全新的单选题。每次生成的题目都不相同，确保练习效果。</p>
            </div>

            <Link href="/quiz">
              <Button variant="ghost" className="w-full">
                <ArrowLeft size={16} className="mr-1" />
                返回题库
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== 答题完成页 =====
  if (allDone && submitted) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card className="text-center">
          <CardContent className="p-8">
            <div className="text-4xl mb-4">
              {correctCount >= questions.length * 0.6 ? "🎉" : "📚"}
            </div>
            <h2 className="text-2xl font-bold mb-2">练习完成</h2>
            <div className="text-5xl font-bold text-primary my-6">
              {correctCount} / {questions.length}
            </div>
            <p className="text-muted-foreground">
              正确率 {Math.round((correctCount / questions.length) * 100)}%
            </p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {questions.map((q, i) => {
            const userAns = answers[q.id];
            const isRight = userAns === q.answer;
            return (
              <Card key={q.id} className={isRight ? "border-l-4 border-l-green-400" : "border-l-4 border-l-red-400"}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">第{i + 1}题</span>
                    {isRight ? (
                      <CheckCircle size={14} className="text-green-500" />
                    ) : (
                      <XCircle size={14} className="text-red-500" />
                    )}
                  </div>
                  <p className="text-sm">{q.stem}</p>
                  {!isRight && (
                    <div className="mt-2 text-sm">
                      <span className="text-red-500">你的答案：{userAns}</span>
                      {" → "}
                      <span className="text-green-600 font-medium">正确答案：{q.answer}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => { setStarted(false); setQuestions([]); }}>
            重新出题
          </Button>
          <Link href="/quiz">
            <Button>返回题库</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ===== 答题界面 =====
  return (
    <div className="space-y-6 max-w-3xl">
      {/* 顶部信息 */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>第 {currentIndex + 1} / {questions.length} 题</span>
        <span>已答 {Object.keys(answers).length} 题</span>
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          单选题
        </Badge>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className="bg-primary h-1.5 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* 题目 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-normal leading-relaxed">
            {currentQuestion.stem}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.options?.map((opt) => {
            const isSelected = currentAnswer === opt.label;
            const isCorrectOption = submitted && currentQuestion.answer === opt.label;
            const isWrongSelected = submitted && isSelected && !isCorrectOption;

            return (
              <button
                key={opt.label}
                onClick={() => handleSelectOption(opt.label)}
                disabled={submitted}
                className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center gap-3 ${
                  isCorrectOption
                    ? "border-green-500 bg-green-50"
                    : isWrongSelected
                    ? "border-red-500 bg-red-50"
                    : isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full border flex items-center justify-center text-sm shrink-0 ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border"
                  }`}
                >
                  {opt.label}
                </span>
                <span className="text-sm">{opt.text}</span>
                {isCorrectOption && <CheckCircle size={18} className="text-green-500 ml-auto" />}
                {isWrongSelected && <XCircle size={18} className="text-red-500 ml-auto" />}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* 解析区 */}
      {submitted && (
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <>
                  <CheckCircle size={18} className="text-green-500" />
                  <span className="font-medium text-green-700">回答正确！</span>
                </>
              ) : (
                <>
                  <XCircle size={18} className="text-red-500" />
                  <span className="font-medium text-red-700">回答错误</span>
                </>
              )}
            </div>
            <div className="flex items-start gap-2">
              <Lightbulb size={16} className="text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">解析：</p>
                <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3 justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          上一题
        </Button>
        <div className="flex gap-3">
          {!submitted ? (
            <Button onClick={handleSubmit} disabled={!currentAnswer}>
              提交答案
            </Button>
          ) : isLast ? (
            <Button onClick={handleNext}>
              查看结果
              <ArrowRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button onClick={handleNext}>
              下一题
              <ArrowRight size={16} className="ml-1" />
            </Button>
          )}
        </div>
        <div />
      </div>

      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={() => { setStarted(false); setQuestions([]); }}>
          <RotateCcw size={14} className="mr-1" />
          重新出题
        </Button>
      </div>
    </div>
  );
}
