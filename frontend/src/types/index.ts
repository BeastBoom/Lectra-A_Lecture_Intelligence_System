/* ── Lectra Type Definitions ── */

// ── Backend API response types ──────────────────────────────────────────────

export interface AudioSummary {
  audioId: string;
  title: string;
  durationSeconds: number | null;
  uploadedAt: string | null;
  status: "ready" | "processing" | "error";
  courseId: string | null;
  userId: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AudioDetail extends AudioSummary {
  jobId: string | null;
  summary: string | null;
  transcriptSnippet: string | null;
  artifacts: ArtifactSummary[];
}

export interface ArtifactSummary {
  id: string;
  artifactType: string;
  createdAt: string;
  originalStart?: number | null;
  extra?: Record<string, unknown> | null;
  downloadUrl?: string;
}

export interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  speakerLabel?: string | null;
  textRaw?: string | null;
  textClean?: string | null;
  // Legacy compat fields used by components
  text: string;
  speaker?: string;
  confidence: number;
}

export interface JobStatus {
  jobId: string;
  audioId: string;
  state: string;
  retryCount: number;
  lastError: string | null;
  progress: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  processedToday: number;
  pendingUploads: number;
  notesUpdated: number;
  quizGenerated: number;
}

export interface UploadResponse {
  jobId: string;
  audioId: string;
  statusUrl: string;
}

// ── Document types ──────────────────────────────────────────────────────────

export interface Document {
  id: string;
  title: string;
  type: "pdf" | "pptx" | "docx";
  courseId: string;
  pages: number;
  extractionStatus: "parsing" | "ready" | "ocr_needed";
  uploadedAt: string;
  fileSize: string;
}

// ── Legacy UI types (kept for compatibility) ────────────────────────────────

export interface AudioFile {
  id: string;
  title: string;
  course: string;
  duration: number;
  tags: string[];
  transcriptSnippet: string;
  confidence: number;
  status: "ready" | "processing" | "error";
  uploadedAt: string;
  fileSize: string;
}

export interface Topic {
  id: string;
  title: string;
  summary: string;
  audioId: string;
  keywords: string[];
}

export interface Note {
  id: string;
  courseId: string;
  unitId: string;
  topicId: string;
  title: string;
  content: string;
  sources: ("audio" | "document")[];
  updatedAt: string;
  isAiGenerated: boolean;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  deckId: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface FlashcardDeck {
  id: string;
  title: string;
  courseId: string;
  cardCount: number;
  cards: FlashcardItem[];
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topicId: string;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  unitsCount: number;
  documentsCount: number;
  audioCount: number;
  color: string;
  createdAt: string;
}

export interface CourseUnit {
  id: string;
  courseId: string;
  title: string;
  order: number;
  audioIds: string[];
  documentIds: string[];
}

export interface AnalyticsData {
  uploadTrend: { date: string; count: number }[];
  processingTimes: { date: string; avgMs: number }[];
  confidenceAvg: number;
  totalProcessed: number;
  queueHealth: "healthy" | "busy" | "overloaded";
  totalStorageMb: number;
}

export interface Activity {
  id: string;
  type: "upload" | "transcribe" | "note" | "quiz" | "document";
  title: string;
  description: string;
  timestamp: string;
}

export type AIStatus = "idle" | "transcribing" | "generating" | "error";

export interface UploadFile {
  id: string;
  name: string;
  size: number;
  duration?: number;
  progress: number;
  stage: "upload" | "preprocess" | "transcribe" | "generate" | "ready" | "error";
  jobId?: string;
  audioId?: string;
}
