"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";

interface MCQCardProps {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  onAnswer?: (correct: boolean) => void;
}

export function MCQCard({ question, options, correctIndex, explanation, onAnswer }: MCQCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    onAnswer?.(idx === correctIndex);
  };

  return (
    <div className="glass rounded-xl p-6 w-full max-w-lg mx-auto">
      <p className="text-base font-medium mb-5 leading-relaxed">{question}</p>

      <div className="space-y-2.5">
        {options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            disabled={answered}
            className={cn(
              "w-full text-left rounded-lg px-4 py-3 text-sm transition-all duration-200 border",
              answered && idx === correctIndex
                ? "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400"
                : answered && idx === selected
                ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                : "border-border hover:border-primary/50 hover:bg-primary/5"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs font-medium shrink-0">
                {String.fromCharCode(65 + idx)}
              </span>
              <span>{opt}</span>
              {answered && idx === correctIndex && (
                <CheckCircle2 className="h-4 w-4 ml-auto text-green-500" />
              )}
              {answered && idx === selected && idx !== correctIndex && (
                <XCircle className="h-4 w-4 ml-auto text-red-500" />
              )}
            </div>
          </button>
        ))}
      </div>

      {answered && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 rounded-lg bg-primary/5 border border-primary/20 p-4"
        >
          <p className="text-xs font-medium text-primary mb-1">Explanation</p>
          <p className="text-sm text-muted-foreground">{explanation}</p>
        </motion.div>
      )}
    </div>
  );
}
