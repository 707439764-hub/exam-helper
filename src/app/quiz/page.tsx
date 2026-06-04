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
import { Brain, BookOpen, BarChart3, FileText, Sparkles } from "lucide-react";

// 模拟题目数据
const questionTypes = [
  {
    type: "single_choice",
    label: "单选题",
    icon: "📝",
    count: 45,
    color: "bg-blue-100 text-blue-700",
  },
  {
    type: "multi_choice",
    label: "多选题",
    icon: "📋",
    count: 20,
    color: "bg-green-100 text-green-700",
  },
  {
    type: "true_false",
    label: "判断题",
    icon: "✅",
    count: 30,
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    type: "essay",
    label: "案例分析",
    icon: "📊",
    count: 15,
    color: "bg-purple-100 text-purple-700",
  },
];

export default function QuizPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">题库练习</h1>
        <p className="text-muted-foreground text-sm mt-1">
          多种练习模式，系统备考
        </p>
      </div>

      {/* 练习模式卡片 */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/quiz/practice">
          <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 h-full">
            <CardContent className="p-6 text-center">
              <Brain size={32} className="mx-auto text-orange-500 mb-3" />
              <h3 className="font-bold text-lg">随机练习</h3>
              <p className="text-sm text-muted-foreground mt-1">
                按知识点随机出题，随时练习巩固
              </p>
              <Badge variant="secondary" className="mt-3">
                自由模式
              </Badge>
            </CardContent>
          </Card>
        </Link>

        <Link href="/quiz/exam">
          <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-red-50 to-red-100 border-red-200 h-full">
            <CardContent className="p-6 text-center">
              <BarChart3 size={32} className="mx-auto text-red-500 mb-3" />
              <h3 className="font-bold text-lg">模拟考试</h3>
              <p className="text-sm text-muted-foreground mt-1">
                限时作答，真实模拟考试场景
              </p>
              <Badge variant="secondary" className="mt-3">
                限时模式
              </Badge>
            </CardContent>
          </Card>
        </Link>

        <Link href="/quiz/review">
          <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 h-full">
            <CardContent className="p-6 text-center">
              <BookOpen size={32} className="mx-auto text-yellow-600 mb-3" />
              <h3 className="font-bold text-lg">错题回顾</h3>
              <p className="text-sm text-muted-foreground mt-1">
                复习做错的题目，查漏补缺
              </p>
              <Badge variant="secondary" className="mt-3">
                重点复习
              </Badge>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* AI生成题目 */}
      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Sparkles size={28} className="text-indigo-500 mt-1 shrink-0" />
            <div className="space-y-2 flex-1">
              <h3 className="font-bold text-lg">AI智能出题</h3>
              <p className="text-sm text-muted-foreground">
                选择知识点范围，让AI为你生成针对性的练习题。支持单选题、多选题、判断题和案例分析题。
              </p>
              <Link href="/quiz/practice?ai=true">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Sparkles size={16} className="mr-1" />
                  AI生成题目
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 按题型浏览 */}
      <div>
        <h2 className="font-bold text-lg mb-3">按题型浏览</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {questionTypes.map((qt) => (
            <Card key={qt.type} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <span className="text-2xl">{qt.icon}</span>
                <h3 className="font-medium text-sm mt-2">{qt.label}</h3>
                <Badge className={`mt-1 ${qt.color}`}>{qt.count} 道题目</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
