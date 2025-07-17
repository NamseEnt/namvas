#!/usr/bin/env bash

echo "Uploading ImageMagick binaries to local S3..."

# Wait for LocalStack to be ready
echo "Waiting for LocalStack to be ready..."
sleep 5

# Check if binary files exist
if [ ! -f "/binary/magick-arm64" ]; then
    echo "⚠️  magick-arm64 not found. Please run './build-imagemagick.sh' in the binary directory first."
    exit 1
fi

if [ ! -f "/binary/magick-x64" ]; then
    echo "⚠️  magick-x64 not found. Please run './build-imagemagick.sh' in the binary directory first."
    exit 1
fi

# Upload ARM64 binary
echo "📦 Uploading magick-arm64..."
awslocal s3 cp /binary/magick-arm64 s3://namvas-binary-assets-local/magick-arm64 \
    --content-type "application/octet-stream" || echo "Failed to upload ARM64 binary"

# Upload x64 binary
echo "📦 Uploading magick-x64..."
awslocal s3 cp /binary/magick-x64 s3://namvas-binary-assets-local/magick-x64 \
    --content-type "application/octet-stream" || echo "Failed to upload x64 binary"

echo "✅ ImageMagick binaries uploaded successfully!"

# Verify uploads
echo "📋 Verifying uploads..."
awslocal s3 ls s3://namvas-binary-assets-local/