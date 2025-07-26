#!/bin/bash

# Script to build and publish Docker image to Docker Hub securely
# Usage: ./build-and-publish.sh [docker-hub-username] [tag]

set -e  # Exit on any error

# Configuration
DOCKER_HUB_USERNAME="${1:-your-username}"
IMAGE_NAME="outdoors-sports-map"
TAG="${2:-latest}"
FULL_IMAGE_NAME="${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${TAG}"

echo "🐳 Building and publishing Docker image: ${FULL_IMAGE_NAME}"

# Verify Docker Hub username
if [ "$DOCKER_HUB_USERNAME" = "your-username" ]; then
    echo "❌ Error: Please provide your Docker Hub username"
    echo "Usage: $0 <docker-hub-username> [tag]"
    echo "Example: $0 johndoe latest"
    exit 1
fi

# Check if logged into Docker Hub
if ! docker info | grep -q "Username"; then
    echo "🔐 Please log in to Docker Hub first:"
    echo "docker login"
    exit 1
fi

# Build the image without secrets (uses multi-stage build)
echo "🔨 Building Docker image..."
docker build \
    --target production \
    --build-arg REACT_APP_API_URL=/api \
    --build-arg REACT_APP_DIGITRANSIT_API_URL=https://api.digitransit.fi/geocoding/v1 \
    --build-arg REACT_APP_APP_NAME=outdoors-sports-map \
    --build-arg REACT_APP_SITE_WIDE_NOTIFICATION_ENABLED=false \
    --build-arg GENERATE_SITEMAP=false \
    -t "${FULL_IMAGE_NAME}" \
    .

# Verify the build
echo "📋 Verifying build..."
docker images | grep "${IMAGE_NAME}"

# Push to Docker Hub
echo "📤 Pushing to Docker Hub..."
docker push "${FULL_IMAGE_NAME}"

echo "✅ Successfully published: ${FULL_IMAGE_NAME}"
echo ""
echo "🚀 To run the published image:"
echo "docker run -d -p 8080:3001 --name outdoors-sports-map ${FULL_IMAGE_NAME}"
echo ""
echo "🔧 To run with custom API key:"
echo "docker run -d -p 8080:3001 \\"
echo "  --name outdoors-sports-map \\"
echo "  -e REACT_APP_DIGITRANSIT_API_KEY=your-key-here \\"
echo "  ${FULL_IMAGE_NAME}"