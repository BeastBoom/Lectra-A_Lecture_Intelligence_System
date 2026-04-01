"use client";

import { FileText, FileSpreadsheet, Presentation } from "lucide-react";
import { cn } from "@/lib/utils";
import { Document } from "@/types";

const typeIcons = {
  pdf: FileText,
  docx: FileSpreadsheet,
  pptx: Presentation,
};

const statusColors = {
  parsing: "bg-yellow-500/10 text-yellow-500",
  ready: "bg-green-500/10 text-green-500",
  ocr_needed: "bg-orange-500/10 text-orange-500",
};

const statusLabels = {
  parsing: "Parsing",
  ready: "Ready",
  ocr_needed: "OCR Needed",
};

interface DocumentPreviewProps {
  document: Document;
  className?: string;
}

export function DocumentPreview({ document: doc, className }: DocumentPreviewProps) {
  const Icon = typeIcons[doc.type] || FileText;

  return (
    <div className={cn("glow-card glass rounded-xl p-4 cursor-pointer", className)}>
      {/* Thumbnail placeholder */}
      <div className="aspect-[4/3] rounded-lg bg-muted/50 flex items-center justify-center mb-3">
        <Icon className="h-10 w-10 text-muted-foreground/40" />
      </div>

      <h4 className="text-sm font-medium truncate mb-1">{doc.title}</h4>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{doc.pages} pages • {doc.fileSize}</span>
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", statusColors[doc.extractionStatus])}>
          {statusLabels[doc.extractionStatus]}
        </span>
      </div>
    </div>
  );
}
