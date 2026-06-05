import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Brain,
  BarChart3,
  Plus,
  ArrowRight,
  TrendingUp,
  FileText,
} from "lucide-react";
import { knowledgeData } from "@/data/knowledge";

const categories = [
  { name: "公文新闻", icon: "📰", color: "bg-blue-100 text-blue-700" },
  { name: "管理学", icon: "📊", color: "bg-green-100 text-green-700" },
  { name: "党建", icon: "🚩", color: "bg-red-100 text-red-700" },
  { name: "行业知识", icon: "✈️", color: "bg-purple-100 text-purple-700" },
];

const recentKnowledge = knowledgeData.slice(0, 5);

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* 欢迎横幅 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-xl p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-2">
          欢迎回来，学习加油！💪
        </h2>
        <p className="text-blue-100 mb-4">
          个人学习助手 — 智能总结知识点、AI出题练习、学习进度追踪
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link href="/knowledge/new">
            <Button variant="secondary">
              <Plus size={16} className="mr-1" />
              导入文章提炼考点
            </Button>
          </Link>
          <Link href="/quiz/practice">
            <Button variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white">
              <Brain size={16} className="mr-1" />
              开始答题练习
            </Button>
          </Link>
        </div>
      </div>

      {/* 分类卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <Link key={cat.name} href={`/knowledge?category=${cat.name}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <span className="text-2xl">{cat.icon}</span>
                <h3 className="font-medium text-sm mt-2">{cat.name}</h3>
                <span
                  className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${cat.color}`}
                >
                  {knowledgeData.filter((k) => k.category === cat.name).length} 个知识点
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 两列布局 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 最近知识点 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BookOpen size={18} />
              最近知识点
            </CardTitle>
            <Link href="/knowledge" className="text-sm text-primary hover:underline">
              查看全部
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentKnowledge.map((kp) => (
              <Link
                key={kp.id}
                href={`/knowledge/${kp.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={16} className="text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{kp.title}</p>
                    <Badge variant="secondary" className="text-xs mt-0.5">
                      {kp.category}
                    </Badge>
                  </div>
                </div>
                <ArrowRight size={14} className="text-muted-foreground shrink-0 ml-2" />
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* 学习进度 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp size={18} />
              学习进度
            </CardTitle>
            <Link href="/stats" className="text-sm text-primary hover:underline">
              详细统计
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-muted-foreground">65%</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 快捷入口 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/quiz/practice">
          <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4 text-center">
              <Brain size={24} className="mx-auto text-orange-500 mb-1" />
              <span className="text-sm font-medium">随机练习</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/quiz/exam">
          <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4 text-center">
              <BarChart3 size={24} className="mx-auto text-red-500 mb-1" />
              <span className="text-sm font-medium">模拟练习</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/quiz/review">
          <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4 text-center">
              <BookOpen size={24} className="mx-auto text-yellow-600 mb-1" />
              <span className="text-sm font-medium">错题回顾</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/knowledge/new">
          <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <Plus size={24} className="mx-auto text-green-500 mb-1" />
              <span className="text-sm font-medium">AI提炼考点</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
