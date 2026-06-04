import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "南航干部竞聘考试复习系统",
  description: "南航干部竞聘考试备考助手 - 知识点管理、AI总结、智能出题",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-muted/30">
          <div className="p-4 md:p-8 max-w-6xl mx-auto">{children}</div>
        </main>
      </body>
    </html>
  );
}
