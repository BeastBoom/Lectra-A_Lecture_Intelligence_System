import { Document as DocType } from "@/types";

export const mockDocuments: DocType[] = [
  { id: "doc-001", title: "Neural Networks Lecture Slides", type: "pptx", courseId: "course-001", pages: 42, extractionStatus: "ready", uploadedAt: "2026-02-18T10:00:00Z", fileSize: "12.5 MB" },
  { id: "doc-002", title: "Training Deep Networks - Paper", type: "pdf", courseId: "course-001", pages: 18, extractionStatus: "ready", uploadedAt: "2026-02-17T14:30:00Z", fileSize: "3.2 MB" },
  { id: "doc-003", title: "Linear Algebra Reference Guide", type: "pdf", courseId: "course-002", pages: 65, extractionStatus: "ready", uploadedAt: "2026-02-16T09:00:00Z", fileSize: "8.1 MB" },
  { id: "doc-004", title: "Probability Distributions Cheat Sheet", type: "docx", courseId: "course-002", pages: 8, extractionStatus: "ocr_needed", uploadedAt: "2026-02-15T11:00:00Z", fileSize: "1.4 MB" },
  { id: "doc-005", title: "CNN Architecture Comparison", type: "pdf", courseId: "course-001", pages: 24, extractionStatus: "parsing", uploadedAt: "2026-02-21T07:30:00Z", fileSize: "5.7 MB" },
  { id: "doc-006", title: "Attention Mechanism Explained", type: "pptx", courseId: "course-003", pages: 35, extractionStatus: "ready", uploadedAt: "2026-02-14T16:00:00Z", fileSize: "9.3 MB" },
];
