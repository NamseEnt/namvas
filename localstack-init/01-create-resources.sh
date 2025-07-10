#!/usr/bin/env bash

echo "Creating S3 bucket..."
awslocal s3 mb s3://namvas-local || echo "Bucket may already exist"

echo "Setting up S3 bucket CORS configuration..."
awslocal s3api put-bucket-cors --bucket namvas-local --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}'

echo "Creating DynamoDB table..."
awslocal dynamodb create-table \
  --table-name main \
  --key-schema \
    AttributeName='$p',KeyType=HASH \
    AttributeName='$s',KeyType=RANGE \
  --attribute-definitions \
    AttributeName='$p',AttributeType=S \
    AttributeName='$s',AttributeType=S \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1 || echo "Table may already exist"

echo "Creating SQS queues..."
awslocal sqs create-queue \
  --queue-name main-queue \
  --region us-east-1 || echo "Main queue may already exist"

awslocal sqs create-queue \
  --queue-name main-dlq \
  --region us-east-1 || echo "Main DLQ may already exist"

echo "LocalStack resources created successfully!"