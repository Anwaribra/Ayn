#!/bin/bash

# Kill any running Next.js processes
echo "Killing any running Next.js processes..."
pkill -f "next dev" 2>/dev/null || true

# Kill processes on ports 3000 and 3001
echo "Freeing up ports 3000 and 3001..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Clean .next directory completely (this will fix missing directory issues)
echo "Cleaning .next directory..."
rm -rf .next 2>/dev/null || true

# Create .next directory structure if it doesn't exist
echo "Creating .next directory structure..."
mkdir -p .next/dev 2>/dev/null || true

echo "Cleanup complete! You can now run 'pnpm dev' again."

