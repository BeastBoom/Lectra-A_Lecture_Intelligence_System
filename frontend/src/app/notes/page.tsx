"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  AudioLines,
  Sparkles,
  BookOpen,
  Loader2,
  RefreshCw,
  Clock,
  FileText,
} from "lucide-react";
import { listSubjects, getSubjectNotes } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Subject, SubjectNotesResponse, NoteSection } from "@/types";

export default function NotesPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [notesData, setNotesData] = useState<SubjectNotesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState<NoteSection | null>(null);

  // Load subjects
  useEffect(() => {
    listSubjects()
      .then((subs) => {
        setSubjects(subs);
        if (subs.length > 0) {
          setSelectedSubjectId(subs[0].id);
        }
      })
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false));
  }, []);

  // Load notes when subject changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setNotesData(null);
      return;
    }
    setNotesLoading(true);
    setSelectedSection(null);
    getSubjectNotes(selectedSubjectId)
      .then(setNotesData)
      .catch(() => setNotesData(null))
      .finally(() => setNotesLoading(false));
  }, [selectedSubjectId]);

  // Auto-select first section when notes load
  useEffect(() => {
    if (notesData?.sections?.length && !selectedSection) {
      setSelectedSection(notesData.sections[0]);
    }
  }, [notesData, selectedSection]);

  const formatTimestamp = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return null;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-generated lecture notes organized by subject
        </p>
      </div>

      {subjects.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No subjects yet</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Upload audio files and the AI will automatically categorize them into
            subjects and generate structured notes. You can also create subjects
            manually in Settings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left — Subject Tree */}
          <div className="lg:col-span-3">
            <div className="glass rounded-xl p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Subjects
              </h3>
              <div className="space-y-1">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => setSelectedSubjectId(subject.id)}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors",
                      selectedSubjectId === subject.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <BookOpen className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate flex-1">{subject.name}</span>
                    {subject.sessionCount !== undefined && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {subject.sessionCount}
                      </span>
                    )}
                    <ChevronRight className="h-3 w-3 ml-auto shrink-0" />
                  </button>
                ))}
              </div>

              {/* Sections for selected subject */}
              {notesData && notesData.sections.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Sections
                  </h3>
                  <div className="space-y-1">
                    {notesData.sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setSelectedSection(section)}
                        className={cn(
                          "w-full text-left rounded-lg px-3 py-2 text-sm transition-colors",
                          selectedSection?.id === section.id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted text-muted-foreground"
                        )}
                      >
                        <p className="truncate">
                          {section.title || `Section ${section.sectionOrder + 1}`}
                        </p>
                        <div className="flex gap-1 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">
                            <AudioLines className="h-2.5 w-2.5 inline" />
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            <Sparkles className="h-2.5 w-2.5 inline" /> AI
                          </span>
                          {section.timestampStart !== null && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {formatTimestamp(section.timestampStart)}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center — Notes Content */}
          <div className="lg:col-span-6">
            {notesLoading ? (
              <div className="glass rounded-xl p-12 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
            ) : notesData?.consolidatedNotes ? (
              <div className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {notesData.subjectName}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Version {notesData.version} • Updated{" "}
                      {notesData.lastUpdatedAt
                        ? new Date(notesData.lastUpdatedAt).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      <Sparkles className="h-3 w-3" />
                      AI Generated
                    </span>
                  </div>
                </div>

                {/* Consolidated notes rendered as markdown-ish content */}
                <div className="prose prose-sm dark:prose-invert max-w-none min-h-[400px]">
                  {notesData.consolidatedNotes.split("\n").map((line, i) => {
                    if (line.startsWith("## ")) {
                      return (
                        <h2 key={i} className="text-base font-semibold mt-4 mb-2">
                          {line.replace("## ", "")}
                        </h2>
                      );
                    }
                    if (line.startsWith("### ")) {
                      return (
                        <h3 key={i} className="text-sm font-semibold mt-3 mb-1">
                          {line.replace("### ", "")}
                        </h3>
                      );
                    }
                    if (line.startsWith("- ")) {
                      return (
                        <li key={i} className="text-sm ml-4 list-disc">
                          {line.replace("- ", "")}
                        </li>
                      );
                    }
                    if (line.startsWith("---")) {
                      return <hr key={i} className="my-4 border-border" />;
                    }
                    if (line.trim() === "") {
                      return <br key={i} />;
                    }
                    return (
                      <p key={i} className="text-sm mb-1">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </div>
            ) : selectedSection ? (
              <div className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">
                    {selectedSection.title || "Section Notes"}
                  </h2>
                  {selectedSection.timestampStart !== null && (
                    <span className="text-xs text-muted-foreground font-mono">
                      ⏱ {formatTimestamp(selectedSection.timestampStart)}
                      {selectedSection.timestampEnd !== null &&
                        ` — ${formatTimestamp(selectedSection.timestampEnd)}`}
                    </span>
                  )}
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none min-h-[300px]">
                  {selectedSection.content.split("\n").map((line, i) => {
                    if (line.startsWith("## "))
                      return (
                        <h2 key={i} className="text-base font-semibold mt-4 mb-2">
                          {line.replace("## ", "")}
                        </h2>
                      );
                    if (line.startsWith("### "))
                      return (
                        <h3 key={i} className="text-sm font-semibold mt-3 mb-1">
                          {line.replace("### ", "")}
                        </h3>
                      );
                    if (line.startsWith("- "))
                      return (
                        <li key={i} className="text-sm ml-4 list-disc">
                          {line.replace("- ", "")}
                        </li>
                      );
                    if (line.trim() === "") return <br key={i} />;
                    return (
                      <p key={i} className="text-sm mb-1">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="glass rounded-xl p-6 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  No notes generated yet for this subject.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a lecture audio and notes will be generated automatically.
                </p>
              </div>
            )}
          </div>

          {/* Right — Timeline & Info */}
          <div className="lg:col-span-3">
            <div className="glass rounded-xl p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Subject Info
              </h3>

              {notesData && (
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sections</span>
                    <span className="font-medium">{notesData.sections.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Version</span>
                    <span className="font-medium">v{notesData.version}</span>
                  </div>
                  {notesData.lastUpdatedAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last updated</span>
                      <span className="font-medium text-xs">
                        {new Date(notesData.lastUpdatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-border pt-4 mt-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Update Timeline
                </h3>
                <div className="space-y-3">
                  {notesData?.sections
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt || "").getTime() -
                        new Date(a.createdAt || "").getTime()
                    )
                    .slice(0, 5)
                    .map((section, idx) => (
                      <div key={section.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                          {idx < 4 && (
                            <div className="w-px h-full bg-border flex-1" />
                          )}
                        </div>
                        <div className="pb-3">
                          <p className="text-sm truncate max-w-[180px]">
                            {section.title || "New section added"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {section.createdAt
                              ? new Date(section.createdAt).toLocaleDateString()
                              : "—"}
                          </p>
                        </div>
                      </div>
                    ))}

                  {(!notesData || notesData.sections.length === 0) && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No updates yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
