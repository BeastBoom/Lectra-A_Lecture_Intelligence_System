"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TopicCardProps {
  title: string;
  summary: string;
  keywords: string[];
  className?: string;
}

export function TopicCard({ title, summary, keywords, className }: TopicCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("glow-card glass rounded-xl p-4 space-y-2", className)}
    >
      <h4 className="text-sm font-semibold">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{summary}</p>
      <div className="flex flex-wrap gap-1.5">
        {keywords.map((kw) => (
          <span
            key={kw}
            className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
          >
            {kw}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
