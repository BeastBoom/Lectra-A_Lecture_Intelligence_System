FROM python:3.11-slim

# Install FFmpeg and required system dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg libsndfile1 build-essential && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Google Cloud Run expects port 8080 by default, 
# but we can map it or stick to 8000. Let's use 8000 and tell Cloud Run to use it)
ENV PORT=8000
EXPOSE $PORT

# Run uvicorn server
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
