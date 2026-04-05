"""
Shared SQLAlchemy engine — single connection pool for the whole app.

Import `engine` or `get_session` from here instead of calling
`create_engine(DATABASE_URL)` in every module.
"""
from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.configs import DATABASE_URL

# One engine, one pool — shared across all API modules and workers.
# pool_pre_ping=True silently reconnects dropped connections (important for
# Supabase / cloud Postgres which aggressively closes idle connections).
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)


def get_session():
    """FastAPI dependency — yields a SQLAlchemy Session then closes it."""
    with Session(engine) as session:
        yield session
