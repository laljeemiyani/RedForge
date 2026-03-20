# RedForge AI

B2B SaaS platform for automated AI red teaming.

## Architecture

RedForge is built with a microservices architecture:

- **Frontend**: React application for the user interface (runs on port `8080`).
- **Backend API**: Node.js/Express service handling user management, API requests, and job queuing (runs on port `5000`).
- **Engine**: Python/FastAPI service responsible for executing AI red teaming attacks, making external calls, and generating reports (runs on port `8000`).
- **Databases/Cache**: MongoDB (port `27017`) for persistent storage and Redis (port `6379`) for queuing via Bull.

## Prerequisites

- Node.js (v18+)
- Docker and Docker Compose
- Python 3.9+ (if running the engine independently outside of Docker)

## Local Development Setup

Streamlined npm scripts are provided at the root level to manage the development environment.

1. **Install root dependencies**:
   ```bash
   npm install
   ```

2. **Start the complete development environment**:
   ```bash
   npm run dev
   ```
   *This single command starts MongoDB, Redis, the Python Engine, and the Node.js Backend using Docker Compose. It also concurrently runs the React Frontend locally with hot-reloading.*

### Alternative Operations

If you prefer to run the entire stack (including the frontend) directly inside Docker:

```bash
# Build and start all services containerized
npm run docker:build

# Only start all containers (if previously built)
npm run docker:up

# Stop all containers and network
npm run docker:down
```

## Useful Ports

- Frontend UI: `http://localhost:8080`
- Backend API: `http://localhost:5000`
- Python Engine: `http://localhost:8000`
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`
