FROM python:3.11-slim

# Install system dependencies for Playwright + Chromium
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    ca-certificates \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright and Chromium browser
RUN playwright install chromium --with-deps

# Run crawl4ai setup (downloads browser automation dependencies)
RUN python -c "import asyncio; from crawl4ai import AsyncWebCrawler; print('crawl4ai ready')" || true

COPY main.py .

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
