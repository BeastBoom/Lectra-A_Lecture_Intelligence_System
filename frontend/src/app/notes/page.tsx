"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, AudioLines, FileText, Sparkles, Check, X } from "lucide-react";
import { mockNotes } from "@/lib/mock/notes";
import { mockCourses } from "@/lib/mock/courses";
import { cn } from "@/lib/utils";

export default function NotesPage() {
  const [selectedCourse, setSelectedCourse] = useState(mockCourses[0].id);
  const [selectedNote, setSelectedNote] = useState(mockNotes[0]);
  const [showMergePreview, setShowMergePreview] = useState(false);

  const courseNotes = mockNotes.filter((n) => n.courseId === selectedCourse);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-generated and edited lecture notes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left — Course Tree */}
        <div className="lg:col-span-3">
          <div className="glass rounded-xl p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Courses</h3>
            <div className="space-y-1">
              {mockCourses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course.id)}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors",
                    selectedCourse === course.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: course.color }} />
                  <span className="truncate">{course.title}</span>
                  <ChevronRight className="h-3 w-3 ml-auto shrink-0" />
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Topics</h3>
              <div className="space-y-1">
                {courseNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={cn(
                      "w-full text-left rounded-lg px-3 py-2 text-sm transition-colors",
                      selectedNote?.id === note.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <p className="truncate">{note.title}</p>
                    <div className="flex gap-1 mt-1">
                      {note.sources.map((src) => (
                        <span key={src} className="text-[10px] px-1.5 py-0.5 rounded bg-muted">
                          {src === "audio" ? <AudioLines className="h-2.5 w-2.5 inline" /> : <FileText className="h-2.5 w-2.5 inline" />}
                        </span>
                      ))}
                      {note.isAiGenerated && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          <Sparkles className="h-2.5 w-2.5 inline" /> AI
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center — Note Editor */}
        <div className="lg:col-span-6">
          {selectedNote ? (
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{selectedNote.title}</h2>
                <button
                  onClick={() => setShowMergePreview(!showMergePreview)}
                  className="flex items-center gap-2 text-xs text-primary hover:underline"
                >
                  <Sparkles className="h-3 w-3" />
                  {showMergePreview ? "Hide" : "Show"} AI Updates
                </button>
              </div>

              {showMergePreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-primary">New AI-generated content</p>
                    <div className="flex gap-2">
                      <button className="flex items-center gap-1 text-xs text-green-500 hover:underline">
                        <Check className="h-3 w-3" /> Accept
                      </button>
                      <button className="flex items-center gap-1 text-xs text-red-500 hover:underline">
                        <X className="h-3 w-3" /> Reject
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-primary/80">
                    Added: The vanishing gradient problem occurs when training deep networks with sigmoid activation functions, as gradients become exponentially smaller in earlier layers.
                  </p>
                </motion.div>
              )}

              <div
                className="prose prose-sm dark:prose-invert max-w-none min-h-[400px] outline-none"
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{
                  __html: selectedNote.content
                    .replace(/## /g, "<h2>")
                    .replace(/### /g, "<h3>")
                    .replace(/\n- /g, "<br>• ")
                    .replace(/\n/g, "<br>")
                    .replace(/`([^`]+)`/g, "<code>$1</code>"),
                }}
              />
            </div>
          ) : (
            <div className="glass rounded-xl p-6 text-center text-muted-foreground">
              Select a note to view
            </div>
          )}
        </div>

        {/* Right — Timeline */}
        <div className="lg:col-span-3">
          <div className="glass rounded-xl p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Update Timeline</h3>
            <div className="space-y-3">
              {[
                { time: "2 hours ago", action: "AI notes updated", type: "ai" },
                { time: "Yesterday", action: "Manual edit by you", type: "user" },
                { time: "Feb 19", action: "Initial AI generation", type: "ai" },
                { time: "Feb 18", action: "Audio transcribed", type: "system" },
              ].map((event, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "h-2 w-2 rounded-full shrink-0 mt-1.5",
                      event.type === "ai" ? "bg-primary" : event.type === "user" ? "bg-blue-500" : "bg-muted-foreground"
                    )} />
                    {idx < 3 && <div className="w-px h-full bg-border flex-1" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm">{event.action}</p>
                    <p className="text-xs text-muted-foreground">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
