"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";

// 模拟题目
const mockQuestions = [
  {
    id: "1",
    type: "single_choice",
    stem: "南航安全管理体系（SMS）的核心支柱不包括以下哪一项？",
    options: [
      { label: "A", text: "安全政策" },
      { label: "B", text: "风险管理" },
      { label: "C", text: "市场营销" },
      { label: "D", text: "安全保证" },
    ],
    answer: "C",
    explanation:
      "SMS四大支柱为：安全政策、风险管理、安全保证和安全促进。市场营销不属于SMS体系范畴。",
    difficulty: 3,
  },
  {
    id: "2",
    type: "single_choice",
    stem: "SWOT分析法中的'O'代表什么？",
    options: [
      { label: "A", text: "优势" },
      { label: "B", text: "劣势" },
      { label: "C", text: "机会" },
      { label: "D", text: "威胁" },
    ],
    answer: "C",
    explanation:
      "SWOT中S=Strengths（优势），W=Weaknesses（劣势），O=Opportunities（机会），T=Threats（威胁）。",
    difficulty: 1,
  },
  {
    id: "3",
    type: "true_false",
    stem: "坚持党要管党、全面从严治党是新时代党的建设总要求之一。",
    options: [
      { label: "A", text: "正确" },
      { label: "B", text: "错误" },
    ],
    answer: "A",
    explanation:
      "新时代党的建设总要求明确提出：坚持和加强党的全面领导，坚持党要管党、全面从严治党。",
    difficulty: 1,
  },
  {
    id: "4",
    type: "multi_choice",
    stem: "以下哪些属于波特五力模型的竞争力量？（多选）",
    options: [
      { label: "A", text: "供应商的议价能力" },
      { label: "B", text: "购买者的议价能力" },
      { label: "C", text: "企业内部管理水平" },
      { label: "D", text: "新进入者的威胁" },
    ],
    answer: "A,B,D",
    explanation:
      "波特五力模型包括：供应商议价能力、购买者议价能力、新进入者威胁、替代品威胁、同业竞争者竞争程度。企业内部管理水平不属于五力模型。",
    difficulty: 3,
  },
  {
    id: "5",
    type: "essay",
    stem: "请结合实际，分析南航在数字化转型过程中面临的主要挑战及应对策略。",
    options: [],
    answer:
      "答题要点：1. 技术基础设施升级需求；2. 数据治理和安全挑战；3. 人才队伍建设；4. 业务流程再造；5. 客户体验提升。",
    explanation:
      "这是一道综合分析题，需要结合航空行业特点和南航实际情况，从技术、管理、人才等多个维度进行分析。",
    difficulty: 5,
  },
];

export default function PracticePage() {
  const [started, setStarted] = useState(false);
  const [category, setCategory] = useState("全部");
  const [questionCount, setQuestionCount] = useState("10");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [questions] = useState(mockQuestions);

  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const currentAnswer = answers[currentQuestion?.id] || "";

  const handleSelectOption = (label: string) => {
    if (submitted) return;
    if (currentQuestion.type === "multi_choice") {
      const selected = currentAnswer ? currentAnswer.split(",") : [];
      const newSelected = selected.includes(label)
        ? selected.filter((l) => l !== label)
        : [...selected, label];
      setAnswers({
        ...answers,
        [currentQuestion.id]: newSelected.sort().join(","),
      });
    } else {
      setAnswers({ ...answers, [currentQuestion.id]: label });
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleNext = () => {
    setSubmitted(false);
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const handleStart = () => {
    setStarted(true);
  };

  const isCorrect =
    submitted && currentAnswer === currentQuestion?.answer;

  // 开始前的设置页面
  if (!started) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">随机练习</h1>
          <p className="text-muted-foreground text-sm mt-1">
            自定义练习范围，开始答题
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">练习设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>选择分类</Label>
              <Select value={category} onValueChange={(v) => setCategory(v || "全部")}>
                <SelectTrigger>
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

            <div className="flex gap-3">
              <Button onClick={handleStart} className="flex-1">
                开始练习
              </Button>
              <Link href="/quiz/practice?ai=true">
                <Button variant="outline">
                  <Sparkles size={16} className="mr-1" />
                  AI出题
                </Button>
              </Link>
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

  // 答题界面
  return (
    <div className="space-y-6 max-w-3xl">
      {/* 进度条 */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          第 {currentIndex + 1} / {questions.length} 题
        </span>
        <span>
          已答 {Object.keys(answers).length} 题
        </span>
        <Badge
          variant="secondary"
          className={
            currentQuestion.type === "single_choice"
              ? "bg-blue-100 text-blue-700"
              : currentQuestion.type === "multi_choice"
              ? "bg-green-100 text-green-700"
              : currentQuestion.type === "true_false"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-purple-100 text-purple-700"
          }
        >
          {currentQuestion.type === "single_choice"
            ? "单选题"
            : currentQuestion.type === "multi_choice"
            ? "多选题"
            : currentQuestion.type === "true_false"
            ? "判断题"
            : "案例分析题"}
        </Badge>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className="bg-primary h-1.5 rounded-full transition-all"
          style={{
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
          }}
        />
      </div>

      {/* 题目卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-normal leading-relaxed">
            {currentQuestion.stem}
          </CardTitle>
          {currentQuestion.type === "multi_choice" && (
            <p className="text-xs text-muted-foreground">
              多选题：请选择所有正确答案
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.type === "essay" ? (
            <div className="space-y-3">
              <textarea
                className="w-full min-h-[150px] p-3 border rounded-lg resize-y text-sm"
                placeholder="请输入你的答案..."
                value={currentAnswer}
                onChange={(e) =>
                  setAnswers({
                    ...answers,
                    [currentQuestion.id]: e.target.value,
                  })
                }
                disabled={submitted}
              />
            </div>
          ) : (
            currentQuestion.options.map((opt) => {
              const isSelected =
                currentQuestion.type === "multi_choice"
                  ? currentAnswer.split(",").includes(opt.label)
                  : currentAnswer === opt.label;
              const isCorrectOption =
                submitted && currentQuestion.answer.includes(opt.label);
              const isWrongSelected =
                submitted &&
                isSelected &&
                !currentQuestion.answer.includes(opt.label);

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
                  {isCorrectOption && (
                    <CheckCircle size={18} className="text-green-500 ml-auto" />
                  )}
                  {isWrongSelected && (
                    <XCircle size={18} className="text-red-500 ml-auto" />
                  )}
                </button>
              );
            })
          )}
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
                <p className="text-sm text-muted-foreground">
                  {currentQuestion.explanation}
                </p>
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
            <Link href="/quiz">
              <Button>
                完成练习
                <ArrowRight size={16} className="ml-1" />
              </Button>
            </Link>
          ) : (
            <Button onClick={handleNext}>
              下一题
              <ArrowRight size={16} className="ml-1" />
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1));
          }}
          disabled={isLast || !submitted}
        >
          跳过
        </Button>
      </div>

      {/* 返回链接 */}
      <div className="text-center">
        <Link href="/quiz">
          <Button variant="ghost" size="sm">
            <RotateCcw size={14} className="mr-1" />
            重新设置练习
          </Button>
        </Link>
      </div>
    </div>
  );
}
