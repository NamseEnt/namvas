#!/bin/bash

export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_REGION=us-east-1

TABLE_NAME="main"

echo "=== Scanning table: $TABLE_NAME ==="
aws dynamodb scan --table-name "$TABLE_NAME" --endpoint-url http://localhost:4566 --max-items 100