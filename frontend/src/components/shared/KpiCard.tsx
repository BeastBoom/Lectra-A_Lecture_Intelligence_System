"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: string;
  suffix?: string;
}

export function KpiCard({ title, value, icon: Icon, trend, suffix }: KpiCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glow-card glass rounded-xl p-5 cursor-default"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            trend.startsWith("+") ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
          )}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold tracking-tight">
        {displayValue}
        {suffix && <span className="text-lg text-muted-foreground ml-1">{suffix}</span>}
      </p>
      <p className="text-sm text-muted-foreground mt-1">{title}</p>
    </motion.div>
  );
}
