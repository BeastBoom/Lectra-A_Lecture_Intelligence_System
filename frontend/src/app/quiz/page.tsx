"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, RotateCcw, Timer, ChevronRight } from "lucide-react";
import { Flashcard } from "@/components/shared/Flashcard";
import { MCQCard } from "@/components/shared/MCQCard";
import { mockFlashcardDecks, mockMCQs } from "@/lib/mock/quiz";
import { cn } from "@/lib/utils";

type Mode = "flashcards" | "mcq";

export default function QuizPage() {
  const [mode, setMode] = useState<Mode>("flashcards");
  const [currentCard, setCurrentCard] = useState(0);
  const [currentMCQ, setCurrentMCQ] = useState(0);
  const [streak, setStreak] = useState(3);
  const [selectedDeck, setSelectedDeck] = useState(mockFlashcardDecks[0]);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [timeLeft, setTimeLeft] = useState(120);

  const nextCard = () => {
    if (currentCard < selectedDeck.cards.length - 1) setCurrentCard((p) => p + 1);
    else setCurrentCard(0);
  };

  const handleMCQAnswer = (correct: boolean) => {
    setScore((p) => ({ correct: p.correct + (correct ? 1 : 0), total: p.total + 1 }));
    setTimeout(() => {
      if (currentMCQ < mockMCQs.length - 1) setCurrentMCQ((p) => p + 1);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quiz</h1>
        <p className="text-sm text-muted-foreground mt-1">Test your knowledge with AI-generated questions</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-border p-1 w-fit">
        <button
          onClick={() => setMode("flashcards")}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-all",
            mode === "flashcards" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
          )}
        >
          Flashcards
        </button>
        <button
          onClick={() => setMode("mcq")}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-all",
            mode === "mcq" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
          )}
        >
          MCQ Quiz
        </button>
      </div>

      {mode === "flashcards" ? (
        <div className="space-y-6">
          {/* Deck Selector + Stats */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {mockFlashcardDecks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => { setSelectedDeck(deck); setCurrentCard(0); }}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm transition-all",
                    selectedDeck.id === deck.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {deck.title}
                  <span className="ml-1.5 text-xs text-muted-foreground">({deck.cardCount})</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="font-medium">{streak}</span>
                <span className="text-xs text-muted-foreground">streak</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {currentCard + 1} / {selectedDeck.cards.length}
              </span>
            </div>
          </div>

          {/* Card */}
          <Flashcard
            key={selectedDeck.cards[currentCard].id}
            front={selectedDeck.cards[currentCard].front}
            back={selectedDeck.cards[currentCard].back}
            onEasy={() => { setStreak((p) => p + 1); nextCard(); }}
            onHard={() => { setStreak(0); nextCard(); }}
          />

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2">
            {selectedDeck.cards.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  idx === currentCard ? "bg-primary" : idx < currentCard ? "bg-primary/40" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* MCQ Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</span>
              </div>
              <div className="text-sm">
                Score: <span className="font-medium text-primary">{score.correct}</span>
                <span className="text-muted-foreground">/{score.total}</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              Question {currentMCQ + 1} of {mockMCQs.length}
            </span>
          </div>

          {/* MCQ Card */}
          <MCQCard
            key={mockMCQs[currentMCQ].id}
            question={mockMCQs[currentMCQ].question}
            options={mockMCQs[currentMCQ].options}
            correctIndex={mockMCQs[currentMCQ].correctIndex}
            explanation={mockMCQs[currentMCQ].explanation}
            onAnswer={handleMCQAnswer}
          />

          {/* Progress */}
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${((currentMCQ + 1) / mockMCQs.length) * 100}%` }}
            />
          </div>

          {/* Placeholder chart area */}
          <div className="glass rounded-xl p-6 text-center">
            <h3 className="text-sm font-semibold mb-2">Analytics</h3>
            <p className="text-xs text-muted-foreground">Detailed quiz performance charts will appear here after completing more quizzes.</p>
            <div className="mt-4 h-32 rounded-lg bg-muted/50 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">📊 Performance chart placeholder</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
