"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search as SearchIcon, AudioLines, FileText, StickyNote, BrainCircuit, Loader2 } from "lucide-react";
import { listAudios, listDocuments } from "@/lib/api";
import { mockNotes } from "@/lib/mock/notes";
import { mockFlashcardDecks } from "@/lib/mock/quiz";
import type { AudioSummary, Document } from "@/types";
import { cn, truncate } from "@/lib/utils";

const categories = ["All", "Audio", "Documents", "Notes", "Quiz"] as const;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>("All");
  const [audios, setAudios] = useState<AudioSummary[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      listAudios().catch(() => []),
      listDocuments().catch(() => []),
    ]).then(([a, d]) => {
      setAudios(a);
      setDocuments(d);
    }).finally(() => setLoading(false));
  }, []);

  const hasQuery = query.length > 0;

  const audioResults = audios.filter(
    (a) => a.title.toLowerCase().includes(query.toLowerCase())
  );
  const docResults = documents.filter((d) => d.title.toLowerCase().includes(query.toLowerCase()));
  const noteResults = mockNotes.filter(
    (n) => n.title.toLowerCase().includes(query.toLowerCase()) || n.content.toLowerCase().includes(query.toLowerCase())
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
                    <p className="text-xs text-muted-foreground mt-1">{audio.courseId || "—"} · {audio.status}</p>
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
