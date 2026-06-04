"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Clock,
  CheckCircle,
  XCircle,
  Lightbulb,
  ArrowRight,
  AlarmClock,
} from "lucide-react";

// 模拟考题
const examQuestions = [
  {
    id: "e1",
    type: "single_choice",
    stem: "民航工作的首要任务是确保什么？",
    options: [
      { label: "A", text: "经济效益" },
      { label: "B", text: "绝对安全" },
      { label: "C", text: "服务质量" },
      { label: "D", text: "航班正点率" },
    ],
    answer: "B",
    explanation: "安全是民航的生命线，确保绝对安全是民航工作的首要任务。",
  },
  {
    id: "e2",
    type: "single_choice",
    stem: "PDCA循环中，'C'代表什么？",
    options: [
      { label: "A", text: "计划" },
      { label: "B", text: "执行" },
      { label: "C", text: "检查" },
      { label: "D", text: "处理" },
    ],
    answer: "C",
    explanation: "PDCA=Plan(计划)-Do(执行)-Check(检查)-Act(处理)。",
  },
  {
    id: "e3",
    type: "true_false",
    stem: "国有企业改革的方向是建立现代企业制度。",
    options: [
      { label: "A", text: "正确" },
      { label: "B", text: "错误" },
    ],
    answer: "A",
    explanation: "建立现代企业制度是国有企业改革的方向。",
  },
];

const EXAM_TIME = 30 * 60; // 30分钟（秒）

export default function ExamPage() {
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(EXAM_TIME);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [questionCount, setQuestionCount] = useState("10");

  const questions = examQuestions;
  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion?.id] || "";

  useEffect(() => {
    if (!started || submitted || finished) return;
    if (timeLeft <= 0) {
      handleFinish();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, started, submitted, finished]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = (label: string) => {
    if (submitted || finished) return;
    setAnswers({ ...answers, [currentQuestion.id]: label });
  };

  const handleSubmitAnswer = () => {
    setSubmitted(true);
  };

  const handleNext = () => {
    setSubmitted(false);
    if (currentIndex + 1 >= questions.length) {
      handleFinish();
      return;
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const handleFinish = () => {
    setFinished(true);
  };

  const score = questions.filter(
    (q) => answers[q.id] === q.answer
  ).length;

  // 考试设置
  if (!started) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">模拟考试</h1>
          <p className="text-muted-foreground text-sm mt-1">
            限时模拟考试，检验你的真实水平
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">考试设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>题目数量</Label>
              <Select value={questionCount} onValueChange={(v) => setQuestionCount(v || "10")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 道题 (30分钟)</SelectItem>
                  <SelectItem value="20">20 道题 (60分钟)</SelectItem>
                  <SelectItem value="30">30 道题 (90分钟)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-700">
                ⚠️ 考试开始后将计时，时间用完自动交卷。请确保在安静环境下作答。
              </p>
            </div>

            <Button onClick={() => setStarted(true)} className="w-full">
              <AlarmClock size={16} className="mr-2" />
              开始考试
            </Button>

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

  // 考试结束页面
  if (finished) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card className="text-center">
          <CardContent className="p-8">
            <div className="text-4xl mb-4">
              {score >= questions.length * 0.6 ? "🎉" : "📚"}
            </div>
            <h2 className="text-2xl font-bold mb-2">考试结束</h2>
            <div className="text-5xl font-bold text-primary my-6">
              {score} / {questions.length}
            </div>
            <p className="text-muted-foreground">
              正确率 {Math.round((score / questions.length) * 100)}%
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-center">
          <Link href="/quiz/exam">
            <Button variant="outline">
              重新考试
            </Button>
          </Link>
          <Link href="/quiz/review">
            <Button>
              查看错题
              <ArrowRight size={16} className="ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 考试进行中
  return (
    <div className="space-y-6 max-w-3xl">
      {/* 顶部信息 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          第 {currentIndex + 1} / {questions.length} 题
        </span>
        <div className="flex items-center gap-2 text-sm font-mono font-bold">
          <Clock size={16} className={timeLeft < 300 ? "text-red-500" : "text-muted-foreground"} />
          <span className={timeLeft < 300 ? "text-red-500" : ""}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={handleFinish}>
          交卷
        </Button>
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
          {currentQuestion.options.map((opt) => {
            const isSelected = currentAnswer === opt.label;
            const isCorrect = submitted && currentQuestion.answer === opt.label;
            const isWrongSelected = submitted && isSelected && !isCorrect;

            return (
              <button
                key={opt.label}
                onClick={() => handleSelectOption(opt.label)}
                disabled={submitted}
                className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center gap-3 ${
                  isCorrect
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
                {isCorrect && <CheckCircle size={18} className="text-green-500 ml-auto" />}
                {isWrongSelected && <XCircle size={18} className="text-red-500 ml-auto" />}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {submitted && (
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
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

      <div className="flex gap-3 justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          上一题
        </Button>
        {!submitted ? (
          <Button onClick={handleSubmitAnswer} disabled={!currentAnswer}>
            提交答案
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {currentIndex + 1 >= questions.length ? "完成考试" : "下一题"}
            <ArrowRight size={16} className="ml-1" />
          </Button>
        )}
        <div />
      </div>
    </div>
  );
}
