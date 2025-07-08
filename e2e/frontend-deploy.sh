#!/bin/bash
set -e

echo "Building frontend..."

# Build frontend
cd fe

# Wait for Lambda emulator to be ready
echo "Waiting for Lambda emulator to be ready..."
for i in {1..30}; do
  if curl -s http://lambda-emulator:3003/__emulator/request > /dev/null 2>&1; then
    echo "Lambda emulator is ready!"
    break
  fi
  echo "Waiting for Lambda emulator... ($i/30)"
  sleep 2
done

# Use lambda-emulator service URL (accessible from inside docker network)
LAMBDA_API_URL="http://lambda-emulator:3003"

echo "Using Lambda Emulator API URL: $LAMBDA_API_URL"
echo "VITE_API_URL=$LAMBDA_API_URL" > .env.local

# Also set as environment variable for build
export VITE_API_URL="$LAMBDA_API_URL"

npm ci

echo "Starting frontend dev server..."
npm run dev -- --host 0.0.0.0 --port 3002

echo "Frontend dev server started on http://0.0.0.0:3002"