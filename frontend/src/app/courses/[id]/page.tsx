"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GripVertical, AudioLines, FileText, ArrowLeft } from "lucide-react";
import { mockCourses } from "@/lib/mock/courses";
import { mockUnits } from "@/lib/mock/courses";
import { mockAudioFiles } from "@/lib/mock/audio";
import { mockDocuments } from "@/lib/mock/documents";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function CourseDetailPage() {
  const course = mockCourses[0];
  const units = mockUnits.filter((u) => u.courseId === course.id);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/courses" className="rounded-lg p-2 hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
          <p className="text-sm text-muted-foreground">{course.instructor} • {course.unitsCount} units</p>
        </div>
      </div>

      <div className="space-y-4">
        {units.map((unit, idx) => {
          const unitAudios = mockAudioFiles.filter((a) => unit.audioIds.includes(a.id));
          const unitDocs = mockDocuments.filter((d) => unit.documentIds.includes(d.id));

          return (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                  {unit.order}
                </div>
                <h3 className="text-sm font-semibold">{unit.title}</h3>
              </div>

              <div className="space-y-2 ml-10">
                {unitAudios.map((audio) => (
                  <Link key={audio.id} href={`/audio/${audio.id}`}>
                    <div className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors cursor-pointer">
                      <AudioLines className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{audio.title}</p>
                        <p className="text-xs text-muted-foreground">{audio.fileSize}</p>
                      </div>
                    </div>
                  </Link>
                ))}
                {unitDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors cursor-pointer">
                    <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">{doc.pages} pages • {doc.fileSize}</p>
                    </div>
                  </div>
                ))}
                {unitAudios.length === 0 && unitDocs.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No files attached yet</p>
                )}
              </div>

              <div className="ml-10 mt-3">
                <button className="text-xs text-primary hover:underline">+ Attach file</button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <button className="w-full rounded-xl border-2 border-dashed border-border p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
        + Add Unit
      </button>
    </div>
  );
}
