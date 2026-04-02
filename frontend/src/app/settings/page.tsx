"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Sliders,
  Puzzle,
  Palette,
  Moon,
  Sun,
  Monitor,
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import {
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "@/lib/api";
import type { Subject } from "@/types";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "subjects", label: "Subjects", icon: BookOpen },
  { id: "processing", label: "Processing Preferences", icon: Sliders },
  { id: "integrations", label: "Integrations", icon: Puzzle },
  { id: "appearance", label: "Appearance", icon: Palette },
] as const;

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string>("profile");
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<{
    full_name?: string;
    email?: string;
  } | null>(null);

  // Subject management state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lectra_user");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  // Load subjects when switching to subjects section
  useEffect(() => {
    if (activeSection === "subjects") {
      loadSubjects();
    }
  }, [activeSection]);

  const loadSubjects = async () => {
    setSubjectsLoading(true);
    try {
      const subs = await listSubjects();
      setSubjects(subs);
    } catch {
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!newName.trim()) return;
    try {
      const sub = await createSubject(newName.trim(), newDesc.trim() || undefined);
      setSubjects((prev) => [...prev, sub]);
      setNewName("");
      setNewDesc("");
    } catch (err) {
      alert(
        "Failed to create subject: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  const handleUpdateSubject = async (id: string) => {
    if (!editName.trim()) return;
    try {
      const updated = await updateSubject(id, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
      });
      setSubjects((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setEditingId(null);
    } catch (err) {
      alert(
        "Failed to update subject: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (
      !confirm(
        `Deactivate "${name}"? Audio files will remain but no longer be grouped under this subject.`
      )
    )
      return;
    try {
      await deleteSubject(id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(
        "Failed to delete subject: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  const userName = user?.full_name || "User";
  const userEmail = user?.email || "";
  const initials =
    userName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-3">
          <div className="glass rounded-xl p-2 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors text-left",
                  activeSection === section.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                <section.icon className="h-4 w-4" />
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-9">
          <div className="glass rounded-xl p-6">
            {/* ── Profile ──────────────────────────────────────────────── */}
            {activeSection === "profile" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Profile</h2>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center">
                    <span className="text-xl font-bold text-primary-foreground">
                      {initials}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{userName}</p>
                    <p className="text-sm text-muted-foreground">{userEmail}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <input
                      type="text"
                      defaultValue={userName}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <input
                      type="email"
                      defaultValue={userEmail}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <button className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
                  Save Changes
                </button>
              </div>
            )}

            {/* ── Subjects ─────────────────────────────────────────────── */}
            {activeSection === "subjects" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">Subjects</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage subject categories for your lectures. Audio uploads
                    can be assigned to subjects manually or by AI.
                  </p>
                </div>

                {/* Create new subject */}
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <h3 className="text-sm font-medium">Create New Subject</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleCreateSubject()
                      }
                      placeholder="Subject name (e.g. Machine Learning)"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleCreateSubject()
                      }
                      placeholder="Description (optional)"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <button
                    onClick={handleCreateSubject}
                    disabled={!newName.trim()}
                    className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Create Subject
                  </button>
                </div>

                {/* Subject list */}
                {subjectsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  </div>
                ) : subjects.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      No subjects created yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {subjects.map((sub) => (
                      <motion.div
                        key={sub.id}
                        layout
                        className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors"
                      >
                        {editingId === sub.id ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                handleUpdateSubject(sub.id)
                              }
                              className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
                              autoFocus
                            />
                            <input
                              type="text"
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              placeholder="Description"
                              className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
                            />
                            <button
                              onClick={() => handleUpdateSubject(sub.id)}
                              className="text-green-500 hover:text-green-400"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <BookOpen className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {sub.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {sub.description && (
                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                      {sub.description}
                                    </p>
                                  )}
                                  {sub.sessionCount !== undefined && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                      {sub.sessionCount} session
                                      {sub.sessionCount !== 1 ? "s" : ""}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingId(sub.id);
                                  setEditName(sub.name);
                                  setEditDesc(sub.description || "");
                                }}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                title="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteSubject(sub.id, sub.name)
                                }
                                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Processing Preferences ───────────────────────────────── */}
            {activeSection === "processing" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">
                  Processing Preferences
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      Default Processing Mode
                    </label>
                    <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
                      <option>Accurate</option>
                      <option>Fast</option>
                      <option>Enhanced Cleanup</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Default Language
                    </label>
                    <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>Auto-detect</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Auto-generate notes</p>
                      <p className="text-xs text-muted-foreground">
                        Automatically create notes after transcription
                      </p>
                    </div>
                    <div className="h-6 w-11 rounded-full bg-primary relative cursor-pointer">
                      <div className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-white shadow" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Auto-generate flashcards
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Create flashcards from key concepts
                      </p>
                    </div>
                    <div className="h-6 w-11 rounded-full bg-muted relative cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Integrations ─────────────────────────────────────────── */}
            {activeSection === "integrations" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Integrations</h2>
                <div className="space-y-3">
                  {[
                    {
                      name: "Google Drive",
                      status: "Connected",
                      connected: true,
                    },
                    {
                      name: "Notion",
                      status: "Not connected",
                      connected: false,
                    },
                    {
                      name: "Canvas LMS",
                      status: "Not connected",
                      connected: false,
                    },
                    { name: "Zoom", status: "Connected", connected: true },
                  ].map((integration) => (
                    <div
                      key={integration.name}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {integration.name}
                        </p>
                        <p
                          className={cn(
                            "text-xs",
                            integration.connected
                              ? "text-green-500"
                              : "text-muted-foreground"
                          )}
                        >
                          {integration.status}
                        </p>
                      </div>
                      <button
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                          integration.connected
                            ? "border border-border hover:bg-muted"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                      >
                        {integration.connected ? "Disconnect" : "Connect"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Appearance ───────────────────────────────────────────── */}
            {activeSection === "appearance" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Appearance</h2>
                <div>
                  <p className="text-sm font-medium mb-3">Theme</p>
                  <div className="flex gap-3">
                    {[
                      { value: "light", label: "Light", icon: Sun },
                      { value: "dark", label: "Dark", icon: Moon },
                      { value: "system", label: "System", icon: Monitor },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setTheme(opt.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all flex-1",
                          theme === opt.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        <opt.icon className="h-5 w-5" />
                        <span className="text-xs font-medium">
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-3">Accent Color</p>
                  <div className="flex gap-2">
                    {[
                      "#22c55e",
                      "#3b82f6",
                      "#a855f7",
                      "#f59e0b",
                      "#ef4444",
                      "#06b6d4",
                    ].map((color) => (
                      <button
                        key={color}
                        className="h-8 w-8 rounded-full border-2 border-transparent hover:border-foreground/20 transition-colors"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
