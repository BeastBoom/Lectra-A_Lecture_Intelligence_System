"""
Gemini AI adapter — single API call for lecture summarization.
Uses the google-genai package.
"""
from __future__ import annotations

import logging
import time

from google import genai

from app.configs import GEMINI_API_KEY

logger = logging.getLogger(__name__)

client = genai.Client(api_key=GEMINI_API_KEY)

_PROMPT = """You are an expert lecture summarizer. Given the transcript of a lecture, produce a clear and structured summary. Include:

1. **Main Topics** — bullet-point list of key topics covered
2. **Key Points** — the most important concepts explained concisely
3. **Summary** — a 2-3 paragraph narrative summary of the lecture

Transcript:
{transcript}
"""


def summarize(transcript: str) -> str:
    """Call Gemini ONCE to summarize the transcript. Returns the summary text.
    
    Retries up to 3 times on rate-limit (429) errors with exponential backoff.
    """
    last_error = None
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=_PROMPT.format(transcript=transcript),
            )
            return response.text.strip()
        except Exception as e:
            last_error = e
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                wait = (attempt + 1) * 15  # 15s, 30s, 45s
                logger.warning(f"Rate limited, waiting {wait}s before retry ({attempt + 1}/3)...")
                time.sleep(wait)
            else:
                raise
    raise RuntimeError(f"Gemini API failed after 3 retries: {last_error}")
