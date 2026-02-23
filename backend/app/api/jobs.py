"""
Job status, logs, and reprocess endpoints.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.configs import DATABASE_URL
from app.db.models import Job, JobLog, Artifact

router = APIRouter()
_engine = create_engine(DATABASE_URL)


@router.get("/jobs/{job_id}/status")
async def get_job_status(job_id: str):
    """Return job state and metadata."""
    try:
        jid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    with Session(_engine) as session:
        job = session.get(Job, jid)
        if job is None:
            raise HTTPException(status_code=404, detail="Job not found")

        return {
            "jobId": str(job.id),
            "audioId": str(job.audio_id),
            "state": job.state,
            "retryCount": job.retry_count,
            "lastError": job.last_error,
            "progress": job.progress,
            "createdAt": str(job.created_at),
            "updatedAt": str(job.updated_at),
        }


@router.get("/jobs/{job_id}/logs")
async def get_job_logs(job_id: str):
    """Return all logs for a job as a list, grouped chronologically.

    Response:
        {
            "jobId": "...",
            "state": "completed",
            "logs": [
                {"message": "preprocessing_audio → denoising", "timestamp": "..."},
                {"message": "denoising → transcribing", "timestamp": "..."},
                ...
            ]
        }
    """
    try:
        jid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    with Session(_engine) as session:
        job = session.get(Job, jid)
        if job is None:
            raise HTTPException(status_code=404, detail="Job not found")

        stmt = (
            select(JobLog)
            .where(JobLog.job_id == jid)
            .order_by(JobLog.timestamp.asc())
        )
        log_rows = session.scalars(stmt).all()

        return {
            "jobId": str(job.id),
            "state": job.state,
            "logs": [
                {
                    "message": log.message,
                    "timestamp": str(log.timestamp),
                }
                for log in log_rows
            ],
        }


@router.post("/jobs/{job_id}/reprocess")
async def reprocess_job(job_id: str):
    """Re-enqueue a job for processing from the beginning."""
    try:
        jid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    with Session(_engine) as session:
        job = session.get(Job, jid)
        if job is None:
            raise HTTPException(status_code=404, detail="Job not found")

        job.state = "preprocessing_audio"
        job.retry_count = (job.retry_count or 0) + 1
        job.last_error = None
        job.progress = {}
        job.updated_at = datetime.now(timezone.utc)
        session.commit()

        return {
            "jobId": str(job.id),
            "state": job.state,
            "message": "Job re-enqueued",
        }
