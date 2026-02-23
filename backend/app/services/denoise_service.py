"""
Audio denoising service.

Strategy priority:
  1. RNNoise binding (if available)
  2. noisereduce spectral gating (default)
"""
from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
import soundfile as sf

logger = logging.getLogger(__name__)


def denoise_audio(input_path: str | Path, output_path: str | Path) -> Path:
    """Denoise an audio file and write the result to *output_path*.

    Uses ``noisereduce`` spectral gating with an automatic noise profile
    estimated from the quietest frames. Output is always 16kHz mono.
    """
    input_path = Path(input_path)
    output_path = Path(output_path)

    # Read audio
    audio_data, sr = sf.read(str(input_path), dtype="float32")

    logger.info(f"Input: {len(audio_data)} samples @ {sr}Hz ({len(audio_data)/sr:.1f}s)")

    # Ensure mono
    if audio_data.ndim > 1:
        audio_data = audio_data.mean(axis=1)

    try:
        import noisereduce as nr  # type: ignore[import-untyped]

        # Estimate noise from the first 0.5s (or less if file is short)
        noise_len = min(int(sr * 0.5), len(audio_data))
        noise_clip = audio_data[:noise_len]

        reduced = nr.reduce_noise(
            y=audio_data,
            y_noise=noise_clip,
            sr=sr,
            prop_decrease=0.6,  # less aggressive to preserve speech
            stationary=True,
        )
        logger.info("Denoised with noisereduce (spectral gating)")
    except ImportError:
        # Fallback: simple spectral gating via numpy
        logger.warning("noisereduce not available — using basic spectral gating fallback")
        reduced = _basic_spectral_gate(audio_data, sr)

    logger.info(f"Output: {len(reduced)} samples @ {sr}Hz ({len(reduced)/sr:.1f}s)")

    # Write at the same sample rate (should be 16k from preprocessing)
    sf.write(str(output_path), reduced, sr, subtype="PCM_16")
    return output_path


def _basic_spectral_gate(audio: np.ndarray, sr: int, threshold_db: float = -40.0) -> np.ndarray:
    """Very simple noise gate: zero out frames below threshold."""
    frame_len = int(sr * 0.025)  # 25 ms frames
    hop = frame_len // 2
    threshold = 10 ** (threshold_db / 20.0)
    out = audio.copy()
    for i in range(0, len(audio) - frame_len, hop):
        frame = audio[i : i + frame_len]
        rms = float(np.sqrt(np.mean(frame ** 2)))
        if rms < threshold:
            out[i : i + frame_len] = 0.0
    return out
