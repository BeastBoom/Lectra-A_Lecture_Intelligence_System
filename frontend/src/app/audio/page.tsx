"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Grid3X3, List, Filter, MoreHorizontal, AudioLines, Check, Loader2 } from "lucide-react";
import { listAudios } from "@/lib/api";
import type { AudioSummary } from "@/types";
import { WaveformPlaceholder } from "@/components/shared/WaveformPlaceholder";
import { cn, formatDuration, formatDate } from "@/lib/utils";
import Link from "next/link";

export default function AudioPage() {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [audios, setAudios] = useState<AudioSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAudios()
      .then(setAudios)
      .catch((err) => console.error("Failed to load audios:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredAudio = audios.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.courseId || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audio Files</h1>
          <p className="text-sm text-muted-foreground mt-1">{filteredAudio.length} files in library</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 bg-muted/50 focus-within:border-primary transition-colors">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audio files..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors">
          <Filter className="h-4 w-4" />
          Filters
        </button>
        <div className="flex items-center rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={cn("p-2 transition-colors", viewMode === "grid" ? "bg-primary/10 text-primary" : "hover:bg-muted")}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={cn("p-2 transition-colors", viewMode === "table" ? "bg-primary/10 text-primary" : "hover:bg-muted")}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
        {selectedIds.size > 0 && (
          <span className="text-xs text-primary font-medium">{selectedIds.size} selected</span>
        )}
      </div>

      {filteredAudio.length === 0 ? (
        <div className="text-center py-16">
          <AudioLines className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No audio files found. Upload one to get started!</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAudio.map((audio, idx) => (
            <motion.div
              key={audio.audioId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link href={`/audio/${audio.audioId}`}>
                <div className="glow-card glass rounded-xl p-4 cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.preventDefault(); toggleSelect(audio.audioId); }}
                        className={cn(
                          "h-5 w-5 rounded border flex items-center justify-center transition-colors",
                          selectedIds.has(audio.audioId) ? "bg-primary border-primary text-primary-foreground" : "border-border hover:border-primary"
                        )}
                      >
                        {selectedIds.has(audio.audioId) && <Check className="h-3 w-3" />}
                      </button>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-medium",
                        audio.status === "ready" ? "bg-green-500/10 text-green-500" :
                        audio.status === "processing" ? "bg-blue-500/10 text-blue-500" :
                        "bg-red-500/10 text-red-500"
                      )}>
                        {audio.status}
                      </span>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  <WaveformPlaceholder className="mb-3" progress={audio.status === "ready" ? 100 : 45} />

                  <h3 className="text-sm font-semibold truncate">{audio.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{audio.courseId || "No course"}</p>

                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span>{audio.durationSeconds ? formatDuration(Math.round(audio.durationSeconds)) : "—"}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left p-3 w-8"></th>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Course</th>
                <th className="text-left p-3">Duration</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filteredAudio.map((audio) => (
                <tr key={audio.audioId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <button
                      onClick={() => toggleSelect(audio.audioId)}
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center",
                        selectedIds.has(audio.audioId) ? "bg-primary border-primary text-primary-foreground" : "border-border"
                      )}
                    >
                      {selectedIds.has(audio.audioId) && <Check className="h-2.5 w-2.5" />}
                    </button>
                  </td>
                  <td className="p-3">
                    <Link href={`/audio/${audio.audioId}`} className="font-medium hover:text-primary transition-colors">
                      {audio.title}
                    </Link>
                  </td>
                  <td className="p-3 text-muted-foreground">{audio.courseId || "—"}</td>
                  <td className="p-3 font-mono text-xs">{audio.durationSeconds ? formatDuration(Math.round(audio.durationSeconds)) : "—"}</td>
                  <td className="p-3">
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium",
                      audio.status === "ready" ? "bg-green-500/10 text-green-500" :
                      audio.status === "processing" ? "bg-blue-500/10 text-blue-500" :
                      "bg-red-500/10 text-red-500"
                    )}>
                      {audio.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{audio.uploadedAt ? formatDate(audio.uploadedAt) : "—"}</td>
                  <td className="p-3">
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
