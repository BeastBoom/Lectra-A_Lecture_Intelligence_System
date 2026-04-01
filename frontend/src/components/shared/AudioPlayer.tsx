"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";

interface AudioPlayerProps {
  title: string;
  duration: number;
  src?: string;
  className?: string;
  /** Register a seek function that parent components can call */
  onSeekRef?: (seekFn: (time: number) => void) => void;
}

export function AudioPlayer({ title, duration, src, className, onSeekRef }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const effectiveDuration = audioDuration || duration;
  const progress = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

  // Expose seekTo via ref callback
  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      if (!isPlaying) {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      setCurrentTime(time);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (onSeekRef) onSeekRef(seekTo);
  }, [onSeekRef, seekTo]);

  // Sync with <audio> element events
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTimeUpdate = () => setCurrentTime(el.currentTime);
    const onDurationChange = () => { if (el.duration && isFinite(el.duration)) setAudioDuration(el.duration); };
    const onEnded = () => setIsPlaying(false);

    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("durationchange", onDurationChange);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("durationchange", onDurationChange);
      el.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const newTime = pct * effectiveDuration;
    seekTo(newTime);
  };

  const handleSkip = (delta: number) => {
    seekTo(Math.max(0, Math.min(currentTime + delta, effectiveDuration)));
  };

  const handleSpeedChange = () => {
    const idx = speeds.indexOf(playbackSpeed);
    const newSpeed = speeds[(idx + 1) % speeds.length];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) audioRef.current.playbackRate = newSpeed;
  };

  return (
    <div className={cn("glass rounded-xl p-5", className)}>
      {/* Hidden audio element for real playback */}
      {src && <audio ref={audioRef} src={src} preload="auto" />}

      <p className="text-sm font-medium mb-3 truncate">{title}</p>

      {/* Waveform / Progress */}
      <div
        className="relative h-12 rounded-lg bg-muted/50 cursor-pointer mb-4 overflow-hidden"
        onClick={handleProgressClick}
        role="slider"
        aria-label="Audio progress"
        aria-valuenow={currentTime}
        aria-valuemax={effectiveDuration}
        tabIndex={0}
      >
        {/* Waveform bars */}
        <div className="absolute inset-0 flex items-center gap-px px-2">
          {Array.from({ length: 60 }).map((_, i) => {
            const h = 20 + Math.sin(i * 0.7) * 15 + Math.cos(i * 1.3) * 10;
            return (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-full transition-colors duration-150",
                  (i / 60) * 100 <= progress ? "bg-primary" : "bg-muted-foreground/20"
                )}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono w-16">
          {formatDuration(Math.floor(currentTime))}
        </span>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSkip(-10)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Skip back 10s"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            onClick={handlePlayPause}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
          <button
            onClick={() => handleSkip(10)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Skip forward 10s"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 w-16 justify-end">
          <button
            onClick={handleSpeedChange}
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            {playbackSpeed}x
          </button>
          <Volume2 className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
