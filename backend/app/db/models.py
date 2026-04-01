"""
SQLAlchemy ORM models for the Lectra audio processing system.

Tables: audios, artifacts, jobs, job_logs, transcript_segments, ai_outputs,
        subjects, subject_notes, note_sections, users
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    LargeBinary,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


def _uuid() -> uuid.UUID:
    return uuid.uuid4()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ── Subjects ──────────────────────────────────────────────────────────────────

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id = Column(Text, nullable=True)
    name = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    consolidated_notes = relationship("SubjectNotes", back_populates="subject", cascade="all, delete-orphan")
    note_sections = relationship("NoteSection", back_populates="subject", cascade="all, delete-orphan")


# ── Subject Notes (consolidated per subject) ─────────────────────────────────

class SubjectNotes(Base):
    __tablename__ = "subject_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False)
    consolidated_notes = Column(Text, nullable=True)
    version = Column(Integer, default=1, nullable=False)
    last_updated_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    subject = relationship("Subject", back_populates="consolidated_notes")


# ── Note Sections (per-session structured note items) ─────────────────────────

class NoteSection(Base):
    __tablename__ = "note_sections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False)
    audio_id = Column(UUID(as_uuid=True), ForeignKey("audios.id"), nullable=False)
    section_order = Column(Integer, default=0, nullable=False)
    title = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    timestamp_start = Column(Float, nullable=True)
    timestamp_end = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    subject = relationship("Subject", back_populates="note_sections")
    audio = relationship("Audio", back_populates="note_sections")


# ── Audios ────────────────────────────────────────────────────────────────────

class Audio(Base):
    __tablename__ = "audios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id = Column(Text, nullable=True)
    course_id = Column(Text, nullable=True)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=True)
    inferred_subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=True)
    subject_source = Column(Text, default="unset", nullable=False)  # manual | ai_inferred | unset
    filename = Column(Text, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    duration_seconds = Column(Float, nullable=True)
    raw_audio = Column(LargeBinary, nullable=False)
    metadata_ = Column("metadata", JSONB, nullable=True)

    subject = relationship("Subject", foreign_keys=[subject_id])
    inferred_subject = relationship("Subject", foreign_keys=[inferred_subject_id])
    artifacts = relationship("Artifact", back_populates="audio", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="audio", cascade="all, delete-orphan")
    transcript_segments = relationship("TranscriptSegment", back_populates="audio", cascade="all, delete-orphan")
    note_sections = relationship("NoteSection", back_populates="audio", cascade="all, delete-orphan")


# ── Artifacts ─────────────────────────────────────────────────────────────────

class Artifact(Base):
    __tablename__ = "artifacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    audio_id = Column(UUID(as_uuid=True), ForeignKey("audios.id"), nullable=False)
    artifact_type = Column(Text, nullable=False)  # standardized, denoised_v1
    data = Column(LargeBinary, nullable=True)
    original_start = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    extra = Column(JSONB, nullable=True)

    audio = relationship("Audio", back_populates="artifacts")


# ── Jobs ──────────────────────────────────────────────────────────────────────

class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    audio_id = Column(UUID(as_uuid=True), ForeignKey("audios.id"), nullable=False)
    state = Column(Text, nullable=False, default="uploaded")
    retry_count = Column(Integer, nullable=False, default=0)
    last_error = Column(Text, nullable=True)
    progress = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    audio = relationship("Audio", back_populates="jobs")
    logs = relationship("JobLog", back_populates="job", cascade="all, delete-orphan")


# ── Job Logs ──────────────────────────────────────────────────────────────────

class JobLog(Base):
    __tablename__ = "job_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    job = relationship("Job", back_populates="logs")


# ── Transcript Segments ───────────────────────────────────────────────────────

class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    audio_id = Column(UUID(as_uuid=True), ForeignKey("audios.id"), nullable=False)
    start = Column(Float, nullable=False)
    end = Column(Float, nullable=False)
    speaker_label = Column(Text, nullable=True)
    text_raw = Column(Text, nullable=True)
    text_clean = Column(Text, nullable=True)

    audio = relationship("Audio", back_populates="transcript_segments")


# ── AI Outputs ────────────────────────────────────────────────────────────────

class AIOutput(Base):
    __tablename__ = "ai_outputs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    audio_id = Column(UUID(as_uuid=True), ForeignKey("audios.id"), nullable=False)
    output_type = Column(Text, nullable=False)  # summary
    payload = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)


# ── Users ─────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    email = Column(Text, nullable=False, unique=True, index=True)
    hashed_password = Column(Text, nullable=True)  # nullable for OAuth-only users
    full_name = Column(Text, nullable=True)
    provider = Column(Text, nullable=False, default="email")  # email, google, apple, microsoft
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

