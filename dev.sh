#!/bin/bash

# Development tmux script for full-stack development
# Usage: ./dev.sh

SESSION_NAME="dev"

# Check if tmux session already exists
if tmux has-session -t $SESSION_NAME 2>/dev/null; then
    echo "Session '$SESSION_NAME' already exists. Attaching..."
    tmux attach-session -t $SESSION_NAME
    exit 0
fi

# Create new tmux session
tmux new-session -d -s $SESSION_NAME

# Split window into 3 panes
# First split horizontally (creates 2 panes)
tmux split-window -h

# Split the right pane vertically (now we have 3 panes)
tmux split-window -v

# Setup panes
# Pane 0 (left): Frontend
tmux send-keys -t 0 'cd fe && echo "🚀 Starting Frontend (Vite)..." && bun run dev' Enter

# Pane 1 (top right): Backend  
tmux send-keys -t 1 'cd be && echo "🔧 Starting Backend (Bun)..." && bun run dev' Enter

# Pane 2 (bottom right): Schema Generator
tmux send-keys -t 2 'cd schemaGen && echo "📊 Starting Schema Watcher..." && bun --watch ../db/src/schema.ts run src/typescript-cli.ts ../db/src/schema.ts ../db/src/generated.ts' Enter

# Set pane titles
tmux select-pane -t 0 -T "Frontend"
tmux select-pane -t 1 -T "Backend" 
tmux select-pane -t 2 -T "Schema"

# Focus on frontend pane initially
tmux select-pane -t 0

# Attach to session
echo "🎯 Starting development environment..."
echo "Frontend: http://localhost:3002"
echo "Backend: http://localhost:3002 (API)"
echo ""
echo "Press Ctrl+B then Q to show pane numbers"
echo "Press Ctrl+B then arrow keys to switch panes"
echo "Press Ctrl+B then D to detach (keeps running)"
echo ""

tmux attach-session -t $SESSION_NAME