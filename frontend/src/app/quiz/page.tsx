"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, RotateCcw, Timer, ChevronRight, Loader2 } from "lucide-react";
import { Flashcard } from "@/components/shared/Flashcard";
import { MCQCard } from "@/components/shared/MCQCard";
import { cn } from "@/lib/utils";
import { listAudios, getAudioDetail } from "@/lib/api";
import type { AudioSummary, QuizPayload } from "@/types";

type Mode = "flashcards" | "mcq";

export default function QuizPage() {
  const [mode, setMode] = useState<Mode>("flashcards");
  
  // Data States
  const [audios, setAudios] = useState<AudioSummary[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState<string>("");
  const [quizData, setQuizData] = useState<QuizPayload | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quiz interactive states
  const [currentCard, setCurrentCard] = useState(0);
  const [currentMCQ, setCurrentMCQ] = useState(0);
  const [streak, setStreak] = useState(3);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [timeLeft, setTimeLeft] = useState(120);

  // Load available audios on mount
  useEffect(() => {
    async function loadAudios() {
      try {
        const audioList = await listAudios();
        setAudios(audioList);
        if (audioList.length > 0) {
          setSelectedAudioId(audioList[0].audioId);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load lectures");
      } finally {
        setLoadingList(false);
      }
    }
    loadAudios();
  }, []);

  // Load quiz data when an audio is selected
  useEffect(() => {
    if (!selectedAudioId) return;

    async function fetchQuiz() {
      setLoadingQuiz(true);
      setError(null);
      setQuizData(null);
      try {
        const detail = await getAudioDetail(selectedAudioId);
        if (detail.quiz) {
          setQuizData(detail.quiz);
        } else {
          setQuizData({ flashcards: [], mcqs: [] });
        }
        setCurrentCard(0);
        setCurrentMCQ(0);
        setStreak(0);
        setScore({ correct: 0, total: 0 });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load quiz metadata");
      } finally {
        setLoadingQuiz(false);
      }
    }

    fetchQuiz();
  }, [selectedAudioId]);

  const flashcards = quizData?.flashcards || [];
  const mcqs = quizData?.mcqs || [];

  const nextCard = () => {
    if (currentCard < flashcards.length - 1) setCurrentCard((p) => p + 1);
    else setCurrentCard(0);
  };

  const handleMCQAnswer = (correct: boolean) => {
    setScore((p) => ({ correct: p.correct + (correct ? 1 : 0), total: p.total + 1 }));
    setTimeout(() => {
      if (currentMCQ < mcqs.length - 1) setCurrentMCQ((p) => p + 1);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quiz</h1>
          <p className="text-sm text-muted-foreground mt-1">Test your knowledge with AI-generated questions</p>
        </div>

        {/* Audio Selector */}
        {!loadingList && audios.length > 0 && (
          <select
            value={selectedAudioId}
            onChange={(e) => setSelectedAudioId(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {audios.map((a) => (
              <option key={a.audioId} value={a.audioId}>
                {a.title || "Untitled Audio"}
              </option>
            ))}
          </select>
        )}
      </div>

      {loadingList ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : audios.length === 0 ? (
        <div className="text-center p-12 bg-muted/20 rounded-xl border border-border">
          <p className="text-muted-foreground">No lectures available. Upload an audio to generate a quiz.</p>
        </div>
      ) : (
        <>
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

          {error && <div className="text-red-500 text-sm bg-red-500/10 p-4 rounded-md">{error}</div>}

          {loadingQuiz ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : mode === "flashcards" ? (
            <div className="space-y-6">
              {/* Flashcard Stats */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">
                    {audios.find((a) => a.audioId === selectedAudioId)?.title || "Notes"}
                  </span>
                  <span className="ml-1.5 text-xs text-muted-foreground">({flashcards.length} cards)</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">{streak}</span>
                    <span className="text-xs text-muted-foreground">streak</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {flashcards.length > 0 ? currentCard + 1 : 0} / {flashcards.length}
                  </span>
                </div>
              </div>

              {/* Card */}
              {flashcards.length > 0 ? (
                <>
                  <Flashcard
                    key={flashcards[currentCard].id || currentCard.toString()}
                    front={flashcards[currentCard].front}
                    back={flashcards[currentCard].back}
                    onEasy={() => { setStreak((p) => p + 1); nextCard(); }}
                    onHard={() => { setStreak(0); nextCard(); }}
                  />

                  {/* Progress dots */}
                  <div className="flex items-center justify-center gap-2 flex-wrap max-w-sm mx-auto">
                    {flashcards.map((_, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "h-2 w-2 rounded-full transition-colors",
                          idx === currentCard ? "bg-primary" : idx < currentCard ? "bg-primary/40" : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center bg-muted/20 border border-border rounded-xl">
                  <p className="text-sm text-muted-foreground">No flashcards available for this lecture yet.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* MCQ Header */}
              <div className="flex items-center justify-between flex-wrap gap-4">
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
                  Question {mcqs.length > 0 ? currentMCQ + 1 : 0} of {mcqs.length}
                </span>
              </div>

              {/* MCQ Card */}
              {mcqs.length > 0 ? (
                <>
                  <MCQCard
                    key={mcqs[currentMCQ].id || currentMCQ.toString()}
                    question={mcqs[currentMCQ].question}
                    options={mcqs[currentMCQ].options}
                    correctIndex={mcqs[currentMCQ].correctIndex}
                    explanation={mcqs[currentMCQ].explanation}
                    onAnswer={handleMCQAnswer}
                  />

                  {/* Progress */}
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      animate={{ width: `${((currentMCQ + 1) / mcqs.length) * 100}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="p-8 text-center bg-muted/20 border border-border rounded-xl">
                  <p className="text-sm text-muted-foreground">No MCQs available for this lecture yet.</p>
                </div>
              )}

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
        </>
      )}
    </div>
  );
}
