"use client";

import { motion } from "framer-motion";
import { FileText, Sparkles, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ResultsPanelProps {
  transcript: string;
  summary: string;
  fileName: string;
}

export function ResultsPanel({ transcript, summary, fileName }: ResultsPanelProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [copied, setCopied] = useState<"transcript" | "summary" | null>(null);

  const handleCopy = async (text: string, type: "transcript" | "summary") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">Processing Complete</p>
          <p className="text-xs text-muted-foreground">{fileName}</p>
        </div>
      </div>

      {/* AI Summary */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI Summary
          </h3>
          <button
            onClick={() => handleCopy(summary, "summary")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied === "summary" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            {copied === "summary" ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
          {summary}
        </div>
      </div>

      {/* Transcript (collapsible) */}
      <div className="border-t border-border">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full px-5 py-3 flex items-center justify-between text-sm hover:bg-muted/30 transition-colors"
        >
          <span className="flex items-center gap-2 font-medium">
            <FileText className="h-3.5 w-3.5" />
            Raw Transcript
          </span>
          {showTranscript ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showTranscript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="px-5 pb-5"
          >
            <div className="flex justify-end mb-2">
              <button
                onClick={() => handleCopy(transcript, "transcript")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied === "transcript" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                {copied === "transcript" ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap">
              {transcript}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
