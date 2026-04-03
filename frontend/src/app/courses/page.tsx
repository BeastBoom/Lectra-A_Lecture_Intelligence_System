"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, AudioLines, StickyNote, Loader2, Plus } from "lucide-react";
import { listSubjects, getSubjectSessions } from "@/lib/api";
import type { Subject } from "@/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

const SUBJECT_COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#06b6d4",
];

export default function CoursesPage() {
  const [subjects, setSubjects] = useState<(Subject & { sessionCount?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await listSubjects();
        // Fetch session counts for each subject
        const withCounts = await Promise.all(
          list.map(async (s) => {
            try {
              const sessions = await getSubjectSessions(s.id);
              return { ...s, sessionCount: sessions.sessions.length };
            } catch {
              return { ...s, sessionCount: 0 };
            }
          })
        );
        setSubjects(withCounts);
      } catch (err) {
        console.error("Failed to load subjects:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subjects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Loading..." : `${subjects.length} subject${subjects.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/upload"
          className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Upload Lecture
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No subjects yet. Upload a lecture to automatically create one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {subjects.map((subject, idx) => {
            const color = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
            return (
              <Link key={subject.id} href={`/courses/${subject.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glow-card glass rounded-xl p-5 cursor-pointer h-full"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="rounded-lg p-2.5 shrink-0"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <BookOpen className="h-5 w-5" style={{ color }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate">{subject.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {subject.description || "AI-organized subject"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <AudioLines className="h-3.5 w-3.5" />
                      <span>{subject.sessionCount ?? 0} lectures</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StickyNote className="h-3.5 w-3.5" />
                      <span>Notes</span>
                    </div>
                  </div>

                  <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (subject.sessionCount ?? 0) * 20)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
