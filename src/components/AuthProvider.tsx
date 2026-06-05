"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // 启动时检查 localStorage
  useEffect(() => {
    const stored = localStorage.getItem("auth");
    setIsAuthenticated(stored === "true");
    setLoading(false);
  }, []);

  // 路由保护：未登录时跳转
  useEffect(() => {
    if (loading) return;
    if (
      !isAuthenticated &&
      pathname !== "/login" &&
      !pathname.startsWith("/api")
    ) {
      const from = pathname === "/" ? "" : `?from=${encodeURIComponent(pathname)}`;
      router.replace(`/login${from}`);
    }
  }, [isAuthenticated, pathname, loading, router]);

  const login = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("auth", "true");
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("auth");
    setIsAuthenticated(false);
    // 清除 cookie
    document.cookie = "auth_token=; path=/; max-age=0";
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  // 未登录且不在登录页 → 显示空白（等待重定向）
  if (!isAuthenticated && pathname !== "/login") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
