# Use an official lightweight Python image.
# python:3.11-slim represents a stable, small Debian-based environment.
FROM python:3.11-slim

# Set environment variables
# PYTHONDONTWRITEBYTECODE: Prevents Python from writing pyc files to disc
# PYTHONUNBUFFERED: Ensures python output is sent straight to terminal (e.g. your container logs)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies required for building Python packages and Prisma
# - curl: for downloading things
# - build-essential: for compiling some python packages
# - libatomic1: CRITICAL for Prisma on some arm64/minimal systems
# - openssl: required for Prisma to talk to the DB
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    libatomic1 \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (required for Prisma CLI to generate the client)
# We use the official setup script for Node 18 (stable LTS)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Prisma schema directory (needed for generation)
COPY prisma ./prisma/

# Generate the Prisma Client
# This creates the Python client code based on your schema
RUN python -m prisma generate

# Copy the rest of the application code
COPY . .

# Expose the port that the application listens on.
ENV PORT=8000
EXPOSE 8000

# Run the web service on container startup.
# We use shell form to allow variable expansion of $PORT
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
