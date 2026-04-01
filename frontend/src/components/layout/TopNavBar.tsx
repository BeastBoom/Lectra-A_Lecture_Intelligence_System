"use client";

import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User,
  LogOut,
  Settings,
  AudioLines,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { listAudios } from "@/lib/api";
import { getUser, clearAuth } from "@/lib/auth-store";
import type { LucideIcon } from "lucide-react";

type Notif = { id: string; title: string; subtitle: string; href: string; icon: LucideIcon; iconBg: string; iconColor: string };

export function TopNavBar() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [user, setUser] = useState<{ full_name?: string; email?: string } | null>(null);
  const [notifications, setNotifications] = useState<Notif[]>([]);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const u = getUser();
      if (u) setUser(u);
    } catch { /* ignore parse errors */ }

    // Fetch real notifications from processed audios
    listAudios().then((audios) => {
      const items: Notif[] = audios
        .filter((a) => a.status === "ready")
        .slice(0, 5)
        .map((a) => ({
          id: a.audioId,
          title: a.title,
          subtitle: "Transcript & summary ready",
          href: `/audio/${a.audioId}`,
          icon: AudioLines,
          iconBg: "bg-primary/10",
          iconColor: "text-primary",
        }));

      if (items.length === 0) {
        items.push({
          id: "welcome",
          title: "Welcome to Lectra!",
          subtitle: "Upload your first lecture to get started",
          href: "/upload",
          icon: Upload,
          iconBg: "bg-muted",
          iconColor: "text-muted-foreground",
        });
      }
      setNotifications(items);
    }).catch(() => { /* ignore fetch errors */ });
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const userName = user?.full_name || "User";
  const userEmail = user?.email || "";
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-card/80 backdrop-blur-xl px-6">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-200",
            searchFocused
              ? "border-primary bg-background shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]"
              : "border-border bg-muted/50"
          )}
        >
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lectures, notes, documents..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            aria-label="Global search"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </form>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 rounded-lg border border-border bg-popover shadow-lg z-50">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-sm font-semibold">Notifications</p>
                <span className="text-xs text-muted-foreground">{notifications.length} items</span>
              </div>
              <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-3 py-6 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => { setNotifOpen(false); router.push(n.href); }}
                      className="flex gap-3 rounded-md px-3 py-2.5 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5", n.iconBg)}>
                        <n.icon className={cn("h-4 w-4", n.iconColor)} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.subtitle}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        )}

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">
                {initials}
              </span>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-popover p-1 shadow-lg z-50">
              <div className="px-3 py-2 border-b border-border mb-1">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <button
                onClick={() => { setProfileOpen(false); router.push("/settings"); }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button
                onClick={() => {
                  clearAuth();
                  window.location.href = "/";
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
