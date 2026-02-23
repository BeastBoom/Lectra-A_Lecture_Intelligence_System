"""
Create all database tables in PostgreSQL — no Alembic.

Usage:
    python -m app.db.create_tables
    # or from backend/:
    python app/db/create_tables.py
"""
from __future__ import annotations

from sqlalchemy import create_engine

from app.configs import DATABASE_URL
from app.db.models import Base


def create_all_tables(echo: bool = True) -> None:
    """Connect to Postgres and create every table defined in models.py."""
    engine = create_engine(DATABASE_URL, echo=echo)
    print(f"[create_tables] Connecting to {DATABASE_URL}")
    Base.metadata.create_all(engine)
    print("[create_tables] ✓ All tables created successfully.")
    engine.dispose()


if __name__ == "__main__":
    create_all_tables()
