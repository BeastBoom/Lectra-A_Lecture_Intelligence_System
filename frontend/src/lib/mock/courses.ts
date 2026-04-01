import { Course, CourseUnit } from "@/types";

export const mockCourses: Course[] = [
  { id: "course-001", title: "Deep Learning Fundamentals", instructor: "Prof. Sarah Chen", unitsCount: 4, documentsCount: 8, audioCount: 3, color: "#22c55e", createdAt: "2026-01-15T00:00:00Z" },
  { id: "course-002", title: "Mathematics for AI", instructor: "Dr. James Park", unitsCount: 3, documentsCount: 5, audioCount: 2, color: "#3b82f6", createdAt: "2026-01-20T00:00:00Z" },
  { id: "course-003", title: "Applied AI", instructor: "Prof. Maria Rodriguez", unitsCount: 5, documentsCount: 12, audioCount: 1, color: "#a855f7", createdAt: "2026-02-01T00:00:00Z" },
  { id: "course-004", title: "Natural Language Processing", instructor: "Dr. Alex Kim", unitsCount: 6, documentsCount: 10, audioCount: 0, color: "#f59e0b", createdAt: "2026-02-10T00:00:00Z" },
];

export const mockUnits: CourseUnit[] = [
  { id: "unit-001", courseId: "course-001", title: "Neural Network Foundations", order: 1, audioIds: ["aud-001"], documentIds: ["doc-001"] },
  { id: "unit-002", courseId: "course-001", title: "Training Techniques", order: 2, audioIds: ["aud-003"], documentIds: ["doc-002"] },
  { id: "unit-003", courseId: "course-002", title: "Linear Algebra Essentials", order: 1, audioIds: ["aud-002"], documentIds: ["doc-003"] },
  { id: "unit-004", courseId: "course-002", title: "Probability Theory", order: 2, audioIds: ["aud-004"], documentIds: ["doc-004"] },
  { id: "unit-005", courseId: "course-001", title: "Convolutional Networks", order: 3, audioIds: [], documentIds: ["doc-005"] },
  { id: "unit-006", courseId: "course-001", title: "Transformer Architecture", order: 4, audioIds: ["aud-005"], documentIds: [] },
];
