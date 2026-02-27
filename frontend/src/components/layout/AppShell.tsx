"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarNav } from "./SidebarNav";
import { TopNavBar } from "./TopNavBar";
import { PageTransition } from "./PageTransition";
import { getToken } from "@/lib/auth-store";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.push("/");
    }
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav />
      <div className="flex flex-col flex-1 ml-[260px] transition-all duration-300">
        <TopNavBar />
        <main className="flex-1 overflow-y-auto p-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
