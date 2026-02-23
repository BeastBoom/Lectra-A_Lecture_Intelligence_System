"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, File, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onFilesAdded?: (files: File[]) => void;
  accept?: string;
  className?: string;
}

export function UploadDropzone({ onFilesAdded, accept = "audio/*", className }: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      onFilesAdded?.(files);
    },
    [onFilesAdded]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      onFilesAdded?.(files);
    },
    [onFilesAdded]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        "relative rounded-xl border-2 border-dashed transition-all duration-300 p-12 text-center cursor-pointer",
        isDragOver
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border hover:border-primary/50 hover:bg-muted/30",
        className
      )}
    >
      <input
        type="file"
        accept={accept}
        multiple
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-label="Upload files"
      />

      <motion.div
        animate={isDragOver ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
        className="flex flex-col items-center gap-4"
      >
        <div className={cn(
          "rounded-full p-4 transition-colors",
          isDragOver ? "bg-primary/20" : "bg-muted"
        )}>
          <Upload className={cn(
            "h-8 w-8 transition-colors",
            isDragOver ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
        <div>
          <p className="text-base font-medium">
            {isDragOver ? "Drop files here" : "Drag & drop audio files"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse • MP3, WAV, M4A, FLAC
          </p>
        </div>
      </motion.div>
    </div>
  );
}
