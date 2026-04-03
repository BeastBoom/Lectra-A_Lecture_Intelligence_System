"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, BarChart3, Clock, HardDrive, Gauge, Loader2 } from "lucide-react";
import { getAnalytics } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AnalyticsData } from "@/types";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const analyticsData = await getAnalytics();
        setData(analyticsData);
      } catch (err) {
        console.error("Analytics load error:", err);
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const queueColors = {
    healthy: "text-green-500 bg-green-500/10",
    busy: "text-yellow-500 bg-yellow-500/10",
    overloaded: "text-red-500 bg-red-500/10",
  };

  // Lazy-load recharts to avoid SSR issues
  const [ChartsLoaded, setChartsLoaded] = useState(false);
  const [Recharts, setRecharts] = useState<typeof import("recharts") | null>(null);

  useEffect(() => {
    import("recharts").then((mod) => {
      setRecharts(mod);
      setChartsLoaded(true);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform performance and usage statistics</p>
        </div>
        <div className="text-center py-16 glass rounded-xl">
          <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">{error || "No analytics data available. Upload audio to start generating data."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform performance and usage statistics</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Processed</span>
          </div>
          <p className="text-2xl font-bold">{data.totalProcessed}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Avg Processing</span>
          </div>
          <p className="text-2xl font-bold">
            {data.avgProcessingSeconds ? `${Math.round(data.avgProcessingSeconds)}s` : "—"}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Storage Used</span>
          </div>
          <p className="text-2xl font-bold">{(data.totalStorageMb / 1000).toFixed(1)} <span className="text-sm text-muted-foreground">GB</span></p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Queue Health</span>
          </div>
          <span className={cn("text-sm font-medium px-2.5 py-0.5 rounded-full capitalize", queueColors[data.queueHealth])}>
            {data.queueHealth}
          </span>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Upload Trend (7 days)</h3>
          <div className="h-64">
            {ChartsLoaded && Recharts ? (
              <Recharts.ResponsiveContainer width="100%" height="100%">
                <Recharts.BarChart data={data.uploadTrend}>
                  <Recharts.CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <Recharts.XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v: any) => String(v).slice(5)} />
                  <Recharts.YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <Recharts.Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Recharts.Bar dataKey="count" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                </Recharts.BarChart>
              </Recharts.ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading charts…</div>
            )}
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Processing Time (7 days)</h3>
          <div className="h-64">
            {ChartsLoaded && Recharts ? (
              <Recharts.ResponsiveContainer width="100%" height="100%">
                <Recharts.LineChart data={data.processingTimes}>
                  <Recharts.CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <Recharts.XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v: any) => String(v).slice(5)} />
                  <Recharts.YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v: any) => `${(Number(v) / 1000).toFixed(0)}s`} />
                  <Recharts.Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: any) => [`${(Number(value) / 1000).toFixed(1)}s`, "Avg Time"]}
                  />
                  <Recharts.Line type="monotone" dataKey="avgMs" stroke="hsl(142 76% 36%)" strokeWidth={2} dot={{ fill: "hsl(142 76% 36%)", r: 4 }} />
                </Recharts.LineChart>
              </Recharts.ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading charts…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
