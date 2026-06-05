"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  BarChart3,
  Menu,
  X,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  {
    href: "/",
    label: "学习仪表盘",
    icon: LayoutDashboard,
  },
  {
    href: "/knowledge",
    label: "知识库",
    icon: BookOpen,
  },
  {
    href: "/quiz",
    label: "题库练习",
    icon: Brain,
  },
  {
    href: "/questions",
    label: "题库",
    icon: BarChart3,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* 移动端顶部栏 */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-white">
        <Link href="/" className="font-bold text-lg text-primary">
          ✈️ 学习助手
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* 移动端遮罩 */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-50 h-full w-64 bg-white border-r flex flex-col shrink-0 transition-transform",
          "md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo区域 */}
        <div className="p-6 border-b">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">✈️</span>
            <div>
              <h1 className="font-bold text-sm text-foreground">个人学习</h1>
              <p className="text-xs text-muted-foreground">学习系统</p>
            </div>
          </Link>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 底部快捷操作 */}
        <div className="p-4 border-t space-y-2">
          <Link href="/knowledge/new" onClick={() => setMobileOpen(false)}>
            <Button className="w-full" size="sm">
              <Plus size={16} className="mr-1" />
              新增知识点
            </Button>
          </Link>
          <Link href="/quiz/practice" onClick={() => setMobileOpen(false)}>
            <Button variant="outline" className="w-full" size="sm">
              <Brain size={16} className="mr-1" />
              开始练习
            </Button>
          </Link>
        </div>
      </aside>
    </>
  );
}
