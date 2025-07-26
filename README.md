# Outdoor Exercise Map

The Outdoor Exercise Map is an open communications channel for checking the condition of outdoor sports facilities in Helsinki, Espoo, Vantaa and Kirkkonummi. The Outdoor Exercise Map helps the inhabitants of the municipality find up-to-date information on the City's outdoor sports services. Currently, the services encompasses the skiing tracks, ice-skating fields, swimming places and other public outdoor services maintained by the cities.

This fork was created because original ulkoliikunta.fi site did 

## Architecture

This is a full-stack application with the following structure:

```
outdoors-sports-map/
├── frontend/          # React TypeScript application
├── backend/           # Node.js Express API proxy with caching
├── package.json       # Root package.json with workspace scripts
└── README.md         # This file
```

### Backend API Proxy

The backend provides a caching layer for the Helsinki ServiceMap APIs to improve reliability and performance:

- **Services API** (`/api/services`) - 24 hour cache
- **Units API** (`/api/units`) - 1 hour cache  
- **Announcements API** (`/api/announcements`) - 1 hour cache

## Development

### Prerequisites

-   Node.js LTS (≥16.0.0)
-   NPM and/or Yarn

### Quick Start

1. **Install dependencies for both frontend and backend:**
   ```bash
   npm run install:all
   ```

2. **Start both development servers:**
   ```bash
   npm run dev
   ```
   
   This runs:
   - Backend API proxy on http://localhost:3001
   - Frontend React app on http://localhost:3000

### Individual Commands

**Frontend only:**
```bash
npm run dev:frontend
# OR
cd frontend && npm start
```

**Backend only:**
```bash
npm run dev:backend  
# OR
cd backend && npm start
```

### Environment Configuration

**For local development:**
```bash
# Frontend environment (already configured for local backend proxy)
cp frontend/.env.example frontend/.env
```

**For Docker builds:**
```bash
# Root environment (controls Docker build args)
# Already created with sensible defaults
# Customize .env file if needed for your deployment
```

## Development with Docker

Install and configure [Docker](https://www.docker.com/).

Build the project:

```
cp .env.example .env
docker-compose build
```

_(you can add `--no-cache` to the command if you don't want to use cache from previous build)_

Start the application:

```
docker-compose up
```

The application is now available at [http://localhost:3000](http://localhost:3000/).

### Starting dockerized production environment

Make sure port `8080` is free.

Pass build-time variables (replace `<VAR_X>` with actual variable name from `.env` file) to docker image and build with:

```
source .env
docker build \
--build-arg <VAR_1>=${<VAR_1>} \
--build-arg <VAR_N>=${<VAR_N>} \
-t outdoors-sports-map .
```

_(you can add `--no-cache` to the command if you don't want to use cache from previous build)_

Start docker container with:

```
docker container run -p 8080:8080 -d outdoors-sports-map
```

_(you can add `--name outdoors-sports-map` to the command for easier referencing)_

The application is now available at [http://localhost](http://localhost/).

## Environments

### Test

Works on my machine.

### Production

Production url: [https://ulkoliikunta-cached.azurewebsites.net](https://ulkoliikunta-cached.azurewebsites.net)

## Attribution

This project is forked from the [City of Helsinki Outdoor Sports Map](https://github.com/City-of-Helsinki/outdoors-sports-map) and includes some architectural changes:

- **Original Project**: City of Helsinki Outdoor Sports Map
- **Original Authors**: Christoffer Niska, Jukka-Pekka Salo, and contributors
- **Fork Maintainer**: Otto Teinonen
- **License**: MIT License

### Changes in This Fork:
- Refactored to monorepo structure with separate frontend/backend
- Added Express backend with API caching and proxy functionality
- Implemented Docker containerization with multi-stage builds
- Enhanced reliability with stale cache fallback strategies

The original application provides outdoor sports facility information for Helsinki, Espoo, Vantaa, and Kirkkonummi municipalities.
