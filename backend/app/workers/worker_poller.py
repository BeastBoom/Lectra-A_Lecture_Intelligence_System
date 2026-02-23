"""
DB-backed job poller — claims and dispatches jobs through the simplified pipeline.

Pipeline: preprocessing_audio → denoising → transcribing → summarizing → completed
"""
from __future__ import annotations

import logging
import time
import traceback
from datetime import datetime, timezone

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.configs import DATABASE_URL, JOB_STATES, FAILED_STATE, MAX_JOB_RETRIES, next_state
from app.db.models import Job, JobLog

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.WARNING, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
# Only show INFO for our workers
logging.getLogger("app").setLevel(logging.INFO)
logging.getLogger(__name__).setLevel(logging.INFO)

_engine = create_engine(DATABASE_URL)

# ── State → worker module mapping ─────────────────────────────────────────────
_WORKER_MAP: dict[str, str] = {
    "preprocessing_audio": "app.workers.preprocess_worker",
    "denoising":           "app.workers.denoise_worker",
    "transcribing":        "app.workers.transcription_worker",
    "summarizing":         "app.workers.ai_worker",
}

# States the poller should look for
_PROCESSABLE_STATES = [s for s in JOB_STATES if s not in ("uploaded", "completed")]


def _import_worker(module_path: str):
    import importlib
    mod = importlib.import_module(module_path)
    return mod.run


def _claim_job(session: Session) -> Job | None:
    placeholders = ", ".join(f":s{i}" for i in range(len(_PROCESSABLE_STATES)))
    params = {f"s{i}": s for i, s in enumerate(_PROCESSABLE_STATES)}
    sql = text(
        f"SELECT id FROM jobs WHERE state IN ({placeholders}) "
        f"ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED"
    )
    row = session.execute(sql, params).fetchone()
    if row is None:
        return None
    return session.get(Job, row[0])


def process_one() -> bool:
    with Session(_engine) as session:
        session.begin()
        job = _claim_job(session)
        if job is None:
            session.rollback()
            return False

        state = job.state
        logger.info(f"Processing job {job.id} [{state}]")

        worker_module = _WORKER_MAP.get(state)
        if worker_module is None:
            logger.warning(f"No worker for state '{state}'")
            session.rollback()
            return False

        try:
            worker_fn = _import_worker(worker_module)
            session.commit()  # release lock before long work

            worker_fn(str(job.id), str(job.audio_id), state)

            # Advance state
            with Session(_engine) as s2:
                j = s2.get(Job, job.id)
                if j is None:
                    return True
                nxt = next_state(state)
                if nxt:
                    j.state = nxt
                else:
                    j.state = "completed"
                j.updated_at = datetime.now(timezone.utc)
                j.last_error = None
                s2.add(JobLog(job_id=j.id, message=f"{state} → {j.state}"))
                s2.commit()
                logger.info(f"Job {job.id}: {state} → {j.state}")

        except Exception as exc:
            logger.error(f"Job {job.id} failed [{state}]: {exc}")
            logger.debug(traceback.format_exc())
            with Session(_engine) as s2:
                j = s2.get(Job, job.id)
                if j is None:
                    return True
                j.retry_count = (j.retry_count or 0) + 1
                j.last_error = str(exc)[:2000]
                j.updated_at = datetime.now(timezone.utc)
                if j.retry_count >= MAX_JOB_RETRIES:
                    j.state = FAILED_STATE
                    logger.error(f"Job {job.id} failed permanently")
                s2.add(JobLog(job_id=j.id, message=f"Error in {state}: {exc}"))
                s2.commit()

        return True


def poll_loop(interval: float = 2.0) -> None:
    logger.info("Worker poller started")
    while True:
        try:
            did_work = process_one()
            if not did_work:
                time.sleep(interval)
        except KeyboardInterrupt:
            break
        except Exception as exc:
            logger.error(f"Poller error: {exc}")
            time.sleep(interval)


if __name__ == "__main__":
    poll_loop()
