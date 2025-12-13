#!/bin/bash
# Script to kill process on port 5000

PORT=${1:-5000}
PID=$(lsof -ti:$PORT)

if [ -z "$PID" ]; then
  echo "✅ Port $PORT is free"
else
  echo "🔍 Found process $PID using port $PORT"
  kill -9 $PID
  sleep 1
  if lsof -ti:$PORT > /dev/null 2>&1; then
    echo "❌ Failed to kill process"
  else
    echo "✅ Port $PORT is now free"
  fi
fi


