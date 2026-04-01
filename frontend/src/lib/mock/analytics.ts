import { AnalyticsData, Activity, DashboardSummary, AIStatus } from "@/types";

export const mockDashboardStats: DashboardSummary = {
  processedToday: 12,
  pendingUploads: 3,
  notesUpdated: 8,
  quizGenerated: 24,
};

export const mockAIStatus: AIStatus = "idle";

export const mockActivities: Activity[] = [
  { id: "act-001", type: "transcribe", title: "Transcription Complete", description: "Introduction to Neural Networks has been transcribed with 94% confidence.", timestamp: "2026-02-21T10:30:00Z" },
  { id: "act-002", type: "note", title: "Notes Generated", description: "AI notes created for Linear Algebra Essentials — 5 topics extracted.", timestamp: "2026-02-21T09:45:00Z" },
  { id: "act-003", type: "quiz", title: "Flashcards Ready", description: "24 new flashcards generated from Deep Learning Fundamentals.", timestamp: "2026-02-21T09:00:00Z" },
  { id: "act-004", type: "upload", title: "File Uploaded", description: "Transformer Architecture Deep Dive (52.8 MB) uploaded and queued.", timestamp: "2026-02-21T08:00:00Z" },
  { id: "act-005", type: "document", title: "Document Parsed", description: "CNN Architecture Comparison (PDF, 24 pages) extraction complete.", timestamp: "2026-02-20T18:30:00Z" },
  { id: "act-006", type: "transcribe", title: "Processing Started", description: "Reinforcement Learning Basics is being transcribed.", timestamp: "2026-02-20T16:00:00Z" },
];

export const mockAnalytics: AnalyticsData = {
  uploadTrend: [
    { date: "2026-02-15", count: 3 },
    { date: "2026-02-16", count: 5 },
    { date: "2026-02-17", count: 2 },
    { date: "2026-02-18", count: 7 },
    { date: "2026-02-19", count: 4 },
    { date: "2026-02-20", count: 6 },
    { date: "2026-02-21", count: 8 },
  ],
  processingTimes: [
    { date: "2026-02-15", avgMs: 45000 },
    { date: "2026-02-16", avgMs: 38000 },
    { date: "2026-02-17", avgMs: 52000 },
    { date: "2026-02-18", avgMs: 41000 },
    { date: "2026-02-19", avgMs: 39000 },
    { date: "2026-02-20", avgMs: 43000 },
    { date: "2026-02-21", avgMs: 36000 },
  ],
  confidenceAvg: 0.91,
  totalProcessed: 156,
  queueHealth: "healthy",
  totalStorageMb: 2340,
};
