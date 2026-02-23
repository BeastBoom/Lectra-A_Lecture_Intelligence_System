"use client";

import { cn } from "@/lib/utils";

interface WaveformPlaceholderProps {
  className?: string;
  barCount?: number;
  progress?: number;
}

export function WaveformPlaceholder({ className, barCount = 40, progress = 0 }: WaveformPlaceholderProps) {
  return (
    <div className={cn("flex items-center gap-px h-8", className)} aria-label="Waveform visualization">
      {Array.from({ length: barCount }).map((_, i) => {
        const h = 30 + Math.sin(i * 0.8) * 25 + Math.cos(i * 1.5) * 20;
        const filled = (i / barCount) * 100 <= progress;
        return (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-full transition-colors duration-100",
              filled ? "bg-primary" : "bg-muted-foreground/20"
            )}
            style={{ height: `${h}%` }}
          />
        );
      })}
    </div>
  );
}
