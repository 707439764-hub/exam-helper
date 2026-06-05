"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/components/AuthProvider";
import { Sidebar } from "@/components/Sidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <AuthProvider>
      {isLoginPage ? (
        <main>{children}</main>
      ) : (
        <div className="flex flex-col md:flex-row min-h-full">
          <Sidebar />
          <main className="flex-1 overflow-auto bg-muted/30">
            <div className="p-4 md:p-8 max-w-6xl mx-auto">{children}</div>
          </main>
        </div>
      )}
    </AuthProvider>
  );
}
