# Outdoor Exercise Map

The Outdoor Exercise Map is an open communications channel for checking the condition of outdoor sports facilities in Helsinki, Espoo, Vantaa and Kirkkonummi. The Outdoor Exercise Map helps the inhabitants of the municipality find up-to-date information on the City's outdoor sports services. Currently, the services encompasses the skiing tracks, ice-skating fields, swimming places and other public outdoor services maintained by the cities.

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

Test environment is done from master branch. The pipeline is triggered with a commit to master branch. Normally the commit is pull request merge. 

Test url: [https://ulkoliikunta.test.hel.ninja](https://ulkoliikunta.test.hel.ninja/).

### Review

Review environment is done from pr to master branch. The review environment url is posted to pull request when it is completed.

### Release (staging&production)

Release pipeline is triggered by tag. Tag should be named like 'release-<version>'. The release pipeline builds and deploys the staging environment by default. The production environment requires manual approval in the pipeline [ulkoliikuntakartta-ui-release](https://dev.azure.com/City-of-Helsinki/ulkoliikuntakartta/_build?definitionId=3123&_a=summary)

> Note! Approval requires 2 manual approval, one for build and one for deploy

Staging url: [https://ulkoliikunta.stage.hel.ninja](https://ulkoliikunta.stage.hel.ninja)

Production url: [https://ulkoliikunta.fi](https://ulkoliikunta.fi)
