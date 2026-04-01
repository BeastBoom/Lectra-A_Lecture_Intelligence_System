"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getJobStatus } from "@/lib/api";
import type { JobStatus } from "@/types";

interface UseJobPollerOptions {
  /** Initial interval in ms (default 3000) */
  initialInterval?: number;
  /** Max interval in ms (default 10000) */
  maxInterval?: number;
  /** Backoff multiplier (default 1.5) */
  backoffFactor?: number;
}

interface UseJobPollerReturn {
  jobStatus: JobStatus | null;
  isPolling: boolean;
  error: string | null;
  startPolling: (jobId: string) => void;
  stopPolling: () => void;
}

/**
 * Poll GET /api/jobs/{jobId}/status with exponential backoff.
 * Stops automatically when state = "completed" or "failed".
 */
export function useJobPoller(options?: UseJobPollerOptions): UseJobPollerReturn {
  const {
    initialInterval = 3000,
    maxInterval = 10000,
    backoffFactor = 1.5,
  } = options || {};

  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jobIdRef = useRef<string | null>(null);
  const intervalRef = useRef<number>(initialInterval);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    jobIdRef.current = null;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    const jid = jobIdRef.current;
    if (!jid) return;

    try {
      const status = await getJobStatus(jid);
      setJobStatus(status);
      setError(null);

      // Stop if terminal state
      if (status.state === "completed" || status.state === "failed") {
        stopPolling();
        return;
      }

      // Schedule next poll with backoff
      intervalRef.current = Math.min(
        intervalRef.current * backoffFactor,
        maxInterval,
      );
      timerRef.current = setTimeout(poll, intervalRef.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Polling failed");
      // Keep polling on transient errors
      timerRef.current = setTimeout(poll, intervalRef.current);
    }
  }, [backoffFactor, maxInterval, stopPolling]);

  const startPolling = useCallback(
    (jobId: string) => {
      stopPolling();
      jobIdRef.current = jobId;
      intervalRef.current = initialInterval;
      setIsPolling(true);
      setError(null);
      setJobStatus(null);
      // Start immediately
      poll();
    },
    [initialInterval, poll, stopPolling],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { jobStatus, isPolling, error, startPolling, stopPolling };
}
