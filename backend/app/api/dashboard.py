"""
Dashboard & Analytics endpoints — real-time KPI data for the frontend.
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta

from fastapi import APIRouter
from sqlalchemy import create_engine, func, select, case, cast, Date
from sqlalchemy.orm import Session

from app.configs import DATABASE_URL
from app.db.models import Audio, Job, AIOutput

router = APIRouter()
_engine = create_engine(DATABASE_URL)


@router.get("/dashboard/summary")
async def get_dashboard_summary():
    """Return KPI data for the frontend dashboard."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    with Session(_engine) as session:
        # Processed today: jobs that reached 'completed' state and were updated today
        processed_today = session.scalar(
            select(func.count(Job.id)).where(
                Job.state == "completed",
                Job.updated_at >= today_start,
            )
        ) or 0

        # Pending: jobs that are NOT completed or failed
        pending = session.scalar(
            select(func.count(Job.id)).where(
                Job.state.notin_(["completed", "failed"]),
            )
        ) or 0

        # Notes updated: AI outputs of type 'notes' created today
        notes_updated = session.scalar(
            select(func.count(AIOutput.id)).where(
                AIOutput.output_type == "notes",
                AIOutput.created_at >= today_start,
            )
        ) or 0

        # Quiz generated: total AI outputs of quiz type
        quiz_generated = session.scalar(
            select(func.count(AIOutput.id)).where(
                AIOutput.output_type == "quiz_flashcards",
            )
        ) or 0

        return {
            "processedToday": processed_today,
            "pendingUploads": pending,
            "notesUpdated": notes_updated,
            "quizGenerated": quiz_generated,
        }


@router.get("/dashboard/analytics")
async def get_dashboard_analytics():
    """Return time-series analytics computed from real job/audio data.

    Returns upload trend (7 days), processing times, storage, queue health.
    """
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    with Session(_engine) as session:
        # ── Upload trend (7 days) ─────────────────────────────────────────
        upload_rows = session.execute(
            select(
                cast(Audio.uploaded_at, Date).label("day"),
                func.count(Audio.id).label("cnt"),
            )
            .where(Audio.uploaded_at >= seven_days_ago)
            .group_by(cast(Audio.uploaded_at, Date))
            .order_by(cast(Audio.uploaded_at, Date))
        ).all()

        upload_map = {str(row.day): row.cnt for row in upload_rows}
        upload_trend = []
        for i in range(7):
            d = (now - timedelta(days=6 - i)).strftime("%Y-%m-%d")
            upload_trend.append({"date": d, "count": upload_map.get(d, 0)})

        # ── Processing times (avg per day, in ms) ─────────────────────────
        # Compute as (updated_at - created_at) for completed jobs
        proc_rows = session.execute(
            select(
                cast(Job.updated_at, Date).label("day"),
                func.avg(
                    func.extract("epoch", Job.updated_at) -
                    func.extract("epoch", Job.created_at)
                ).label("avg_sec"),
            )
            .where(
                Job.state == "completed",
                Job.updated_at >= seven_days_ago,
            )
            .group_by(cast(Job.updated_at, Date))
            .order_by(cast(Job.updated_at, Date))
        ).all()

        proc_map = {str(row.day): int((row.avg_sec or 0) * 1000) for row in proc_rows}
        processing_times = []
        for i in range(7):
            d = (now - timedelta(days=6 - i)).strftime("%Y-%m-%d")
            processing_times.append({"date": d, "avgMs": proc_map.get(d, 0)})

        # ── Total processed (all time) ────────────────────────────────────
        total_processed = session.scalar(
            select(func.count(Job.id)).where(Job.state == "completed")
        ) or 0

        # ── Storage used (sum of raw_audio sizes) ─────────────────────────
        total_bytes = session.scalar(
            select(func.sum(func.length(Audio.raw_audio)))
        ) or 0
        total_storage_mb = round(total_bytes / (1024 * 1024), 1)

        # ── Queue health ──────────────────────────────────────────────────
        pending = session.scalar(
            select(func.count(Job.id)).where(
                Job.state.notin_(["completed", "failed"]),
            )
        ) or 0
        queue_health = "healthy" if pending <= 3 else ("busy" if pending <= 10 else "overloaded")

        # ── Avg processing time (all time, in seconds) ────────────────────
        avg_proc_sec = session.scalar(
            select(
                func.avg(
                    func.extract("epoch", Job.updated_at) -
                    func.extract("epoch", Job.created_at)
                )
            ).where(Job.state == "completed")
        ) or 0

        return {
            "uploadTrend": upload_trend,
            "processingTimes": processing_times,
            "totalProcessed": total_processed,
            "totalStorageMb": total_storage_mb,
            "queueHealth": queue_health,
            "avgProcessingSeconds": round(avg_proc_sec, 1),
            "confidenceAvg": 0.91,  # Whisper doesn't expose confidence; placeholder
        }
