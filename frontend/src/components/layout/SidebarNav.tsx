"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Upload,
  AudioLines,
  FileText,
  StickyNote,
  BrainCircuit,
  GraduationCap,
  Search,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Upload", href: "/upload", icon: Upload },
  { label: "Audio Files", href: "/audio", icon: AudioLines },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Notes", href: "/notes", icon: StickyNote },
  { label: "Quiz", href: "/quiz", icon: BrainCircuit },
  { label: "Courses", href: "/courses", icon: GraduationCap },
  { label: "Search", href: "/search", icon: Search },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-border bg-card/80 backdrop-blur-xl"
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="text-lg font-bold tracking-tight overflow-hidden whitespace-nowrap"
            >
              Lectra
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              <item.icon className="h-5 w-5 shrink-0" />

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for collapsed mode */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-md bg-popover text-popover-foreground text-xs shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse button */}
      <div className="p-3 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Collapse
              </motion.span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
