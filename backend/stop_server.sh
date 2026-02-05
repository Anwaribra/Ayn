#!/bin/bash

# Script to stop the FastAPI server

echo "🔍 Looking for server processes on port 8000..."

# Find process using port 8000
PID=$(lsof -ti:8000 2>/dev/null)

if [ ! -z "$PID" ]; then
    echo "🛑 Stopping server (PID: $PID)..."
    kill -9 $PID
    sleep 1
    echo "✅ Server stopped"
else
    echo "ℹ️  No server process found on port 8000"
fi

# Also kill any background jobs
JOBS=$(jobs -p)
if [ ! -z "$JOBS" ]; then
    echo "🛑 Stopping background jobs..."
    kill $JOBS 2>/dev/null
    echo "✅ Background jobs stopped"
fi

echo "✅ Done"

