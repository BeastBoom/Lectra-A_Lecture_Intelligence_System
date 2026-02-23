"""
Reset all database tables — clears all data from all Lectra tables.

Usage:
    cd backend
    python -m scripts.reset_db
"""
from sqlalchemy import create_engine, text
from app.configs import DATABASE_URL


def reset():
    engine = create_engine(DATABASE_URL)
    tables = [
        "ai_outputs",
        "transcript_segments",
        "job_logs",
        "jobs",
        "artifacts",
        "audios",
    ]
    with engine.begin() as conn:
        for table in tables:
            conn.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
            print(f"  ✓ Truncated {table}")
    print("\nAll tables cleared.")


if __name__ == "__main__":
    print("Resetting all Lectra database tables...")
    reset()
