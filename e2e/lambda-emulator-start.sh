#!/bin/bash
set -e

echo "Starting Lambda emulator..."
cd /opt/code/local-lambda-emulator
exec bun run src/server.ts