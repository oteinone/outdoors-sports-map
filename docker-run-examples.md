# Docker Hub Usage Examples

This document shows how to run the published Docker image from Docker Hub.

## Basic Usage

Pull and run the latest image:
```bash
# Pull the image
docker pull your-username/outdoors-sports-map:latest

# Run the container
docker run -d \
  --name outdoors-sports-map \
  -p 8080:3001 \
  --restart unless-stopped \
  your-username/outdoors-sports-map:latest
```

Access the application at: http://localhost:8080

## With Custom API Key

If you have your own Digitransit API key:
```bash
docker run -d \
  --name outdoors-sports-map \
  -p 8080:3001 \
  --restart unless-stopped \
  -e REACT_APP_DIGITRANSIT_API_KEY=your-actual-api-key-here \
  your-username/outdoors-sports-map:latest
```

## Using Docker Compose

Create a `docker-compose.yml` file:
```yaml
version: '3.8'

services:
  app:
    image: your-username/outdoors-sports-map:latest
    container_name: outdoors-sports-map
    ports:
      - "8080:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      # Optional: Add your own API key
      # - REACT_APP_DIGITRANSIT_API_KEY=your-key-here
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Then run:
```bash
docker-compose up -d
```

## Environment Variables

The container supports these runtime environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` |
| `PORT` | Backend server port | `3001` |
| `REACT_APP_DIGITRANSIT_API_KEY` | Optional Digitransit API key | Uses public key |

## Health Check

Check if the container is healthy:
```bash
# Check container status
docker ps

# Manual health check
curl http://localhost:8080/health
```

Expected response:
```json
{"status":"OK","timestamp":"2025-01-01T00:00:00.000Z"}
```

## Cache Management

Access cache management endpoints:
```bash
# View cache statistics
curl http://localhost:8080/api/cache/stats

# Clear all cache
curl -X POST http://localhost:8080/api/cache/clear

# Clear specific cache pattern
curl -X POST "http://localhost:8080/api/cache/clear/pattern?pattern=unit"
```

## Stopping and Cleanup

```bash
# Stop the container
docker stop outdoors-sports-map

# Remove the container
docker rm outdoors-sports-map

# Remove the image (optional)
docker rmi your-username/outdoors-sports-map:latest
```