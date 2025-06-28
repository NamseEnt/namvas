#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# PID tracking
DOCKER_PID=""
EMULATOR_PID=""

# Function to cleanup and exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down development environment...${NC}"
    
    # Kill lambda emulator if running
    if [ -n "$EMULATOR_PID" ] && kill -0 "$EMULATOR_PID" 2>/dev/null; then
        echo -e "${YELLOW}Stopping Lambda Emulator...${NC}"
        kill "$EMULATOR_PID"
        wait "$EMULATOR_PID" 2>/dev/null
    fi
    
    # Stop docker compose
    echo -e "${YELLOW}Stopping Docker services...${NC}"
    docker-compose down
    
    echo -e "${GREEN}Development environment stopped.${NC}"
    exit 0
}

# Set trap for cleanup on script termination
trap cleanup SIGINT SIGTERM

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}docker-compose is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${YELLOW}Docker daemon is not running. Starting Docker Desktop...${NC}"
    open -a Docker
    echo -e "${YELLOW}Waiting for Docker to start...${NC}"
    while ! docker info &> /dev/null; do
        sleep 2
        echo -e "${YELLOW}Still waiting for Docker...${NC}"
    done
    echo -e "${GREEN}Docker is now running!${NC}"
fi

# Check if port 3002 is in use
if lsof -ti:3002 &> /dev/null; then
    echo -e "${YELLOW}Port 3002 is in use. Killing existing process...${NC}"
    kill $(lsof -ti:3002) 2>/dev/null || true
    sleep 1
fi

echo -e "${GREEN}Starting development environment...${NC}"

# Start docker-compose services in background
echo -e "${YELLOW}Starting Docker services (LocalStack S3 & DynamoDB)...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 5

echo -e "${GREEN}Development environment started!${NC}"
echo -e "${YELLOW}Services:${NC}"
echo -e "  - LocalStack S3 & DynamoDB: http://localhost:4566"
echo -e "  - Lambda Emulator: http://localhost:3002"
echo ""
echo -e "${YELLOW}Starting Lambda Emulator...${NC}"
echo -e "${RED}Press Ctrl+C to stop all services and exit${NC}"
echo ""

# Start lambda emulator in foreground and capture its PID
cd "$(dirname "$0")/local-lambda-emulator"
exec bun run dev