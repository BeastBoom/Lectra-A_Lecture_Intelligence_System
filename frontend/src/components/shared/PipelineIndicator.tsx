"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

const stages = [
  { key: "upload", label: "Upload" },
  { key: "preprocess", label: "Preprocess" },
  { key: "transcribe", label: "Transcribe" },
  { key: "generate", label: "Generate" },
  { key: "ready", label: "Ready" },
] as const;

interface PipelineIndicatorProps {
  currentStage: string;
  className?: string;
}

export function PipelineIndicator({ currentStage, className }: PipelineIndicatorProps) {
  const currentIdx = stages.findIndex((s) => s.key === currentStage);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {stages.map((stage, idx) => {
        const isComplete = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isPending = idx > currentIdx;

        return (
          <div key={stage.key} className="flex items-center gap-1">
            {/* Step circle */}
            <motion.div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors shrink-0",
                isComplete && "bg-primary text-primary-foreground",
                isCurrent && "bg-primary/20 text-primary breathing",
                isPending && "bg-muted text-muted-foreground"
              )}
              animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
              transition={isCurrent ? { repeat: Infinity, duration: 2 } : {}}
            >
              {isComplete ? (
                <Check className="h-3.5 w-3.5" />
              ) : isCurrent ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                idx + 1
              )}
            </motion.div>

            {/* Label */}
            <span
              className={cn(
                "text-[10px] font-medium mr-1 hidden sm:inline",
                isComplete && "text-primary",
                isCurrent && "text-primary",
                isPending && "text-muted-foreground"
              )}
            >
              {stage.label}
            </span>

            {/* Connector */}
            {idx < stages.length - 1 && (
              <div className={cn(
                "h-0.5 w-4 rounded-full transition-colors",
                idx < currentIdx ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
