"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, Search, MoreHorizontal, File, Loader2 } from "lucide-react";
import { UploadDropzone } from "@/components/shared/UploadDropzone";
import { listDocuments, uploadDocument } from "@/lib/api";
import type { Document } from "@/types";
import { cn, formatDate } from "@/lib/utils";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  const fetchDocs = async () => {
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const doc = await uploadDocument(formData);
        setDocuments((prev) => [doc, ...prev]);
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }
  };

  const filtered = documents.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const typeIcons: Record<string, string> = {
    pdf: "text-red-500",
    pptx: "text-orange-500",
    docx: "text-blue-500",
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Course materials and supporting documents
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Upload className="h-4 w-4" />
          Upload
        </button>
      </div>

      {showUpload && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <UploadDropzone
            onFilesAdded={handleUpload}
            accept=".pdf,.pptx,.docx"
          />
        </motion.div>
      )}

      {/* Search */}
      <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 bg-muted/50 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documents..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Document list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No documents yet. Upload course materials to get started!</p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left p-3">Document</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Pages</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Uploaded</th>
                <th className="p-3 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, idx) => (
                <motion.tr
                  key={doc.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <File className={cn("h-4 w-4", typeIcons[doc.type] || "text-muted-foreground")} />
                      <span className="font-medium">{doc.title}</span>
                    </div>
                  </td>
                  <td className="p-3 uppercase text-xs text-muted-foreground">{doc.type}</td>
                  <td className="p-3 text-muted-foreground">{doc.pages || "—"}</td>
                  <td className="p-3">
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium",
                      doc.extractionStatus === "ready" ? "bg-green-500/10 text-green-500" :
                      doc.extractionStatus === "parsing" ? "bg-blue-500/10 text-blue-500" :
                      "bg-yellow-500/10 text-yellow-500"
                    )}>
                      {doc.extractionStatus}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{formatDate(doc.uploadedAt)}</td>
                  <td className="p-3">
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
