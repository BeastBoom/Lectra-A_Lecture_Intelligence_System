"use client";

import { useState, useEffect } from "react";
import { User, Sliders, Puzzle, Palette, Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "processing", label: "Processing Preferences", icon: Sliders },
  { id: "integrations", label: "Integrations", icon: Puzzle },
  { id: "appearance", label: "Appearance", icon: Palette },
] as const;

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string>("profile");
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<{ full_name?: string; email?: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lectra_user");
      if (raw) setUser(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const userName = user?.full_name || "User";
  const userEmail = user?.email || "";
  const initials = userName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
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
                  activeSection === section.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
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
            {activeSection === "profile" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Profile</h2>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center">
                    <span className="text-xl font-bold text-primary-foreground">{initials}</span>
                  </div>
                  <div>
                    <p className="font-medium">{userName}</p>
                    <p className="text-sm text-muted-foreground">{userEmail}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <input type="text" defaultValue={userName} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <input type="email" defaultValue={userEmail} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Institution</label>
                    <input type="text" defaultValue="Stanford University" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
                      <option>Student</option>
                      <option>Instructor</option>
                      <option>Researcher</option>
                    </select>
                  </div>
                </div>
                <button className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
                  Save Changes
                </button>
              </div>
            )}

            {activeSection === "processing" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Processing Preferences</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Default Processing Mode</label>
                    <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
                      <option>Accurate</option>
                      <option>Fast</option>
                      <option>Enhanced Cleanup</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Default Language</label>
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
                      <p className="text-xs text-muted-foreground">Automatically create notes after transcription</p>
                    </div>
                    <div className="h-6 w-11 rounded-full bg-primary relative cursor-pointer">
                      <div className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-white shadow" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Auto-generate flashcards</p>
                      <p className="text-xs text-muted-foreground">Create flashcards from key concepts</p>
                    </div>
                    <div className="h-6 w-11 rounded-full bg-muted relative cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "integrations" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Integrations</h2>
                <div className="space-y-3">
                  {[
                    { name: "Google Drive", status: "Connected", connected: true },
                    { name: "Notion", status: "Not connected", connected: false },
                    { name: "Canvas LMS", status: "Not connected", connected: false },
                    { name: "Zoom", status: "Connected", connected: true },
                  ].map((integration) => (
                    <div key={integration.name} className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <p className="text-sm font-medium">{integration.name}</p>
                        <p className={cn("text-xs", integration.connected ? "text-green-500" : "text-muted-foreground")}>
                          {integration.status}
                        </p>
                      </div>
                      <button className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                        integration.connected
                          ? "border border-border hover:bg-muted"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}>
                        {integration.connected ? "Disconnect" : "Connect"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                          theme === opt.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                        )}
                      >
                        <opt.icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-3">Accent Color</p>
                  <div className="flex gap-2">
                    {["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#06b6d4"].map((color) => (
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
