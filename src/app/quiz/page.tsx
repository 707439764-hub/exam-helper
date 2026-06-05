import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, BookOpen } from "lucide-react";

export default function QuizPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">题库练习</h1>
        <p className="text-muted-foreground text-sm mt-1">
          AI 基于知识库实时出题，每次不同
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/quiz/practice">
          <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 h-full">
            <CardContent className="p-6 text-center">
              <Brain size={32} className="mx-auto text-indigo-500 mb-3" />
              <h3 className="font-bold text-lg">AI 智能出题</h3>
              <p className="text-sm text-muted-foreground mt-1">
                选择题库范围 → AI 实时生成单选题 → 逐题作答
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/quiz/review">
          <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 h-full">
            <CardContent className="p-6 text-center">
              <BookOpen size={32} className="mx-auto text-yellow-600 mb-3" />
              <h3 className="font-bold text-lg">错题回顾</h3>
              <p className="text-sm text-muted-foreground mt-1">
                回顾做错的题目，加深理解
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
