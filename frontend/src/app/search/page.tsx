"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search as SearchIcon, AudioLines, FileText, StickyNote, BrainCircuit, Loader2 } from "lucide-react";
import { listAudios, listDocuments, listSubjects, getSubjectNotes } from "@/lib/api";
import type { AudioSummary, Document } from "@/types";
import { cn, truncate } from "@/lib/utils";

interface NoteResult {
  id: string;
  subjectName: string;
  title: string;
  content: string;
}

const categories = ["All", "Audio", "Documents", "Notes", "Quiz"] as const;

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>("All");
  const [audios, setAudios] = useState<AudioSummary[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notes, setNotes] = useState<NoteResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [audioList, docList, subjectList] = await Promise.all([
          listAudios().catch(() => []),
          listDocuments().catch(() => []),
          listSubjects().catch(() => []),
        ]);
        setAudios(audioList);
        setDocuments(docList);

        // Fetch notes from each subject
        const notesBySubject = await Promise.all(
+          subjectList.map(async (subject) => {
+            try {
+              const subjectNotes = await getSubjectNotes(subject.id);
+              const entries: NoteResult[] = subjectNotes.sections.map((section) => ({
+                id: section.id,
+                subjectName: subjectNotes.subjectName,
+                title: section.title || subjectNotes.subjectName,
+                content: section.content,
+              }));
+
+              if (subjectNotes.consolidatedNotes) {
+                entries.push({
+                  id: `consolidated-${subject.id}`,
+                  subjectName: subjectNotes.subjectName,
+                  title: `${subjectNotes.subjectName} — Consolidated Notes`,
+                  content: subjectNotes.consolidatedNotes,
+                });
+              }
+
+              return entries;
+            } catch {
+              return [];
+            }
+          })
+        );
+        setNotes(notesBySubject.flat());
      } catch (err) {
        console.error("Search data load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const hasQuery = query.length > 0;
  const q = query.toLowerCase();

  const audioResults = audios.filter((a) => a.title.toLowerCase().includes(q));
  const docResults = documents.filter((d) => d.title.toLowerCase().includes(q));
  const noteResults = notes.filter(
    (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground mt-1">Search across all your content</p>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3 rounded-xl border-2 border-border px-4 py-3 bg-card focus-within:border-primary transition-colors">
        <SearchIcon className="h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lectures, notes, documents, quizzes..."
          className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          autoFocus
        />
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      ) : hasQuery ? (
        <div className="space-y-6">
          {(activeCategory === "All" || activeCategory === "Audio") && audioResults.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <AudioLines className="h-3.5 w-3.5" /> Audio ({audioResults.length})
              </h3>
              <div className="space-y-2">
                {audioResults.map((audio) => (
                  <motion.div key={audio.audioId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-lg p-4 hover:bg-muted/30 cursor-pointer transition-colors">
                    <p className="text-sm font-medium">{audio.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{audio.subjectName || audio.courseId || "—"} · {audio.status}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {(activeCategory === "All" || activeCategory === "Documents") && docResults.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" /> Documents ({docResults.length})
              </h3>
              <div className="space-y-2">
                {docResults.map((doc) => (
                  <motion.div key={doc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-lg p-4 hover:bg-muted/30 cursor-pointer transition-colors">
                    <p className="text-sm font-medium">{doc.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{doc.type.toUpperCase()} · {doc.pages} pages · {doc.fileSize}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {(activeCategory === "All" || activeCategory === "Notes") && noteResults.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <StickyNote className="h-3.5 w-3.5" /> Notes ({noteResults.length})
              </h3>
              <div className="space-y-2">
                {noteResults.map((note) => (
                  <motion.div key={note.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-lg p-4 hover:bg-muted/30 cursor-pointer transition-colors">
                    <p className="text-sm font-medium">{note.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{truncate(note.content, 150)}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {audioResults.length === 0 && docResults.length === 0 && noteResults.length === 0 && (
            <div className="text-center py-16">
              <SearchIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No results found for &ldquo;{query}&rdquo;</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <SearchIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Start typing to search across all your content</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-40"><span className="text-muted-foreground">Loading...</span></div>}>
      <SearchContent />
    </Suspense>
  );
}
