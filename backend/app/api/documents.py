"""
Minimal document endpoints — placeholder until a full document model is added.
"""
from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Query

router = APIRouter()

# In-memory store for dev (documents are not yet in the DB schema)
_documents: list[dict] = []


@router.get("/documents")
async def list_documents(courseId: Optional[str] = Query(default=None)):
    """List documents, optionally filtered by courseId."""
    if courseId:
        return {"documents": [d for d in _documents if d.get("courseId") == courseId]}
    return {"documents": _documents}


@router.post("/documents")
async def upload_document():
    """Placeholder document upload endpoint.

    In production this would accept a file and store it.
    For now, returns a success stub so the frontend wiring works.
    """
    import uuid
    from datetime import datetime, timezone

    doc_id = str(uuid.uuid4())
    doc = {
        "id": doc_id,
        "title": "Uploaded Document",
        "type": "pdf",
        "courseId": "default",
        "pages": 0,
        "extractionStatus": "parsing",
        "uploadedAt": str(datetime.now(timezone.utc)),
        "fileSize": "0 MB",
    }
    _documents.append(doc)
    return doc
