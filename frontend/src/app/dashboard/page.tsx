"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AudioLines,
  Upload,
  StickyNote,
  BrainCircuit,
  ArrowUpRight,
  Zap,
  Clock,
  TrendingUp,
} from "lucide-react";
import { KpiCard } from "@/components/shared/KpiCard";
import { SkeletonCard } from "@/components/shared/SkeletonCard";
import { cn } from "@/lib/utils";
import { getDashboardSummary, listAudios } from "@/lib/api";
import type { DashboardSummary, AudioSummary, Activity } from "@/types";
import Link from "next/link";

const activityIcons = {
  upload: Upload,
  transcribe: AudioLines,
  note: StickyNote,
  quiz: BrainCircuit,
  document: StickyNote,
};

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardSummary | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLabel, setAiLabel] = useState<string>("idle");

  useEffect(() => {
    async function load() {
      try {
        const [summary, audios] = await Promise.all([
          getDashboardSummary(),
          listAudios(),
        ]);
        setStats(summary);

        // Derive recent activity from audios
        const acts: Activity[] = audios.slice(0, 6).map((a: AudioSummary) => ({
          id: a.audioId,
          type: a.status === "ready" ? "transcribe" as const : "upload" as const,
          title: a.status === "ready" ? "Transcription Complete" : "Processing…",
          description: `${a.title}${a.durationSeconds ? ` (${Math.round(a.durationSeconds / 60)}m)` : ""}`,
          timestamp: a.uploadedAt || new Date().toISOString(),
        }));
        setActivities(acts);

        // Derive AI status
        const hasProcessing = audios.some((a: AudioSummary) => a.status === "processing");
        setAiLabel(hasProcessing ? "transcribing" : "idle");
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const aiStatusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    idle: { label: "AI Idle", color: "text-muted-foreground", bg: "bg-muted", dot: "bg-muted-foreground" },
    transcribing: { label: "Transcribing…", color: "text-blue-500", bg: "bg-blue-500/10", dot: "bg-blue-500 animate-pulse" },
    generating: { label: "Generating…", color: "text-primary", bg: "bg-primary/10", dot: "bg-primary animate-pulse" },
    error: { label: "Error", color: "text-destructive", bg: "bg-destructive/10", dot: "bg-destructive" },
  };

  const aiStatus = aiStatusConfig[aiLabel] || aiStatusConfig.idle;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your AI-powered lecture intelligence hub
          </p>
        </div>
        <div className={cn("flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium", aiStatus.bg, aiStatus.color)}>
          <div className={cn("h-2 w-2 rounded-full", aiStatus.dot)} />
          {aiStatus.label}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : stats ? (
          <>
            <KpiCard title="Lectures Processed" value={stats.processedToday} icon={AudioLines} trend="+12%" />
            <KpiCard title="Pending Uploads" value={stats.pendingUploads} icon={Clock} />
            <KpiCard title="Notes Updated" value={stats.notesUpdated} icon={StickyNote} trend="+5%" />
            <KpiCard title="Flashcards Generated" value={stats.quizGenerated} icon={BrainCircuit} trend="+18%" />
          </>
        ) : (
          <p className="text-sm text-muted-foreground col-span-4">Could not load dashboard data.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
            <Link href="/audio" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No recent activity. Upload audio to get started!</p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, idx) => {
                const Icon = activityIcons[activity.type] || Zap;
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-start gap-3 rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(activity.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          {/* Quick Upload CTA */}
          <Link href="/upload">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass rounded-xl p-5 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-sm font-semibold">Quick Upload</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Drag & drop audio files to transcribe
              </p>
            </motion.div>
          </Link>

          {/* Stats card */}
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4">This Week</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Processing Time</span>
                <span className="text-xs font-medium">~38s avg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Accuracy</span>
                <span className="text-xs font-medium text-primary">91.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Storage Used</span>
                <span className="text-xs font-medium">2.3 GB</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2">
                <div className="h-full w-[23%] rounded-full bg-primary" />
              </div>
              <p className="text-[10px] text-muted-foreground">2.3 / 10 GB used</p>
            </div>
          </div>

          {/* Trend indicator */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Productivity</h3>
            </div>
            <p className="text-2xl font-bold text-primary">+23%</p>
            <p className="text-xs text-muted-foreground">vs. last week</p>
          </div>
        </div>
      </div>
    </div>
  );
}
