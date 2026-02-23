"""
Results + artifact download endpoints.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.configs import DATABASE_URL
from app.db.models import Job, Artifact, TranscriptSegment, AIOutput

router = APIRouter()
_engine = create_engine(DATABASE_URL)


@router.get("/jobs/{job_id}/results")
async def get_job_results(job_id: str):
    """Return transcript, summary, and denoised audio artifact ID."""
    try:
        jid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    with Session(_engine) as session:
        job = session.get(Job, jid)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        # Transcript (columns: text_raw, text_clean)
        stmt = select(TranscriptSegment).where(TranscriptSegment.audio_id == job.audio_id)
        seg = session.scalars(stmt).first()

        # Summary (payload is JSONB with {"summary": "..."})
        stmt2 = select(AIOutput).where(
            AIOutput.audio_id == job.audio_id,
            AIOutput.output_type == "summary",
        )
        ai = session.scalars(stmt2).first()

        # Denoised audio artifact
        stmt3 = select(Artifact).where(
            Artifact.audio_id == job.audio_id,
            Artifact.artifact_type == "denoised_v1",
        )
        denoised = session.scalars(stmt3).first()

        summary_text = None
        if ai and ai.payload:
            summary_text = ai.payload.get("summary") if isinstance(ai.payload, dict) else str(ai.payload)

        return {
            "jobId": str(job.id),
            "state": job.state,
            "transcript": seg.text_clean if seg else None,
            "rawTranscript": seg.text_raw if seg else None,
            "summary": summary_text,
            "denoisedAudioId": str(denoised.id) if denoised else None,
            "denoisedAudioUrl": f"/api/artifacts/{denoised.id}/download" if denoised else None,
        }


@router.get("/artifacts/{artifact_id}/download")
async def download_artifact(artifact_id: str):
    """Stream an artifact's audio bytes."""
    try:
        aid = uuid.UUID(artifact_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid artifact ID")

    with Session(_engine) as session:
        art = session.get(Artifact, aid)
        if not art or not art.data:
            raise HTTPException(status_code=404, detail="Artifact not found")

        return Response(
            content=art.data,
            media_type="audio/wav",
            headers={"Content-Disposition": f"inline; filename={artifact_id}.wav"},
        )
