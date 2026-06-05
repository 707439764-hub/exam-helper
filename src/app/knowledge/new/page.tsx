"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Plus,
  X,
  Loader2,
  CheckCircle,
  FileText,
  Tag,
  Link as LinkIcon,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

export default function NewKnowledgePage() {
  const router = useRouter();

  // 手动录入状态
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [source, setSource] = useState("");

  // AI导入状态
  const [articleText, setArticleText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedPoints, setExtractedPoints] = useState<
    { title: string; content: string; category: string; tags: string[] }[]
  >([]);

  // URL 抓取状态
  const [fetchUrl, setFetchUrl] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fetchCookie, setFetchCookie] = useState("");
  const [fetchUsername, setFetchUsername] = useState("");
  const [fetchPassword, setFetchPassword] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [fetchTitle, setFetchTitle] = useState("");

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // URL 抓取
  const handleFetchUrl = async () => {
    if (!fetchUrl.trim()) return;
    setIsFetching(true);
    setFetchError("");
    setFetchTitle("");

    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: fetchUrl,
          cookie: fetchCookie || undefined,
          username: fetchUsername || undefined,
          password: fetchPassword || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setArticleText(data.content);
        setFetchTitle(data.title || "");
        setFetchError("");
      } else {
        setFetchError(data.error || "抓取失败");
      }
    } catch {
      setFetchError("网络错误，请稍后重试");
    } finally {
      setIsFetching(false);
    }
  };

  // 手动保存知识点
  const handleManualSave = () => {
    if (!title || !content || !category) return;
    console.log({ title, content, category, tags, source });
    router.push("/knowledge");
  };

  // AI 提取知识点
  const handleAIExtract = async () => {
    if (!articleText.trim()) return;
    setIsExtracting(true);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: articleText }),
      });
      const data = await res.json();
      if (data.points) {
        setExtractedPoints(data.points);
      }
    } catch (error) {
      console.error("AI提取失败:", error);
      const mockPoints = [
        {
          title: "2024年安全工作部署",
          content:
            "会议强调坚持安全第一方针，完善SMS体系建设，强化风险管控能力，确保全年安全目标实现。",
          category: "公文新闻",
          tags: ["安全工作", "SMS", "2024"],
        },
        {
          title: "PDCA循环在安全管理中的应用",
          content:
            "PDCA（计划-执行-检查-处理）循环是全面质量管理的思想基础和方法依据，在航空安全管理中被广泛应用。",
          category: "管理学",
          tags: ["PDCA", "质量管理", "安全管理"],
        },
      ];
      setExtractedPoints(mockPoints);
    } finally {
      setIsExtracting(false);
    }
  };

  // 确认保存AI提取的知识点
  const handleConfirmPoints = () => {
    console.log("保存知识点:", extractedPoints);
    router.push("/knowledge");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">新增知识点</h1>
        <p className="text-muted-foreground text-sm mt-1">
          手动创建或使用AI从文章中提炼内容
        </p>
      </div>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ai" className="flex items-center gap-1">
            <Sparkles size={14} /> AI智能提炼
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-1">
            <Plus size={14} /> 手动录入
          </TabsTrigger>
        </TabsList>

        {/* AI提炼 Tab */}
        <TabsContent value="ai" className="space-y-4 mt-4">
          {/* URL 抓取区域 */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <LinkIcon size={14} className="text-blue-500" />
                输入文章链接，自动拉取内容
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="粘贴 OA 文章链接..."
                  value={fetchUrl}
                  onChange={(e) => setFetchUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFetchUrl();
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleFetchUrl}
                  disabled={!fetchUrl.trim() || isFetching}
                  variant="secondary"
                >
                  {isFetching ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "拉取"
                  )}
                </Button>
              </div>

              {/* 高级选项 */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                需要登录认证？展开设置
              </button>
              {showAdvanced && (
                <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Cookie（从浏览器复制）</Label>
                    <Textarea
                      placeholder="在 OA 页面按 F12 → Application → Cookies → 复制"
                      value={fetchCookie}
                      onChange={(e) => setFetchCookie(e.target.value)}
                      className="text-xs min-h-[60px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">用户名</Label>
                      <Input
                        placeholder="OA 账号"
                        value={fetchUsername}
                        onChange={(e) => setFetchUsername(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">密码</Label>
                      <Input
                        type="password"
                        placeholder="OA 密码"
                        value={fetchPassword}
                        onChange={(e) => setFetchPassword(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {fetchError && (
                <div className="flex items-start gap-2 text-sm text-red-500 bg-red-50 rounded-lg p-2.5">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {fetchError}
                </div>
              )}

              {fetchTitle && (
                <div className="text-sm text-green-600 bg-green-50 rounded-lg p-2">
                  ✅ 已抓取：{fetchTitle}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 文本编辑区 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles size={18} className="text-blue-500" />
                文章内容（可编辑后提炼）
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="粘贴文章内容，或在上方输入链接自动拉取...&#10;&#10;支持粘贴多段内容，AI会自动识别并提取相关知识点。"
                value={articleText}
                onChange={(e) => setArticleText(e.target.value)}
                className="min-h-[200px]"
              />
              <Button
                onClick={handleAIExtract}
                disabled={!articleText.trim() || isExtracting}
                className="w-full"
              >
                {isExtracting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    AI正在分析中...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="mr-2" />
                    开始提炼知识点
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* AI提取结果 */}
          {extractedPoints.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                已提炼 {extractedPoints.length} 个知识点
              </h3>
              {extractedPoints.map((point, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        className={
                          point.category === "公文新闻"
                            ? "bg-blue-100 text-blue-700"
                            : point.category === "管理学"
                            ? "bg-green-100 text-green-700"
                            : point.category === "党建"
                            ? "bg-red-100 text-red-700"
                            : "bg-purple-100 text-purple-700"
                        }
                      >
                        {point.category}
                      </Badge>
                    </div>
                    <h4 className="font-medium">{point.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {point.content}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {point.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-muted px-2 py-0.5 rounded"
                        >
                          <Tag size={10} className="inline mr-0.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button onClick={handleConfirmPoints} className="w-full">
                <CheckCircle size={16} className="mr-2" />
                确认保存所有知识点
              </Button>
            </div>
          )}
        </TabsContent>

        {/* 手动录入 Tab */}
        <TabsContent value="manual" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText size={18} />
                手动录入知识点
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">知识点标题 *</Label>
                <Input
                  id="title"
                  placeholder="例如：2024年安全工作报告要点"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">所属分类 *</Label>
                <Select value={category} onValueChange={(v) => setCategory(v || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="公文新闻">公文新闻</SelectItem>
                    <SelectItem value="管理学">管理学</SelectItem>
                    <SelectItem value="党建">党建</SelectItem>
                    <SelectItem value="行业知识">行业知识</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">知识点内容 *</Label>
                <Textarea
                  id="content"
                  placeholder="详细描述知识点内容，包括关键概念、要点等..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label>标签</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="输入标签，按回车添加"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button variant="outline" onClick={addTag} type="button">
                    添加
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X
                          size={12}
                          className="cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">来源（可选）</Label>
                <Input
                  id="source"
                  placeholder="文章来源URL或出处"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
              </div>

              <Button
                onClick={handleManualSave}
                disabled={!title || !content || !category}
                className="w-full"
              >
                保存知识点
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
