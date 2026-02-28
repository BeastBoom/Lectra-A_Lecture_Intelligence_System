"""
Audio endpoints — list, detail, artifacts, transcript.
"""
from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

from app.configs import DATABASE_URL
from app.db.models import Artifact, Audio, Job, JobLog, TranscriptSegment, AIOutput

router = APIRouter()
_engine = create_engine(DATABASE_URL)


# ── GET /api/audios ──────────────────────────────────────────────────────────

@router.get("/audios")
async def list_audios():
    """List all audios with metadata and latest job status."""
    with Session(_engine) as session:
        audios = session.scalars(
            select(Audio).order_by(Audio.uploaded_at.desc())
        ).all()

        results = []
        for a in audios:
            # Get latest job state for this audio
            latest_job = session.scalars(
                select(Job)
                .where(Job.audio_id == a.id)
                .order_by(Job.created_at.desc())
            ).first()

            status = "processing"
            if latest_job:
                if latest_job.state == "completed":
                    status = "ready"
                elif latest_job.state == "failed":
                    status = "error"

            results.append({
                "audioId": str(a.id),
                "title": a.filename,
                "durationSeconds": a.duration_seconds,
                "uploadedAt": str(a.uploaded_at) if a.uploaded_at else None,
                "status": status,
                "courseId": a.course_id,
                "userId": a.user_id,
                "metadata": a.metadata_,
            })

        return {"audios": results}


# ── GET /api/audios/{audioId} ────────────────────────────────────────────────

@router.get("/audios/{audio_id}")
async def get_audio(audio_id: str):
    """Return audio metadata, artifact IDs, and transcript summary."""
    try:
        aid = uuid.UUID(audio_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid audio ID format")

    with Session(_engine) as session:
        audio = session.get(Audio, aid)
        if audio is None:
            raise HTTPException(status_code=404, detail="Audio not found")

        # Latest job
        latest_job = session.scalars(
            select(Job).where(Job.audio_id == aid).order_by(Job.created_at.desc())
        ).first()

        status = "processing"
        job_id = None
        if latest_job:
            job_id = str(latest_job.id)
            if latest_job.state == "completed":
                status = "ready"
            elif latest_job.state == "failed":
                status = "error"

        # Artifact IDs
        artifacts = session.scalars(
            select(Artifact).where(Artifact.audio_id == aid).order_by(Artifact.created_at)
        ).all()

        # Transcript snippet (first segment)
        first_seg = session.scalars(
            select(TranscriptSegment)
            .where(TranscriptSegment.audio_id == aid)
            .order_by(TranscriptSegment.start)
        ).first()

        # Summary from AI outputs
        summary_out = session.scalars(
            select(AIOutput).where(
                AIOutput.audio_id == aid,
                AIOutput.output_type == "summary",
            )
        ).first()
        summary_text = None
        if summary_out and summary_out.payload:
            summary_text = (
                summary_out.payload.get("summary")
                if isinstance(summary_out.payload, dict)
                else str(summary_out.payload)
            )

        return {
            "audioId": str(audio.id),
            "title": audio.filename,
            "durationSeconds": audio.duration_seconds,
            "uploadedAt": str(audio.uploaded_at) if audio.uploaded_at else None,
            "status": status,
            "courseId": audio.course_id,
            "userId": audio.user_id,
            "jobId": job_id,
            "metadata": audio.metadata_,
            "summary": summary_text,
            "transcriptSnippet": (first_seg.text_clean or first_seg.text_raw or "")[:200] if first_seg else None,
            "artifacts": [
                {
                    "id": str(art.id),
                    "artifactType": art.artifact_type,
                    "createdAt": str(art.created_at),
                }
                for art in artifacts
            ],
        }


# ── GET /api/audios/{audioId}/artifacts ──────────────────────────────────────

@router.get("/audios/{audio_id}/artifacts")
async def list_audio_artifacts(
    audio_id: str,
    type: Optional[str] = Query(default=None, description="Filter by artifact type"),
):
    """List all artifacts for a given audio. Optionally filter by type."""
    try:
        aid = uuid.UUID(audio_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid audio ID format")

    with Session(_engine) as session:
        stmt = select(Artifact).where(Artifact.audio_id == aid)
        if type:
            stmt = stmt.where(Artifact.artifact_type == type)
        stmt = stmt.order_by(Artifact.created_at)

        rows = session.scalars(stmt).all()

        return {
            "audioId": audio_id,
            "artifacts": [
                {
                    "id": str(r.id),
                    "artifactType": r.artifact_type,
                    "originalStart": r.original_start,
                    "createdAt": str(r.created_at),
                    "extra": r.extra,
                    "downloadUrl": f"/api/artifacts/{r.id}/download",
                }
                for r in rows
            ],
        }


# ── GET /api/audios/{audioId}/transcript ─────────────────────────────────────

@router.get("/audios/{audio_id}/transcript")
async def get_audio_transcript(audio_id: str):
    """Return all transcript segments for an audio, ordered by start time."""
    try:
        aid = uuid.UUID(audio_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid audio ID format")

    with Session(_engine) as session:
        # Verify audio exists
        audio = session.get(Audio, aid)
        if audio is None:
            raise HTTPException(status_code=404, detail="Audio not found")

        segments = session.scalars(
            select(TranscriptSegment)
            .where(TranscriptSegment.audio_id == aid)
            .order_by(TranscriptSegment.start)
        ).all()

        return {
            "audioId": audio_id,
            "segments": [
                {
                    "id": str(seg.id),
                    "start": seg.start,
                    "end": seg.end,
                    "speakerLabel": seg.speaker_label,
                    "textRaw": seg.text_raw,
                    "textClean": seg.text_clean,
                }
                for seg in segments
            ],
        }


# ── DELETE /api/audios/{audioId} ─────────────────────────────────────────────

@router.delete("/audios/{audio_id}")
async def delete_audio(audio_id: str):
    """Delete an audio and all its related data (jobs, artifacts, transcript, AI outputs)."""
    import os
    import logging
    logger = logging.getLogger(__name__)

    try:
        aid = uuid.UUID(audio_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid audio ID format")

    with Session(_engine) as session:
        audio = session.get(Audio, aid)
        if audio is None:
            raise HTTPException(status_code=404, detail="Audio not found")

        # Delete related rows in dependency order
        session.query(TranscriptSegment).filter(TranscriptSegment.audio_id == aid).delete()
        session.query(AIOutput).filter(AIOutput.audio_id == aid).delete()
        session.query(Artifact).filter(Artifact.audio_id == aid).delete()

        # Delete job_logs first (they reference jobs)
        job_ids = [j.id for j in session.query(Job.id).filter(Job.audio_id == aid).all()]
        if job_ids:
            session.query(JobLog).filter(JobLog.job_id.in_(job_ids)).delete(synchronize_session=False)
        session.query(Job).filter(Job.audio_id == aid).delete()

        # Delete the audio record
        session.delete(audio)
        session.commit()

        logger.info(f"[Delete Audio] Deleted audio {audio_id}")

    return {"message": "Audio deleted successfully.", "audioId": audio_id}

