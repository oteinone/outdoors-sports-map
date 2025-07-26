#!/bin/bash

set -e

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for a service to be ready
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local max_attempts=30
    local attempt=1

    echo "Waiting for $service_name to be ready at $host:$port..."
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z "$host" "$port" 2>/dev/null; then
            echo "$service_name is ready!"
            return 0
        fi
        echo "Attempt $attempt/$max_attempts: $service_name not ready yet, waiting..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "Warning: $service_name at $host:$port did not become ready within expected time"
    return 1
}

# Determine what to run based on environment and working directory
if [[ "$DEV_MODE" = "1" ]]; then
    echo "=== Development Mode ==="
    
    # Check current working directory to determine service
    current_dir=$(basename "$(pwd)")
    
    if [[ "$current_dir" = "backend" ]] || [[ "$(pwd)" = *"/backend" ]]; then
        echo "Starting backend development server..."
        cd /app/backend
        
        # Install dependencies if node_modules doesn't exist
        if [ ! -d "node_modules" ]; then
            echo "Installing backend dependencies..."
            npm install
        fi
        
        # Start backend with development settings
        exec npm run dev
        
    elif [[ "$current_dir" = "frontend" ]] || [[ "$(pwd)" = *"/frontend" ]]; then
        echo "Starting frontend development server..."
        cd /app/frontend
        
        # Install dependencies if node_modules doesn't exist
        if [ ! -d "node_modules" ]; then
            echo "Installing frontend dependencies..."
            if [ -f yarn.lock ]; then
                yarn install
            else
                npm install
            fi
        fi
        
        # Wait for backend to be ready (if running in separate container)
        if [[ -n "$BACKEND_HOST" ]]; then
            wait_for_service "${BACKEND_HOST:-localhost}" "${BACKEND_PORT:-3001}" "Backend API"
        fi
        
        # Start frontend development server
        if [ -f yarn.lock ]; then
            exec yarn start
        else
            exec npm start
        fi
    else
        echo "Starting both frontend and backend in development mode..."
        cd /app
        
        # Install all dependencies if needed
        if [ ! -d "frontend/node_modules" ] || [ ! -d "backend/node_modules" ]; then
            echo "Installing all dependencies..."
            npm run install:all
        fi
        
        # Start both services concurrently
        exec npm run dev
    fi
    
else
    echo "=== Production Mode ==="
    
    # Production mode - backend serves the built frontend
    cd /app/backend
    
    echo "Starting production server..."
    echo "Backend API available at: http://localhost:${PORT:-3001}/api"
    echo "Frontend served at: http://localhost:${PORT:-3001}/"
    echo "Health check at: http://localhost:${PORT:-3001}/health"
    
    # Start the backend server (which serves frontend in production)
    exec node server.js
fi