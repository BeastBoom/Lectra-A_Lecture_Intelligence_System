"""
Whisper speech-to-text adapter — uses openai-whisper locally.
"""
from __future__ import annotations

import logging
from pathlib import Path

from app.configs import WHISPER_MODEL

logger = logging.getLogger(__name__)

_model = None


def _get_model():
    """Lazy-load the Whisper model."""
    global _model
    if _model is None:
        import whisper
        logger.info(f"Loading Whisper model '{WHISPER_MODEL}'...")
        _model = whisper.load_model(WHISPER_MODEL)
        logger.info("Whisper model loaded.")
    return _model


def transcribe(audio_path: str | Path) -> str:
    """Transcribe an audio file and return the full text."""
    model = _get_model()
    result = model.transcribe(str(audio_path))
    return result["text"].strip()
