"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

interface FlashcardProps {
  front: string;
  back: string;
  onEasy?: () => void;
  onHard?: () => void;
}

export function Flashcard({ front, back, onEasy, onHard }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="perspective-[1200px] w-full max-w-md mx-auto">
      <motion.div
        className="relative w-full h-64 cursor-pointer"
        onClick={() => setFlipped(!flipped)}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className={cn(
            "absolute inset-0 glass rounded-xl p-6 flex flex-col items-center justify-center text-center",
            "backface-hidden"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="text-xs text-muted-foreground mb-3">Question</p>
          <p className="text-lg font-medium leading-relaxed">{front}</p>
          <p className="text-xs text-muted-foreground mt-4">Tap to reveal</p>
        </div>

        {/* Back */}
        <div
          className={cn(
            "absolute inset-0 glass rounded-xl p-6 flex flex-col items-center justify-center text-center",
            "backface-hidden"
          )}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-xs text-primary mb-3">Answer</p>
          <p className="text-sm leading-relaxed">{back}</p>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <button
          onClick={() => { setFlipped(false); onHard?.(); }}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
        >
          Hard
        </button>
        <button
          onClick={() => setFlipped(false)}
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={() => { setFlipped(false); onEasy?.(); }}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
        >
          Easy
        </button>
      </div>
    </div>
  );
}
