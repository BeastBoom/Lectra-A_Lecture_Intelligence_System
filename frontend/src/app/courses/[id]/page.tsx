"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { AudioLines, StickyNote, ArrowLeft, Clock, Loader2 } from "lucide-react";
import { getSubject, getSubjectSessions, getSubjectNotes } from "@/lib/api";
import type { Subject } from "@/types";
import Link from "next/link";

interface Session {
  audioId: string;
  title: string;
  durationSeconds: number | null;
  uploadedAt: string | null;
  subjectSource: string;
}

export default function CourseDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [hasNotes, setHasNotes] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const subjectData = await getSubject(id);
        setSubject(subjectData);

        try {
          const sessionsData = await getSubjectSessions(id);
          setSessions(sessionsData.sessions || []);
        } catch (err) {
          console.error("Failed to load subject sessions:", err);
          setSessions([]);
        }

        // Check if notes exist
        try {
          const notesData = await getSubjectNotes(id);
          setHasNotes(!!(notesData.consolidatedNotes || (notesData.sections && notesData.sections.length > 0)));
        } catch {
          setHasNotes(false);
        }
      } catch (err) {
        console.error("Failed to load subject detail:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Subject not found.</p>
        <Link href="/courses" className="text-primary hover:underline text-sm mt-2 inline-block">← Back to subjects</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/courses" className="rounded-lg p-2 hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{subject.name}</h1>
          <p className="text-sm text-muted-foreground">
            {subject.description || "AI-organized subject"} · {sessions.length} lecture{sessions.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Notes Section */}
      {hasNotes && (
        <Link href="/notes">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-5 cursor-pointer hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <StickyNote className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Consolidated Notes</h3>
                <p className="text-xs text-muted-foreground">
                  View AI-generated notes for this subject
                </p>
              </div>
            </div>
          </motion.div>
        </Link>
      )}

      {/* Lectures */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Lectures ({sessions.length})
        </h2>

        {sessions.length === 0 ? (
          <div className="text-center py-8 glass rounded-xl">
            <p className="text-sm text-muted-foreground">No lectures in this subject yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session, idx) => (
              <motion.div
                key={session.audioId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link href={`/audio/${session.audioId}`}>
                  <div className="flex items-center gap-3 rounded-xl glass p-4 hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                      <AudioLines className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{session.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {session.durationSeconds && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.round(session.durationSeconds / 60)}m
                          </span>
                        )}
                        {session.uploadedAt && (
                          <span>{new Date(session.uploadedAt).toLocaleDateString()}</span>
                        )}
                        <span className="capitalize text-[10px] px-1.5 py-0.5 rounded-full bg-muted">
                          {session.subjectSource === "ai_inferred" ? "AI-detected" : session.subjectSource}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Link href="/upload">
        <button className="w-full rounded-xl border-2 border-dashed border-border p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          + Upload New Lecture
        </button>
      </Link>
    </div>
  );
}
