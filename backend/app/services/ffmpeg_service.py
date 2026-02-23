"""
FFmpeg wrapper service.

All ffmpeg operations read from / write to files inside backend/tmp/.
"""
from __future__ import annotations

import json
import subprocess
from pathlib import Path

from app.configs import FFMPEG_BIN


def probe_duration(file_path: str | Path) -> float:
    """Return duration in seconds using ffprobe. Tries multiple fallbacks."""
    file_path = str(file_path)

    # Method 1: format-level duration (fastest)
    cmd = [
        FFMPEG_BIN.replace("ffmpeg", "ffprobe") if "ffmpeg" in FFMPEG_BIN else "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-show_entries", "stream=duration",
        "-of", "json",
        file_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    info = json.loads(result.stdout)

    # Try format.duration first
    fmt_dur = info.get("format", {}).get("duration")
    if fmt_dur and fmt_dur != "N/A":
        return float(fmt_dur)

    # Try first stream duration
    streams = info.get("streams", [])
    for s in streams:
        s_dur = s.get("duration")
        if s_dur and s_dur != "N/A":
            return float(s_dur)

    # Method 2: full decode probe (slower but works for headerless files)
    cmd2 = [
        FFMPEG_BIN.replace("ffmpeg", "ffprobe") if "ffmpeg" in FFMPEG_BIN else "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "json",
        "-analyzeduration", "100000000",
        "-probesize", "100000000",
        file_path,
    ]
    result2 = subprocess.run(cmd2, capture_output=True, text=True, check=True)
    info2 = json.loads(result2.stdout)
    fmt_dur2 = info2.get("format", {}).get("duration")
    if fmt_dur2 and fmt_dur2 != "N/A":
        return float(fmt_dur2)

    # Method 3: use ffmpeg to null-decode and read total time
    cmd3 = [
        FFMPEG_BIN,
        "-i", file_path,
        "-f", "null", "-",
    ]
    result3 = subprocess.run(cmd3, capture_output=True, text=True)
    # Parse "time=HH:MM:SS.ss" from stderr
    import re
    time_match = re.findall(r"time=(\d+):(\d+):(\d+\.\d+)", result3.stderr)
    if time_match:
        h, m, s = time_match[-1]
        return int(h) * 3600 + int(m) * 60 + float(s)

    # If all methods fail, return 0 to avoid crash
    return 0.0


def convert_to_mono_16k(input_path: str | Path, output_path: str | Path) -> Path:
    """Convert audio to mono 16 kHz WAV with loudnorm normalization.

    Does NOT trim silence — lecture audio often has natural pauses
    that silenceremove would aggressively strip.
    """
    out = Path(output_path)
    cmd = [
        FFMPEG_BIN, "-y",
        "-i", str(input_path),
        "-af", "loudnorm",
        "-ac", "1",
        "-ar", "16000",
        "-sample_fmt", "s16",
        str(out),
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    return out


def extract_segment(
    input_path: str | Path,
    output_path: str | Path,
    start: float,
    end: float,
    padding: float = 0.0,
) -> Path:
    """Extract a time range [start-padding, end+padding] from an audio file."""
    out = Path(output_path)
    actual_start = max(0.0, start - padding)
    duration = (end + padding) - actual_start
    cmd = [
        FFMPEG_BIN, "-y",
        "-ss", str(actual_start),
        "-t", str(duration),
        "-i", str(input_path),
        "-ac", "1", "-ar", "16000",
        str(out),
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    return out


def concatenate_segments(
    input_paths: list[Path],
    output_path: str | Path,
    gap_seconds: float = 0.5,
) -> Path:
    """Concatenate multiple audio files with a silence gap between them."""
    out = Path(output_path)
    if not input_paths:
        raise ValueError("No input files to concatenate")

    if len(input_paths) == 1:
        # Just copy
        import shutil
        shutil.copy2(str(input_paths[0]), str(out))
        return out

    # Build a complex filter with silence gaps
    filter_parts: list[str] = []
    inputs_args: list[str] = []

    for i, fp in enumerate(input_paths):
        inputs_args.extend(["-i", str(fp)])
        filter_parts.append(f"[{i}:a]")

    # concat filter
    filter_str = "".join(filter_parts) + f"concat=n={len(input_paths)}:v=0:a=1[outa]"

    cmd = [FFMPEG_BIN, "-y"] + inputs_args + [
        "-filter_complex", filter_str,
        "-map", "[outa]",
        "-ac", "1", "-ar", "16000",
        str(out),
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    return out


def chunk_audio(
    input_path: str | Path,
    output_dir: str | Path,
    max_duration: float = 180.0,
    overlap: float = 0.5,
) -> list[Path]:
    """Split audio into chunks of max_duration with overlap. Returns list of chunk paths."""
    total = probe_duration(input_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # If duration is 0 or very small, just copy the file as a single chunk
    if total <= 0.1:
        import shutil
        chunk_path = output_dir / "chunk_0000.wav"
        shutil.copy2(str(input_path), str(chunk_path))
        return [chunk_path]

    chunks: list[Path] = []
    start = 0.0
    idx = 0

    while start < total:
        end = min(start + max_duration, total)
        chunk_path = output_dir / f"chunk_{idx:04d}.wav"
        cmd = [
            FFMPEG_BIN, "-y",
            "-ss", str(start),
            "-t", str(end - start),
            "-i", str(input_path),
            "-ac", "1", "-ar", "16000",
            str(chunk_path),
        ]
        subprocess.run(cmd, capture_output=True, check=True)
        chunks.append(chunk_path)
        idx += 1
        start = end - overlap if end < total else total

    return chunks
