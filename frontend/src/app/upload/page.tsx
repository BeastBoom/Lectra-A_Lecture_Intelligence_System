"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  AudioLines,
  ArrowRight,
} from "lucide-react";
import { UploadDropzone } from "@/components/shared/UploadDropzone";
import { uploadAudio } from "@/lib/api";
import { useJobPoller } from "@/lib/useJobPoller";
import { cn, formatFileSize } from "@/lib/utils";
import type { UploadFile } from "@/types";
import Link from "next/link";

const stageLabels: Record<string, string> = {
  upload: "Uploading…",
  preprocess: "Preprocessing audio…",
  transcribe: "Transcribing…",
  generate: "Generating AI outputs…",
  ready: "Complete!",
  error: "Error",
};

const stageOrder = ["upload", "preprocess", "transcribe", "generate", "ready"];

function mapJobStateToStage(state: string | undefined): string {
  if (!state) return "upload";
  const mapping: Record<string, string> = {
    created: "preprocess",
    preprocessing_audio: "preprocess",
    denoising: "preprocess",
    transcribing: "transcribe",
    generating_ai_outputs: "generate",
    completed: "ready",
    failed: "error",
  };
  return mapping[state] || "preprocess";
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [courseId, setCourseId] = useState("");
  const poller = useJobPoller();

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      size: f.size,
      progress: 0,
      stage: "upload" as const,
      _file: f,
    }));

    setFiles((prev) => [...prev, ...uploadFiles]);

    // Start uploading each file
    uploadFiles.forEach(async (uf) => {
      try {
        const response = await uploadAudio(
          (uf as unknown as { _file: File })._file,
          undefined,
          courseId || undefined,
          (pct) => {
            setFiles((prev) =>
              prev.map((f) => (f.id === uf.id ? { ...f, progress: pct } : f))
            );
          },
        );

        // Upload done — switch to processing
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uf.id
              ? { ...f, progress: 100, stage: "preprocess", jobId: response.jobId, audioId: response.audioId }
              : f
          )
        );

        // Start polling for this job
        pollJob(uf.id, response.jobId);
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uf.id ? { ...f, stage: "error", progress: 0 } : f
          )
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const pollJob = async (fileId: string, jobId: string) => {
    const interval = 3000;
    let backoff = interval;

    const poll = async () => {
      try {
        const { getJobStatus } = await import("@/lib/api");
        const status = await getJobStatus(jobId);
        const stage = mapJobStateToStage(status.state);

        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, stage: stage as UploadFile["stage"] } : f))
        );

        if (status.state === "completed" || status.state === "failed") {
          return; // Done
        }

        backoff = Math.min(backoff * 1.5, 10000);
        setTimeout(poll, backoff);
      } catch {
        setTimeout(poll, backoff);
      }
    };
    poll();
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Audio</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload lecture recordings for automatic transcription and AI processing
        </p>
      </div>

      {/* Course selector (minimal) */}
      <div className="glass rounded-xl p-5">
        <label className="text-sm font-medium mb-2 block">Course (optional)</label>
        <input
          type="text"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          placeholder="e.g. CS101, Biology 201…"
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Drop zone */}
      <UploadDropzone onFilesAdded={handleFilesAdded} />

      {/* File list */}
      <AnimatePresence>
        {files.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  "rounded-lg p-2 shrink-0",
                  file.stage === "ready" ? "bg-green-500/10" :
                  file.stage === "error" ? "bg-destructive/10" :
                  "bg-primary/10"
                )}>
                  {file.stage === "ready" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : file.stage === "error" ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : (
                    <AudioLines className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {file.stage === "ready" && file.audioId && (
                  <Link
                    href={`/audio/${file.audioId}`}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
                <button onClick={() => removeFile(file.id)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Pipeline progress */}
            <div className="flex items-center gap-1 mb-2">
              {stageOrder.map((stage, idx) => {
                const currentIdx = stageOrder.indexOf(file.stage === "error" ? stageOrder[stageOrder.length - 1] : file.stage);
                const isComplete = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <div
                    key={stage}
                    className={cn(
                      "flex-1 h-1.5 rounded-full transition-colors",
                      isComplete ? "bg-primary" :
                      isCurrent ? "bg-primary/50 animate-pulse" :
                      "bg-muted"
                    )}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className={cn(
                file.stage === "error" ? "text-destructive" : "text-muted-foreground"
              )}>
                {stageLabels[file.stage] || file.stage}
              </span>
              {file.stage === "upload" && (
                <span className="text-primary font-mono">{file.progress}%</span>
              )}
              {file.stage !== "upload" && file.stage !== "ready" && file.stage !== "error" && (
                <Loader2 className="h-3 w-3 text-primary animate-spin" />
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {files.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          No files queued. Drag & drop or click to upload.
        </p>
      )}
    </div>
  );
}
