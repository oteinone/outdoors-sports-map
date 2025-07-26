# ===============================================
# Base Node.js image for both frontend and backend
# ===============================================
FROM public.ecr.aws/docker/library/node:22.17.1-bookworm-slim AS nodebase

RUN mkdir /app && chown -R node:node /app
WORKDIR /app

# Offical image has npm log verbosity as info. More info - https://github.com/nodejs/docker-node#verbosity
ENV NPM_CONFIG_LOGLEVEL warn

# Global npm deps in a non-root user directory
ENV NPM_CONFIG_PREFIX=/app/.npm-global
ENV PATH=$PATH:/app/.npm-global/bin

USER node

# ===============================================
# Backend build stage
# ===============================================
FROM nodebase AS backend-base

# Switch to root to create directories, then back to node
USER root
RUN mkdir -p /app/backend && chown -R node:node /app/backend
USER node

WORKDIR /app/backend

# Copy backend package files
COPY --chown=node:node backend/package*.json ./

# Install backend dependencies
RUN npm install --only=production && npm cache clean --force

# Copy backend source code
COPY --chown=node:node backend/ ./

# ===============================================
# Frontend dependency stage
# ===============================================
FROM nodebase AS frontend-deps

# Switch to root to create directories, then back to node
USER root
RUN mkdir -p /app/frontend && chown -R node:node /app/frontend
USER node

WORKDIR /app/frontend

# Copy frontend package files
COPY --chown=node:node frontend/package*.json frontend/*yarn* ./

# Install frontend dependencies and update browserslist
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile && yarn cache clean; else npm install; fi

# ===============================================
# Frontend build stage
# ===============================================
FROM frontend-deps AS frontend-builder

# Build arguments for React app
ARG REACT_APP_API_URL REACT_APP_DIGITRANSIT_API_URL REACT_APP_DIGITRANSIT_API_KEY REACT_APP_APP_NAME REACT_APP_SITE_WIDE_NOTIFICATION_ENABLED REACT_APP_SITE_WIDE_NOTIFICATION_TITLE_FI REACT_APP_SITE_WIDE_NOTIFICATION_TITLE_SV REACT_APP_SITE_WIDE_NOTIFICATION_TITLE_EN REACT_APP_SITE_WIDE_NOTIFICATION_FI REACT_APP_SITE_WIDE_NOTIFICATION_SV REACT_APP_SITE_WIDE_NOTIFICATION_EN GENERATE_SITEMAP

# Copy frontend source code
COPY --chown=node:node frontend/ ./

# Build frontend
RUN if [ -f yarn.lock ]; then yarn build; else npm run build; fi

# ===============================================
# Development stage (both frontend and backend)
# ===============================================
FROM nodebase AS development

# Switch to root to create directories, then back to node
USER root
RUN mkdir -p /app/frontend /app/backend && chown -R node:node /app
USER node

# Copy package files for both
COPY --chown=node:node package*.json ./
COPY --chown=node:node frontend/package*.json frontend/*yarn* ./frontend/
COPY --chown=node:node backend/package*.json ./backend/

WORKDIR /app

# Install all dependencies via workspace
RUN npm install

# Copy source code
COPY --chown=node:node . .

# Copy entrypoint
COPY --chown=node:node docker-entrypoint.sh /entrypoint/docker-entrypoint.sh
RUN chmod +x /entrypoint/docker-entrypoint.sh

ENV DEV_MODE=1
EXPOSE 3000 3001

ENTRYPOINT ["/entrypoint/docker-entrypoint.sh"]

# ===============================================
# Production stage (backend serving frontend)
# ===============================================
FROM backend-base AS production

# Switch to app root to copy frontend build
WORKDIR /app

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder --chown=node:node /app/frontend/build ./frontend/build

# Switch back to backend directory
WORKDIR /app/backend

# Set production environment
ENV NODE_ENV=production

# Expose backend port (serves both API and frontend)
EXPOSE 3001

# Start backend server which serves frontend in production
CMD ["node", "server.js"]