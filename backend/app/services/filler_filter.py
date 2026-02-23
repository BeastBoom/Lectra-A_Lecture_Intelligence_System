"""
Filler-word removal service.

Removes English + Hinglish filler tokens from transcript text.
Configurable via FILLER_LIST in configs.py / .env.
"""
from __future__ import annotations

import re
from app.configs import FILLER_LIST


def remove_fillers(text: str, filler_list: list[str] | None = None) -> str:
    """Remove filler tokens from *text* (case-insensitive exact token match).

    Steps:
    1. Tokenise on word boundaries.
    2. Remove tokens (or multi-word fillers) that exactly match the list.
    3. Collapse consecutive duplicate tokens.
    4. Basic punctuation fix-up.
    """
    fillers = filler_list or FILLER_LIST

    cleaned = text

    # Sort multi-word fillers first (longest match first)
    sorted_fillers = sorted(fillers, key=len, reverse=True)

    for filler in sorted_fillers:
        # Build a regex that matches the filler as a whole word / phrase
        pattern = r'\b' + re.escape(filler) + r'\b'
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)

    # Collapse multiple spaces
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()

    # Collapse consecutive duplicate words
    cleaned = _collapse_consecutive_duplicates(cleaned)

    # Basic punctuation cleanup
    cleaned = _fix_punctuation(cleaned)

    return cleaned


def _collapse_consecutive_duplicates(text: str) -> str:
    """Remove consecutive duplicate words: 'the the dog' -> 'the dog'."""
    words = text.split()
    if not words:
        return text
    result = [words[0]]
    for w in words[1:]:
        if w.lower() != result[-1].lower():
            result.append(w)
    return ' '.join(result)


def _fix_punctuation(text: str) -> str:
    """Fix common punctuation artefacts after filler removal."""
    # Remove space before punctuation
    text = re.sub(r'\s+([.,;:!?])', r'\1', text)
    # Remove leading punctuation from sentence start
    text = re.sub(r'^[,;:]\s*', '', text)
    # Collapse multiple punctuation
    text = re.sub(r'([.,;:!?])\1+', r'\1', text)
    # Ensure space after punctuation
    text = re.sub(r'([.,;:!?])([A-Za-z])', r'\1 \2', text)
    return text.strip()
