# Publishing to Docker Hub - Security Guide

This guide shows how to securely publish your Outdoor Sports Map container to Docker Hub without exposing API keys.

## 🔒 Security Strategy

**The container image published to Docker Hub will NOT contain:**
- Your personal API keys
- Any secrets from `.env` files
- Development credentials

**The container WILL contain:**
- The application code
- A public Digitransit API key (rate-limited)
- Default configuration suitable for public use

## 📋 Prerequisites

1. **Docker Hub Account**: Sign up at https://hub.docker.com
2. **Docker CLI**: Ensure Docker is installed and running
3. **Login to Docker Hub**:
   ```bash
   docker login
   ```

## 🚀 Publishing Process

### Method 1: Using the Build Script (Recommended)

```bash
# Make the script executable (if not already)
chmod +x ./build-and-publish.sh

# Build and publish (replace 'yourusername' with your Docker Hub username)
./build-and-publish.sh yourusername latest
```

### Method 2: Manual Build and Push

```bash
# Build the image with public defaults
docker build \
  --target production \
  --build-arg REACT_APP_API_URL=/api \
  --build-arg REACT_APP_DIGITRANSIT_API_URL=https://api.digitransit.fi/geocoding/v1 \
  --build-arg REACT_APP_APP_NAME=outdoors-sports-map \
  --build-arg REACT_APP_SITE_WIDE_NOTIFICATION_ENABLED=false \
  --build-arg GENERATE_SITEMAP=false \
  -t yourusername/outdoors-sports-map:latest \
  .

# Push to Docker Hub
docker push yourusername/outdoors-sports-map:latest
```

## ✅ What Gets Built

The published image includes:
- ✅ Application code (frontend + backend)
- ✅ Public Digitransit API key (e576e5cfe5ff429086d2e23b371276f0)
- ✅ Production optimizations
- ✅ Caching system for Helsinki APIs
- ❌ **NO private API keys**
- ❌ **NO development secrets**

## 🏃‍♂️ Running the Published Image

Users can run your published image with:

```bash
# Basic usage with public API key
docker run -d -p 8080:3001 --name outdoors-sports-map yourusername/outdoors-sports-map:latest

# With custom API key (if users have their own)
docker run -d -p 8080:3001 \
  --name outdoors-sports-map \
  -e REACT_APP_DIGITRANSIT_API_KEY=their-custom-key \
  yourusername/outdoors-sports-map:latest
```

## 🔍 Security Verification

Before publishing, verify no secrets are included:

```bash
# Build locally and inspect
docker build -t test-build .
docker run --rm test-build cat /app/frontend/.env 2>/dev/null || echo "✅ No .env found in image"

# Check environment variables in image
docker run --rm test-build printenv | grep -E "(API_KEY|SECRET|PASSWORD)" || echo "✅ No sensitive env vars"
```

## 📊 Image Information

After publishing, users can see:
- **Image size**: ~500MB-1GB (Node.js app with dependencies)
- **Exposed port**: 3001 (mapped to host port 8080)
- **Architecture**: linux/amd64
- **Base image**: node:22.11.0-bookworm-slim

## 🏷️ Tagging Strategy

Consider using semantic versioning:
```bash
# Tag specific version
./build-and-publish.sh yourusername v2.6.0

# Tag as latest (default)
./build-and-publish.sh yourusername latest

# Tag multiple versions
docker tag yourusername/outdoors-sports-map:latest yourusername/outdoors-sports-map:v2.6.0
docker push yourusername/outdoors-sports-map:v2.6.0
```

## 📝 Docker Hub README

Consider adding this to your Docker Hub repository description:

```markdown
# Outdoor Sports Map

A React-based application for checking outdoor sports facilities in Helsinki metropolitan area.

## Quick Start
```bash
docker run -d -p 8080:3001 --name outdoors-sports-map yourusername/outdoors-sports-map:latest
```

Access at: http://localhost:8080

## Features
- Real-time facility conditions
- Multi-language support (Finnish, Swedish, English)
- Cached API responses for reliability
- Mobile-responsive design

## Environment Variables
- `REACT_APP_DIGITRANSIT_API_KEY`: Optional Digitransit API key
- `NODE_ENV`: Node environment (default: production)
- `PORT`: Backend port (default: 3001)
```

## 🔄 Updating the Published Image

To update your published image:
1. Make changes to your code
2. Commit changes to git
3. Run the build script again with a new tag:
   ```bash
   ./build-and-publish.sh yourusername v2.6.1
   ```

## 🚨 Security Reminders

- ✅ **Never** commit API keys to git
- ✅ **Always** use `.dockerignore` to exclude `.env` files
- ✅ **Verify** no secrets are in the final image
- ✅ **Use** public/demo API keys for published images
- ✅ **Let users** provide their own keys via environment variables