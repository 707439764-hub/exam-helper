"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";
  const { login } = useAuth();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password) return;
    setLoading(true);
    setError("");

    const success = await login(password);

    if (success) {
      router.push(from);
    } else {
      setError("密码错误，请重试");
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
          <Lock size={24} className="text-primary" />
        </div>
        <CardTitle className="text-xl">个人学习助手</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">请输入密码进入</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            type="password"
            placeholder="请输入登录密码"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLogin();
            }}
            className="text-center text-lg tracking-widest"
            autoFocus
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 rounded-lg p-2.5">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <Button
          onClick={handleLogin}
          disabled={!password || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              验证中...
            </>
          ) : (
            "进入系统"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Suspense
        fallback={
          <Card className="w-full max-w-sm shadow-lg">
            <CardContent className="p-8 text-center">
              <Loader2 size={24} className="animate-spin mx-auto" />
            </CardContent>
          </Card>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
