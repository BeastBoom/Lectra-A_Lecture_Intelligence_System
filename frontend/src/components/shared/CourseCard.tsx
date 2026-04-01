"use client";

import { motion } from "framer-motion";
import { GraduationCap, FileText, AudioLines } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface CourseCardProps {
  id: string;
  title: string;
  instructor: string;
  unitsCount: number;
  documentsCount: number;
  audioCount: number;
  color: string;
}

export function CourseCard({ id, title, instructor, unitsCount, documentsCount, audioCount, color }: CourseCardProps) {
  return (
    <Link href={`/courses/${id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className="glow-card glass rounded-xl p-5 cursor-pointer h-full"
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="rounded-lg p-2.5 shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <GraduationCap className="h-5 w-5" style={{ color }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{title}</h3>
            <p className="text-xs text-muted-foreground">{instructor}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>{unitsCount} units</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            <span>{documentsCount} docs</span>
          </div>
          <div className="flex items-center gap-1">
            <AudioLines className="h-3.5 w-3.5" />
            <span>{audioCount} audio</span>
          </div>
        </div>

        <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, (audioCount / Math.max(unitsCount, 1)) * 100)}%`, backgroundColor: color }}
          />
        </div>
      </motion.div>
    </Link>
  );
}
