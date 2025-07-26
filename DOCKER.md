# Docker Setup for Outdoors Sports Map

This document explains how to run the Outdoors Sports Map application using Docker in both development and production environments.

## Overview

The application uses a multi-stage Dockerfile that supports:
- **Production**: Single container with backend serving both API and frontend
- **Development**: Separate containers for frontend and backend with hot reloading

## Quick Start

### Production (Default)
```bash
# Build and run production container
docker-compose up --build

# Application available at http://localhost:8080
```

### Development
```bash
# Run development environment with separate containers
docker-compose -f docker-compose.dev.yml up --build

# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Required for production build
REACT_APP_API_URL=/api
REACT_APP_DIGITRANSIT_API_URL=https://api.digitransit.fi/geocoding/v1
REACT_APP_DIGITRANSIT_API_KEY=your-key-here
REACT_APP_APP_NAME=outdoors-sports-map

# Optional notification settings
REACT_APP_SITE_WIDE_NOTIFICATION_ENABLED=false
REACT_APP_SITE_WIDE_NOTIFICATION_TITLE_FI=
REACT_APP_SITE_WIDE_NOTIFICATION_FI=

# Docker settings
DOCKER_TARGET=production
PORT=8080
```

### Docker Targets

The Dockerfile supports multiple build targets:

| Target | Use Case | Description |
|--------|----------|-------------|
| `production` | Production deployment | Backend serves built frontend |
| `development` | Local development | Both services with hot reloading |
| `frontend-builder` | CI/CD | Builds frontend only |
| `backend-base` | CI/CD | Backend with production deps |

## Development Workflow

### Option 1: Separate Services (Recommended)
```bash
# Start backend and frontend in separate containers
docker-compose -f docker-compose.dev.yml up

# Hot reloading enabled for both services
# Backend: http://localhost:3001/api
# Frontend: http://localhost:3000
```

### Option 2: Single Development Container
```bash
# Build development image
docker build --target development -t outdoors-sports-map:dev .

# Run with volume mounts for hot reloading
docker run -it --rm \
  -p 3000:3000 -p 3001:3001 \
  -v "$(pwd):/app" \
  -v "/app/frontend/node_modules" \
  -v "/app/backend/node_modules" \
  outdoors-sports-map:dev
```

## Production Deployment

### Simple Deployment
```bash
# Build production image
docker build -t outdoors-sports-map:latest .

# Run production container
docker run -d \
  --name outdoors-sports-map \
  -p 8080:3001 \
  --restart unless-stopped \
  outdoors-sports-map:latest
```

### With Environment Variables
```bash
# Build with build args
docker build \
  --build-arg REACT_APP_API_URL=/api \
  --build-arg REACT_APP_DIGITRANSIT_API_KEY=your-key \
  -t outdoors-sports-map:latest .

# Run with runtime environment
docker run -d \
  --name outdoors-sports-map \
  -p 8080:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  --restart unless-stopped \
  outdoors-sports-map:latest
```

### Using Docker Compose (Recommended)
```bash
# Production deployment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Health Checks

The production container includes health checks:

```bash
# Check container health
docker ps

# Manual health check
curl http://localhost:8080/health
```

Expected response:
```json
{"status":"OK","timestamp":"2025-01-01T00:00:00.000Z"}
```

## Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   # Check what's using the ports
   lsof -i :3000
   lsof -i :3001
   lsof -i :8080
   ```

2. **Permission issues** (Linux/macOS):
   ```bash
   # Fix ownership of files created by Docker
   sudo chown -R $USER:$USER .
   
   # If you get EACCES errors during npm install in container:
   # This is fixed in the Dockerfile with proper USER switching
   # Rebuild the image: docker-compose build --no-cache
   ```

3. **Node modules issues**:
   ```bash
   # Remove and rebuild containers
   docker-compose down
   docker system prune -f
   docker-compose up --build
   ```

4. **Memory issues**:
   ```bash
   # Increase Docker memory limit to 4GB+
   # Or build with fewer parallel processes
   docker build --build-arg NODE_OPTIONS="--max-old-space-size=2048" .
   ```

### Development Tips

1. **Faster rebuilds**:
   ```bash
   # Use .dockerignore to exclude unnecessary files
   echo "node_modules\n.git\n*.log" > .dockerignore
   ```

2. **Debug container**:
   ```bash
   # Enter running container
   docker exec -it outdoors-sports-map bash
   
   # Run development container with shell
   docker run -it --rm outdoors-sports-map:dev bash
   ```

3. **View logs**:
   ```bash
   # Follow all logs
   docker-compose logs -f
   
   # Follow specific service
   docker-compose -f docker-compose.dev.yml logs -f frontend
   ```

## Architecture

### Production Container
```
┌─────────────────────────────────────┐
│  Production Container (Port 3001)   │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │  Express Backend                │ │
│  │  • API routes (/api/*)          │ │
│  │  • Static file serving          │ │
│  │  • Health checks                │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │  Built React Frontend          │ │
│  │  • Served as static files      │ │
│  │  • Client-side routing         │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Development Containers
```
┌─────────────────────┐    ┌─────────────────────┐
│  Frontend Container │    │  Backend Container  │
│  (Port 3000)        │    │  (Port 3001)        │
│                     │    │                     │
│  ┌─────────────────┐│    │ ┌─────────────────┐ │
│  │ React Dev Server││    │ │ Express Server  │ │
│  │ • Hot reloading ││    │ │ • API routes    │ │
│  │ • Live updates  ││    │ │ • Live restart  │ │
│  └─────────────────┘│    │ └─────────────────┘ │
└─────────────────────┘    └─────────────────────┘
```

## CI/CD Integration

### GitHub Actions Example
```yaml
# .github/workflows/docker.yml
name: Docker Build
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: |
          docker build \
            --build-arg REACT_APP_API_URL=${{ secrets.API_URL }} \
            --build-arg REACT_APP_DIGITRANSIT_API_KEY=${{ secrets.DIGITRANSIT_KEY }} \
            -t outdoors-sports-map:${{ github.sha }} .
```

### Multi-stage Build for CI
```bash
# Build and extract frontend build artifacts
docker build --target frontend-builder --output build .

# Build backend image
docker build --target backend-base -t backend:latest .
```