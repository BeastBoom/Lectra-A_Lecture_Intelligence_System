/**
 * Lectra API Client — single module wrapping all backend endpoints.
 *
 * Set NEXT_PUBLIC_API_URL in .env.local to point to the backend.
 * Default: http://localhost:8000
 */

import type {
  AudioSummary,
  AudioDetail,
  ArtifactSummary,
  TranscriptSegment,
  JobStatus,
  DashboardSummary,
  UploadResponse,
  Document,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Helpers ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(body.detail || body.error || `Server error ${res.status}`);
  }

  return res.json();
}

// ── Upload ──────────────────────────────────────────────────────────────────

export async function uploadAudio(
  file: File,
  userId?: string,
  courseId?: string,
  onProgress?: (pct: number) => void,
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (userId) formData.append("userId", userId);
  if (courseId) formData.append("courseId", courseId);

  // Use XMLHttpRequest for upload progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/api/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.detail || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}

// ── Jobs ────────────────────────────────────────────────────────────────────

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  return apiFetch(`/api/jobs/${jobId}/status`);
}

export async function reprocessJob(jobId: string): Promise<{ jobId: string; state: string; message: string }> {
  return apiFetch(`/api/jobs/${jobId}/reprocess`, { method: "POST" });
}

// ── Audios ──────────────────────────────────────────────────────────────────

export async function listAudios(): Promise<AudioSummary[]> {
  const data = await apiFetch<{ audios: AudioSummary[] }>("/api/audios");
  return data.audios;
}

export async function getAudio(audioId: string): Promise<AudioDetail> {
  return apiFetch(`/api/audios/${audioId}`);
}

export async function deleteAudio(audioId: string): Promise<{ message: string }> {
  return apiFetch(`/api/audios/${audioId}`, { method: "DELETE" });
}

// ── Artifacts ───────────────────────────────────────────────────────────────

export async function getArtifacts(audioId: string, type?: string): Promise<ArtifactSummary[]> {
  const query = type ? `?type=${encodeURIComponent(type)}` : "";
  const data = await apiFetch<{ artifacts: ArtifactSummary[] }>(`/api/audios/${audioId}/artifacts${query}`);
  return data.artifacts;
}

export function getArtifactDownloadUrl(artifactId: string): string {
  return `${API_BASE}/api/artifacts/${artifactId}/download`;
}

// ── Transcript ──────────────────────────────────────────────────────────────

export async function getTranscript(audioId: string): Promise<TranscriptSegment[]> {
  const data = await apiFetch<{
    segments: {
      id: string;
      start: number;
      end: number;
      speakerLabel: string | null;
      textRaw: string | null;
      textClean: string | null;
    }[];
  }>(`/api/audios/${audioId}/transcript`);

  // Map to the TranscriptSegment type with legacy compat fields
  return data.segments.map((seg) => ({
    id: seg.id,
    start: seg.start,
    end: seg.end,
    speakerLabel: seg.speakerLabel,
    textRaw: seg.textRaw,
    textClean: seg.textClean,
    // Legacy compat
    text: seg.textClean || seg.textRaw || "",
    speaker: seg.speakerLabel || undefined,
    confidence: 1.0, // Backend doesn't track per-segment confidence
  }));
}

// ── Documents ───────────────────────────────────────────────────────────────

export async function listDocuments(courseId?: string): Promise<Document[]> {
  const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
  const data = await apiFetch<{ documents: Document[] }>(`/api/documents${query}`);
  return data.documents;
}

export async function uploadDocument(formData: FormData): Promise<Document> {
  return apiFetch("/api/documents", {
    method: "POST",
    body: formData,
  });
}

// ── Dashboard ───────────────────────────────────────────────────────────────

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch("/api/dashboard/summary");
}
