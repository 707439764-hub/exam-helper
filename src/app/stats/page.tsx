"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  BookOpen,
  Brain,
  Target,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

// 模拟统计数据
const stats = {
  totalKnowledge: 48,
  totalQuestions: 110,
  totalAnswered: 86,
  correctCount: 62,
  wrongCount: 24,
  accuracy: 72,
  studyDays: 15,
  todayMinutes: 35,
};

const categoryStats = [
  {
    category: "公文新闻",
    icon: "📰",
    total: 14,
    answered: 12,
    correct: 9,
    accuracy: 75,
    color: "bg-blue-500",
  },
  {
    category: "管理学",
    icon: "📊",
    total: 12,
    answered: 10,
    correct: 7,
    accuracy: 70,
    color: "bg-green-500",
  },
  {
    category: "党建",
    icon: "🚩",
    total: 10,
    answered: 8,
    correct: 6,
    accuracy: 75,
    color: "bg-red-500",
  },
  {
    category: "行业知识",
    icon: "✈️",
    total: 12,
    answered: 9,
    correct: 6,
    accuracy: 67,
    color: "bg-purple-500",
  },
];

const weeklyActivity = [
  { day: "周一", count: 12 },
  { day: "周二", count: 8 },
  { day: "周三", count: 15 },
  { day: "周四", count: 10 },
  { day: "周五", count: 18 },
  { day: "周六", count: 6 },
  { day: "周日", count: 3 },
];

const maxCount = Math.max(...weeklyActivity.map((d) => d.count));

export default function StatsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">学习统计</h1>
        <p className="text-muted-foreground text-sm mt-1">
          追踪你的学习进度和答题表现
        </p>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BookOpen size={20} className="text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.totalKnowledge}</p>
              <p className="text-xs text-muted-foreground">知识点总数</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Brain size={20} className="text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{stats.totalAnswered}</p>
              <p className="text-xs text-muted-foreground">已答题目</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Target size={20} className="text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.accuracy}%</p>
              <p className="text-xs text-muted-foreground">正确率</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock size={20} className="text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{stats.todayMinutes}min</p>
              <p className="text-xs text-muted-foreground">今日学习</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 分类统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp size={18} />
            各分类掌握情况
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoryStats.map((cat) => (
            <div key={cat.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span className="font-medium">{cat.category}</span>
                  <Badge variant="secondary" className="text-xs">
                    {cat.answered}/{cat.total}
                  </Badge>
                </span>
                <span className="font-medium">{cat.accuracy}%</span>
              </div>
              <div className="flex gap-1 items-center">
                <Progress value={cat.accuracy} className={`h-2 flex-1 [&>div]:${cat.color}`} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 本周活动 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 size={18} />
            本周答题活动
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-32">
            {weeklyActivity.map((day) => (
              <div key={day.day} className="flex flex-col items-center flex-1">
                <span className="text-xs font-medium text-muted-foreground mb-1">
                  {day.count}
                </span>
                <div
                  className="w-full bg-primary/20 rounded-t-md transition-all"
                  style={{
                    height: `${(day.count / maxCount) * 100}%`,
                    minHeight: 4,
                  }}
                />
                <span className="text-xs text-muted-foreground mt-1">
                  {day.day}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 正确率趋势 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle size={18} className="text-green-500" />
            答题正确/错误分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <div
                className="h-4 bg-green-500 rounded"
                style={{ width: `${stats.accuracy}%` }}
              />
              <span className="text-sm font-medium">{stats.accuracy}%</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <CheckCircle size={14} className="text-green-500" />
                {stats.correctCount} 正确
              </span>
              <span className="flex items-center gap-1">
                <XCircle size={14} className="text-red-500" />
                {stats.wrongCount} 错误
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
