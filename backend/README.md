# Lectra — Audio Processing Backend

Lecture audio pipeline: **Denoise → Whisper ASR → Gemini Summary**. Stores everything in PostgreSQL.

---

## Integration into Main Project

### 1. Copy the `backend/` directory

Copy the entire `backend/` folder into your project. The structure is:

```
backend/
├─ app/
│  ├─ main.py              # FastAPI entry point
│  ├─ configs.py            # All configuration from .env
│  ├─ utils.py              # Shared helpers
│  ├─ api/
│  │  ├─ upload.py          # POST /api/upload
│  │  ├─ jobs.py            # GET status, logs; POST reprocess
│  │  ├─ results.py         # GET transcript + summary + audio
│  │  └─ audios.py          # GET artifact listing
│  ├─ workers/
│  │  ├─ worker_poller.py   # Job queue poller
│  │  ├─ preprocess_worker.py
│  │  ├─ denoise_worker.py
│  │  ├─ transcription_worker.py
│  │  └─ ai_worker.py
│  ├─ services/
│  │  ├─ whisper_adapter.py
│  │  ├─ gemini_adapter.py
│  │  ├─ denoise_service.py
│  │  ├─ ffmpeg_service.py
│  │  ├─ filler_filter.py
│  │  └─ storage_pg.py
│  └─ db/
│     ├─ models.py
│     └─ create_tables.py
├─ scripts/
│  └─ reset_db.py
├─ .env
└─ requirements.txt
```

### 2. Install system dependencies

| Dependency | Install |
|-----------|---------|
| Python 3.11+ | https://python.org |
| PostgreSQL 14+ | https://postgresql.org |
| FFmpeg 5+ | https://ffmpeg.org — must be on PATH |

### 3. Create database

```sql
CREATE USER lectra WITH PASSWORD 'lectra';
CREATE DATABASE lectra_dev OWNER lectra;
```

### 4. Install Python packages

```bash
cd backend
python -m venv env
env\Scripts\activate        # Windows
pip install -r requirements.txt
```

> `openai-whisper` pulls in PyTorch (~2GB). First install takes a few minutes.

### 5. Configure .env

```env
DATABASE_URL=postgresql://lectra:lectra@localhost:5432/lectra_dev
GEMINI_API_KEY=your-key-here
WHISPER_MODEL=base
FFMPEG_BIN=ffmpeg
```

### 6. Create tables

```bash
python -m app.db.create_tables
```

### 7. Run

```bash
# Terminal 1 — API
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Worker
python -m app.workers.worker_poller
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload audio (mp3/wav/m4a/aac) |
| GET | `/api/jobs/{id}/status` | Job state + metadata |
| GET | `/api/jobs/{id}/logs` | All pipeline logs for a job (list) |
| GET | `/api/jobs/{id}/results` | Transcript + summary + denoised audio URL |
| GET | `/api/artifacts/{id}/download` | Download denoised audio |
| POST | `/api/jobs/{id}/reprocess` | Re-enqueue a failed/completed job |
| GET | `/api/audios/{id}/artifacts` | List all artifacts for an audio |

### Job Logs Response

```json
{
  "jobId": "...",
  "state": "completed",
  "logs": [
    {"message": "preprocessing_audio → denoising", "timestamp": "2026-02-22T..."},
    {"message": "denoising → transcribing", "timestamp": "2026-02-22T..."},
    {"message": "transcribing → summarizing", "timestamp": "2026-02-22T..."},
    {"message": "summarizing → completed", "timestamp": "2026-02-22T..."}
  ]
}
```

---

## Pipeline

```
Upload → Preprocess (mono 16k WAV) → Denoise → Whisper ASR → Gemini 2.5 Flash Summary → Done
```

All audio, artifacts, transcripts, and summaries are stored in PostgreSQL. No file system storage is used in production.

---

## Reset Database

```bash
python -m scripts.reset_db
```
