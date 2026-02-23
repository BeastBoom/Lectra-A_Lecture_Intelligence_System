"""
Dashboard summary endpoint — KPI cards for the frontend.
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta

from fastapi import APIRouter
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

from app.configs import DATABASE_URL
from app.db.models import Audio, Job, AIOutput

router = APIRouter()
_engine = create_engine(DATABASE_URL)


@router.get("/dashboard/summary")
async def get_dashboard_summary():
    """Return KPI data for the frontend dashboard.

    Returns:
        processedToday: number of audios with completed jobs today
        pendingUploads: number of jobs in non-completed/non-failed state
        notesUpdated:   number of AI outputs created today
        quizGenerated:  total AI outputs of quiz/flashcard type (or total count)
    """
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

        # Notes updated: AI outputs created today
        notes_updated = session.scalar(
            select(func.count(AIOutput.id)).where(
                AIOutput.created_at >= today_start,
            )
        ) or 0

        # Quiz generated: total AI outputs (rough proxy)
        quiz_generated = session.scalar(
            select(func.count(AIOutput.id))
        ) or 0

        return {
            "processedToday": processed_today,
            "pendingUploads": pending,
            "notesUpdated": notes_updated,
            "quizGenerated": quiz_generated,
        }
