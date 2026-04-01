"use client";

import { cn } from "@/lib/utils";
import { TranscriptSegment } from "@/types";
import { formatDuration } from "@/lib/utils";

const speakerRoleColors: Record<string, string> = {
  PRIMARY: "bg-primary/10 text-primary",
  STUDENT_QUESTION: "bg-blue-500/10 text-blue-500",
  STUDENT_PRESENTATION: "bg-purple-500/10 text-purple-500",
};

interface TranscriptEditorProps {
  segments: TranscriptSegment[];
  className?: string;
  /** Callback when a segment is clicked — emits the start time for seeking */
  onSegmentClick?: (startTime: number) => void;
}

export function TranscriptEditor({ segments, className, onSegmentClick }: TranscriptEditorProps) {
  return (
    <div className={cn("space-y-1", className)} role="list" aria-label="Transcript segments">
      {segments.map((seg) => (
        <div
          key={seg.id}
          className={cn(
            "group flex gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50",
            onSegmentClick ? "cursor-pointer" : "cursor-default",
            seg.confidence < 0.75 && "border-l-2 border-yellow-500/60"
          )}
          role="listitem"
          onClick={() => onSegmentClick?.(seg.start)}
        >
          <span className="text-xs text-muted-foreground font-mono shrink-0 pt-0.5 w-12">
            {formatDuration(Math.floor(seg.start))}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {seg.speaker && (
                <span className="text-xs font-medium text-primary">{seg.speaker}</span>
              )}
              {seg.speakerLabel && speakerRoleColors[seg.speakerLabel] && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-medium",
                  speakerRoleColors[seg.speakerLabel]
                )}>
                  {seg.speakerLabel}
                </span>
              )}
            </div>
            <p
              className={cn(
                "text-sm leading-relaxed",
                seg.confidence < 0.75 && "text-yellow-600 dark:text-yellow-400"
              )}
            >
              {seg.text}
            </p>
          </div>
          <span
            className={cn(
              "text-[10px] font-mono shrink-0 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
              seg.confidence >= 0.9
                ? "text-green-500"
                : seg.confidence >= 0.75
                ? "text-yellow-500"
                : "text-red-500"
            )}
          >
            {Math.round(seg.confidence * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}
