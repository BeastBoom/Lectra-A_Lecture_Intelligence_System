"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "./AppShell";

// These routes render WITHOUT the sidebar/topnav shell
const PUBLIC_PATHS = ["/", "/landing", "/login", "/signup", "/auth", "/forgot-password"];

export function ConditionalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isPublic) return <>{children}</>;
  return <AppShell>{children}</AppShell>;
}
