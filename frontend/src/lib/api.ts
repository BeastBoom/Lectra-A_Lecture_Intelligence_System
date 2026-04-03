/**
 * Lectra API Client — single module wrapping all backend endpoints.
 *
 * Set NEXT_PUBLIC_API_URL in .env.local to point to the backend.
 * Default: http://localhost:8000
 */
import type { AudioSummary, DashboardSummary, Subject, SubjectNotesResponse } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:8000/api";

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("lectra_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Audio ───────────────────────────────────────────────────────────────────

export async function listAudios(): Promise<AudioSummary[]> {
  const data = await apiFetch<{ audios: AudioSummary[] }>("/audios");
  return data.audios;
}

export async function getAudioDetail(audioId: string): Promise<import("@/types").AudioDetail> {
  return apiFetch<import("@/types").AudioDetail>(`/audios/${audioId}`);
}

export async function deleteAudio(audioId: string): Promise<void> {
  await apiFetch(`/audios/${audioId}`, { method: "DELETE" });
}

export async function uploadAudio(
  file: File,
  userId?: string,
  courseId?: string,
  subjectId?: string,
  onProgress?: (pct: number) => void
): Promise<{ jobId: string; audioId: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId || "anonymous");
  formData.append("courseId", courseId || "default");
  formData.append("subjectId", subjectId || "");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/upload`);

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("lectra_token")
        : null;
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          jobId: data.jobId || data.job_id,
          audioId: data.audioId || data.audio_id,
        });
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}

// ── Jobs ────────────────────────────────────────────────────────────────────

export async function getJobStatus(
  jobId: string
): Promise<import("@/types").JobStatus> {
  return apiFetch(`/jobs/${jobId}/status`);
}

export async function getJobResults(
  jobId: string
): Promise<Record<string, unknown>> {
  return apiFetch(`/jobs/${jobId}/results`);
}

// ── Dashboard ───────────────────────────────────────────────────────────────

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch("/dashboard/summary");
}

// ── Transcript ──────────────────────────────────────────────────────────────

export async function getTranscript(
  audioId: string
): Promise<import("@/types").TranscriptSegment[]> {
  const data = await apiFetch<{ segments: import("@/types").TranscriptSegment[] }>(`/audios/${audioId}/transcript`);
  return data.segments ?? [];
}

// ── Audio Detail & Artifacts ────────────────────────────────────────────────

export async function getAudio(audioId: string): Promise<import("@/types").AudioDetail> {
  return apiFetch(`/audios/${audioId}`);
}

export async function getArtifacts(audioId: string): Promise<import("@/types").ArtifactSummary[]> {
  const data = await apiFetch<{ artifacts: import("@/types").ArtifactSummary[] }>(`/audios/${audioId}/artifacts`).catch(() => ({ artifacts: [] }));
  return data.artifacts ?? [];
}

export function getArtifactDownloadUrl(artifactId: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return `${base}/api/artifacts/${artifactId}/download`;
}

// ── Documents ───────────────────────────────────────────────────────────────

export async function listDocuments(): Promise<import("@/types").Document[]> {
  const data = await apiFetch<{ documents: import("@/types").Document[] }>("/documents");
  return data.documents ?? [];
}

export async function uploadDocument(formData: FormData): Promise<import("@/types").Document> {
  return apiFetch<import("@/types").Document>("/documents", {
    method: "POST",
    body: formData,
  });
}

// ── Subjects ────────────────────────────────────────────────────────────────

export async function listSubjects(userId?: string): Promise<Subject[]> {
  const params = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  const data = await apiFetch<{ subjects: Subject[] }>(`/subjects${params}`);
  return data.subjects;
}

export async function createSubject(
  name: string,
  description?: string,
  userId?: string
): Promise<Subject> {
  return apiFetch<Subject>("/subjects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      description: description || null,
      user_id: userId || null,
    }),
  });
}

export async function getSubject(subjectId: string): Promise<Subject> {
  return apiFetch<Subject>(`/subjects/${subjectId}`);
}

export async function updateSubject(
  subjectId: string,
  data: { name?: string; description?: string; is_active?: boolean }
): Promise<Subject> {
  return apiFetch<Subject>(`/subjects/${subjectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteSubject(subjectId: string): Promise<void> {
  await apiFetch(`/subjects/${subjectId}`, { method: "DELETE" });
}

export async function getSubjectNotes(
  subjectId: string
): Promise<SubjectNotesResponse> {
  return apiFetch<SubjectNotesResponse>(`/subjects/${subjectId}/notes`);
}

export async function getSubjectSessions(subjectId: string) {
  return apiFetch<{
    subjectId: string;
    sessions: {
      audioId: string;
      title: string;
      durationSeconds: number | null;
      uploadedAt: string | null;
      subjectSource: string;
    }[];
  }>(`/subjects/${subjectId}/sessions`);
}

export async function updateAudioSubject(
  audioId: string,
  subjectId: string | null
): Promise<{
  audioId: string;
  subjectId: string | null;
  subjectSource: string;
}> {
  const params = subjectId ? `?subject_id=${subjectId}` : "";
  return apiFetch(`/audios/${audioId}/subject${params}`, { method: "PATCH" });
}
