#!/usr/bin/env bash

echo "Uploading ImageMagick binaries to local S3..."

# Wait for LocalStack to be ready
echo "Waiting for LocalStack to be ready..."
sleep 5

# Check if binary files exist
if [ ! -f "../im/imagemagick-arm64.tar.zst" ]; then
    echo "⚠️  imagemagick-arm64.tar.zst not found. Please run './build-imagemagick.sh' in the im directory first."
    exit 1
fi

if [ ! -f "../im/imagemagick-x64.tar.zst" ]; then
    echo "⚠️  imagemagick-x64.tar.zst not found. Please run './build-imagemagick.sh' in the im directory first."
    exit 1
fi

# Upload ARM64 binary
echo "📦 Uploading imagemagick-arm64.tar.zst..."
awslocal s3 cp ../im/imagemagick-arm64.tar.zst s3://namvas-binary-assets-local/imagemagick-arm64.tar.zst \
    --content-type "application/zstd" || echo "Failed to upload ARM64 binary"

# Upload x64 binary
echo "📦 Uploading imagemagick-x64.tar.zst..."
awslocal s3 cp ../im/imagemagick-x64.tar.zst s3://namvas-binary-assets-local/imagemagick-x64.tar.zst \
    --content-type "application/zstd" || echo "Failed to upload x64 binary"

echo "✅ ImageMagick binaries uploaded successfully!"

# Verify uploads
echo "📋 Verifying uploads..."
awslocal s3 ls s3://namvas-binary-assets-local/