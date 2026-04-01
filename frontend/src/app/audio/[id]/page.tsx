"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, AlertTriangle, RefreshCw, Eye, EyeOff } from "lucide-react";
import { AudioPlayer } from "@/components/shared/AudioPlayer";
import { TranscriptEditor } from "@/components/shared/TranscriptEditor";
import { getAudio, getArtifacts, getTranscript, getArtifactDownloadUrl } from "@/lib/api";
import type { AudioDetail, TranscriptSegment, ArtifactSummary } from "@/types";
import Link from "next/link";

export default function AudioDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [audio, setAudio] = useState<AudioDetail | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactSummary[]>([]);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showClean, setShowClean] = useState(true);

  // Ref for AudioPlayer seek control
  const playerSeekRef = useRef<((time: number) => void) | null>(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const [audioData, arts, segs] = await Promise.all([
          getAudio(id!),
          getArtifacts(id!),
          getTranscript(id!).catch(() => []),
        ]);

        setAudio(audioData);
        setArtifacts(arts);
        setTranscript(segs);

        // Find primary artifact for playback
        const primaryArt = arts.find(
          (a) => a.artifactType === "primary_v1" || a.artifactType === "denoised_v1"
        ) || arts[0];

        if (primaryArt) {
          const url = getArtifactDownloadUrl(primaryArt.id);
          // Fetch artifact bytes and create blob URL
          try {
            const res = await fetch(url);
            if (res.ok) {
              const blob = await res.blob();
              setAudioSrc(URL.createObjectURL(blob));
            }
          } catch {
            // If streaming fetch fails, try using the URL directly
            setAudioSrc(url);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load audio");
      } finally {
        setLoading(false);
      }
    }
    load();

    // Cleanup blob URLs on unmount
    return () => {
      if (audioSrc && audioSrc.startsWith("blob:")) {
        URL.revokeObjectURL(audioSrc);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSegmentClick = useCallback((startTime: number) => {
    if (playerSeekRef.current) {
      playerSeekRef.current(startTime);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !audio) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-muted-foreground">{error || "Audio not found"}</p>
        <Link href="/audio" className="text-sm text-primary hover:underline">← Back to library</Link>
      </div>
    );
  }

  // Prepare transcript with text mode toggle
  const displaySegments: TranscriptSegment[] = transcript.map((seg) => ({
    ...seg,
    text: showClean ? (seg.textClean || seg.textRaw || seg.text) : (seg.textRaw || seg.text),
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/audio" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight truncate">{audio.title}</h1>
          <p className="text-sm text-muted-foreground">
            {audio.courseId || "No course"} · {audio.durationSeconds ? `${Math.round(audio.durationSeconds / 60)} min` : "—"} · {audio.status}
          </p>
        </div>
        {audio.status === "error" && (
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors">
            <RefreshCw className="h-4 w-4" /> Reprocess
          </button>
        )}
      </div>

      {/* Audio Player */}
      <AudioPlayer
        title={audio.title}
        duration={audio.durationSeconds || 0}
        src={audioSrc || undefined}
        onSeekRef={(seekFn) => { playerSeekRef.current = seekFn; }}
      />

      {/* Summary */}
      {audio.summary && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-2">AI Summary</h2>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{audio.summary}</p>
        </motion.div>
      )}

      {/* Transcript */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Transcript ({displaySegments.length} segments)</h2>
          <button
            onClick={() => setShowClean(!showClean)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showClean ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {showClean ? "Clean" : "Raw"}
          </button>
        </div>
        {displaySegments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {audio.status === "processing" ? "Transcript is being generated…" : "No transcript available."}
          </p>
        ) : (
          <TranscriptEditor
            segments={displaySegments}
            onSegmentClick={handleSegmentClick}
            className="max-h-[60vh] overflow-y-auto"
          />
        )}
      </div>

      {/* Artifacts */}
      {artifacts.length > 0 && (
        <div className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-3">Artifacts ({artifacts.length})</h2>
          <div className="space-y-2">
            {artifacts.map((art) => (
              <div key={art.id} className="flex items-center justify-between rounded-lg p-3 hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium">{art.artifactType}</p>
                  <p className="text-xs text-muted-foreground">{art.createdAt}</p>
                </div>
                {art.downloadUrl && (
                  <a
                    href={getArtifactDownloadUrl(art.id)}
                    className="text-xs text-primary hover:underline"
                    download
                  >
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
