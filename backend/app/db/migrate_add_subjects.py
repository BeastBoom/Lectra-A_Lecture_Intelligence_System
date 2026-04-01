"""
Migration: Add subjects, subject_notes, note_sections tables and
           subject columns to the audios table.

Idempotent — safe to run multiple times.

Usage:
    python -m app.db.migrate_add_subjects
"""
from __future__ import annotations

from sqlalchemy import create_engine, text

from app.configs import DATABASE_URL


_STATEMENTS = [
    # ── Create subjects table ────────────────────────────────────────────
    """
    CREATE TABLE IF NOT EXISTS subjects (
        id          UUID PRIMARY KEY,
        user_id     TEXT,
        name        TEXT NOT NULL,
        description TEXT,
        is_active   BOOLEAN NOT NULL DEFAULT TRUE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    """,

    # ── Create subject_notes table ───────────────────────────────────────
    """
    CREATE TABLE IF NOT EXISTS subject_notes (
        id                  UUID PRIMARY KEY,
        subject_id          UUID NOT NULL REFERENCES subjects(id),
        consolidated_notes  TEXT,
        version             INTEGER NOT NULL DEFAULT 1,
        last_updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    """,

    # ── Create note_sections table ───────────────────────────────────────
    """
    CREATE TABLE IF NOT EXISTS note_sections (
        id               UUID PRIMARY KEY,
        subject_id       UUID NOT NULL REFERENCES subjects(id),
        audio_id         UUID NOT NULL REFERENCES audios(id),
        section_order    INTEGER NOT NULL DEFAULT 0,
        title            TEXT,
        content          TEXT NOT NULL,
        timestamp_start  DOUBLE PRECISION,
        timestamp_end    DOUBLE PRECISION,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    """,

    # ── Add columns to audios (IF NOT EXISTS requires PG 11+) ────────────
    """
    ALTER TABLE audios ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id);
    """,
    """
    ALTER TABLE audios ADD COLUMN IF NOT EXISTS inferred_subject_id UUID REFERENCES subjects(id);
    """,
    """
    ALTER TABLE audios ADD COLUMN IF NOT EXISTS subject_source TEXT NOT NULL DEFAULT 'unset';
    """,
]


def run_migration(echo: bool = True) -> None:
    engine = create_engine(DATABASE_URL, echo=echo)
    print(f"[migrate] Connecting to {DATABASE_URL}")
    with engine.begin() as conn:
        for stmt in _STATEMENTS:
            conn.execute(text(stmt))
    print("[migrate] ✓ Subject management migration complete.")
    engine.dispose()


if __name__ == "__main__":
    run_migration()
