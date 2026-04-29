# --- STAGE 1: Builder ---
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    libatomic1 \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for Prisma generation
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies to a temporary location
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Copy Prisma and generate client
COPY prisma ./prisma/
# pip --prefix=/install does not install a python binary under /install/bin; use image python3 + PYTHONPATH
RUN PYTHONPATH=/install/lib/python3.11/site-packages python3 -m prisma generate

# --- STAGE 2: Runtime ---
FROM python:3.11-slim

WORKDIR /app

# Install ONLY runtime system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    libatomic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed python packages and generated Prisma client from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY . .

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
EXPOSE 8000

# Run the application
CMD uvicorn main:app --host 0.0.0.0 --port $PORT

