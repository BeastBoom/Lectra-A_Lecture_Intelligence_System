"""
SQLAlchemy ORM models for the Lectra audio processing system.

Tables: audios, artifacts, jobs, job_logs, transcript_segments, ai_outputs
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
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


# ── Audios ────────────────────────────────────────────────────────────────────

class Audio(Base):
    __tablename__ = "audios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id = Column(Text, nullable=True)
    course_id = Column(Text, nullable=True)
    filename = Column(Text, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    duration_seconds = Column(Float, nullable=True)
    raw_audio = Column(LargeBinary, nullable=False)
    metadata_ = Column("metadata", JSONB, nullable=True)

    artifacts = relationship("Artifact", back_populates="audio", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="audio", cascade="all, delete-orphan")
    transcript_segments = relationship("TranscriptSegment", back_populates="audio", cascade="all, delete-orphan")


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
