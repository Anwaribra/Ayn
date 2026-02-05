#!/bin/bash

# Script to start the FastAPI server, killing any existing instances first

echo "🔍 Checking for existing server processes..."

# Find and kill any existing uvicorn processes on port 8000
PID=$(lsof -ti:8000 2>/dev/null)
if [ ! -z "$PID" ]; then
    echo "🛑 Stopping existing server (PID: $PID)..."
    kill -9 $PID
    sleep 1
    echo "✅ Existing server stopped"
else
    echo "✅ No existing server found"
fi

# Also check for any background uvicorn processes
JOBS=$(jobs -p)
if [ ! -z "$JOBS" ]; then
    echo "🛑 Stopping background jobs..."
    kill $JOBS 2>/dev/null
    sleep 1
fi

# Activate virtual environment if not already activated
if [ -z "$VIRTUAL_ENV" ]; then
    if [ -d "venv" ]; then
        echo "🔌 Activating virtual environment..."
        source venv/bin/activate
    else
        echo "❌ Virtual environment not found. Run setup_wsl.sh first."
        exit 1
    fi
fi

# Start the server
echo "🚀 Starting FastAPI server..."
echo "   Access at: http://localhost:8000"
echo "   Docs at: http://localhost:8000/docs"
echo "   Press CTRL+C to stop"
echo ""

uvicorn main:app --reload --host 0.0.0.0 --port 8000

