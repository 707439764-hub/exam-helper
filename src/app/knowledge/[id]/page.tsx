"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Tag, ExternalLink, Brain, Trash2, Edit } from "lucide-react";
import { knowledgeData } from "@/data/knowledge";

export default function KnowledgeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as string;
  const kp = knowledgeData.find((item) => item.id === id);

  if (!kp) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">知识点不存在</p>
        <Link href="/knowledge">
          <Button variant="outline" className="mt-4">
            <ArrowLeft size={16} className="mr-1" />
            返回列表
          </Button>
        </Link>
      </div>
    );
  }

  const categoryColor =
    kp.category === "公文新闻"
      ? "bg-blue-100 text-blue-700"
      : kp.category === "管理学"
      ? "bg-green-100 text-green-700"
      : kp.category === "党建"
      ? "bg-red-100 text-red-700"
      : "bg-purple-100 text-purple-700";

  const categoryIcon =
    kp.category === "公文新闻"
      ? "📰"
      : kp.category === "管理学"
      ? "📊"
      : kp.category === "党建"
      ? "🚩"
      : "✈️";

  return (
    <div className="space-y-6">
      <Link href="/knowledge">
        <Button variant="ghost">
          <ArrowLeft size={16} className="mr-1" />
          返回知识点列表
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{categoryIcon}</span>
            <Badge className={categoryColor}>{kp.category}</Badge>
            <span className="text-xs text-muted-foreground">
              创建于 {kp.created_at}
            </span>
          </div>
          <CardTitle className="text-xl">{kp.title}</CardTitle>
          <div className="flex gap-1 flex-wrap">
            {kp.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-muted px-2 py-0.5 rounded inline-flex items-center gap-1"
              >
                <Tag size={10} />
                {tag}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {kp.content}
          </div>

          {kp.source && (
            <div className="mt-4 flex items-center gap-1 text-sm text-muted-foreground">
              <ExternalLink size={14} />
              来源：{kp.source}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 flex-wrap">
        <Button variant="outline">
          <Edit size={16} className="mr-1" />
          编辑知识点
        </Button>
        <Button variant="outline" className="text-green-600">
          <Brain size={16} className="mr-1" />
          基于此生成题目
        </Button>
        <Button variant="outline" className="text-red-500">
          <Trash2 size={16} className="mr-1" />
          删除
        </Button>
      </div>
    </div>
  );
}
