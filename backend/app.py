"""
DEPRECATED — Legacy Flask entrypoint from pre-FastAPI prototype.

This file is NOT used by the production application.
The real entrypoint is: backend/app/main.py

To start the backend:
    uvicorn app.main:app --reload --port 8000
"""
raise RuntimeError(
    "backend/app.py is a legacy file and should not be imported. "
    "Use 'uvicorn app.main:app' from the backend/ directory."
)