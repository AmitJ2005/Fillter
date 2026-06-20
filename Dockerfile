FROM python:3.13-slim

# Faster, cleaner Python in containers
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install dependencies first to leverage Docker layer caching.
# gunicorn is installed explicitly so the image always has a WSGI server,
# even if it is missing from requirements.txt.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn==23.0.0

# Copy the application
COPY . .

EXPOSE 8000

# Single worker: the app keeps the selected stock in module-level globals,
# which are not shared across processes. Threads give light concurrency.
# Shell form so $PORT (injected by some hosts) is honoured, defaulting to 8000.
# `python -m gunicorn` runs it via the interpreter, avoiding any PATH issues.
CMD python -m gunicorn wsgi:app --workers 1 --threads 4 --timeout 120 --bind 0.0.0.0:${PORT:-8000}
