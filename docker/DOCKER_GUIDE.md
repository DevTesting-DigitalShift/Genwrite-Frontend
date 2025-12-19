# GenWrite Frontend - Docker Containerization Guide

This comprehensive guide will help you containerize the GenWrite Frontend application using Docker
with Docker Secrets for secure environment variable management.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installing Docker](#installing-docker)
3. [Project Files Overview](#project-files-overview)
4. [Understanding Environment Variables](#understanding-environment-variables)
5. [Building the Docker Image](#building-the-docker-image)
6. [Running the Container](#running-the-container)
7. [Docker Compose Setup](#docker-compose-setup)
8. [Docker Secrets (For Docker Swarm)](#docker-secrets-for-docker-swarm)
9. [Production Deployment](#production-deployment)
10. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

Before you begin, ensure you have:

- A Linux-based system (Ubuntu/Debian recommended)
- `sudo` access on your machine
- At least 4GB of free RAM
- At least 10GB of free disk space

---

## 🐳 Installing Docker

### Step 1: Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Required Dependencies

```bash
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
```

### Step 3: Add Docker's Official GPG Key

```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

### Step 4: Set Up the Docker Repository

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### Step 5: Install Docker Engine

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### Step 6: Add Your User to the Docker Group (Optional but Recommended)

This allows you to run Docker commands without `sudo`:

```bash
sudo usermod -aG docker $USER
```

**⚠️ Important:** Log out and log back in for this change to take effect.

### Step 7: Verify Docker Installation

```bash
docker --version
docker compose version
```

You should see version information for both commands.

### Step 8: Test Docker

```bash
docker run hello-world
```

If successful, you'll see a "Hello from Docker!" message.

---

## 📁 Project Files Overview

After running the setup, you'll have these Docker-related files:

```
GenWrite-Frontend/
├── Dockerfile              # Multi-stage build for production
├── Dockerfile.dev          # Development Dockerfile with hot reload
├── docker-compose.yml      # Production compose file
├── docker-compose.dev.yml  # Development compose file
├── .dockerignore           # Files to exclude from Docker build
├── nginx.conf              # Nginx configuration for serving the app
├── .env.example            # Example environment variables template
└── docker/
    └── entrypoint.sh       # Container startup script
```

---

## 🔐 Understanding Environment Variables

### Vite Environment Variables

Vite uses the `VITE_` prefix for environment variables that are exposed to the frontend:

```bash
VITE_API_URL=https://api.yourbackend.com
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-key
```

### How It Works

1. **Build Time:** Environment variables prefixed with `VITE_` are embedded during the build process
2. **Runtime:** Since this is a static frontend, variables are baked into the JavaScript bundle
3. **Docker Secrets:** We use a build-time injection approach for secrets

---

## 🏗️ Building the Docker Image

### Option 1: Simple Build (Development)

```bash
# Navigate to your project directory
cd /home/avinash/Desktop/GenWrite/GenWrite-Frontend

# Build the image
docker build -t genwrite-frontend:dev -f Dockerfile.dev .
```

### Option 2: Production Build with Build Args

```bash
# Build with environment variables as build arguments
docker build \
  --build-arg VITE_API_URL="https://api.yourbackend.com" \
  --build-arg VITE_GOOGLE_CLIENT_ID="your-client-id" \
  --build-arg VITE_STRIPE_PUBLIC_KEY="pk_live_xxxxx" \
  -t genwrite-frontend:latest .
```

### Option 3: Using an Environment File

Create a `.env.docker` file (not committed to git):

```bash
# .env.docker
VITE_API_URL=https://api.yourbackend.com
VITE_GOOGLE_CLIENT_ID=your-client-id
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
```

Build using the env file:

```bash
# Read env file and pass as build args
docker build \
  $(cat .env.docker | sed 's/^/--build-arg /' | tr '\n' ' ') \
  -t genwrite-frontend:latest .
```

---

## 🚀 Running the Container

### Basic Run

```bash
# Run the container
docker run -d \
  --name genwrite-frontend \
  -p 80:80 \
  genwrite-frontend:latest
```

### With Custom Port

```bash
docker run -d \
  --name genwrite-frontend \
  -p 3000:80 \
  genwrite-frontend:latest
```

### View Logs

```bash
docker logs -f genwrite-frontend
```

### Stop the Container

```bash
docker stop genwrite-frontend
docker rm genwrite-frontend
```

---

## 🐙 Docker Compose Setup

### Production (docker-compose.yml)

```bash
# Start in production mode
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

### Development with Hot Reload (docker-compose.dev.yml)

```bash
# Start in development mode
docker compose -f docker-compose.dev.yml up

# This mounts your source code and enables hot reload
```

---

## 🔒 Docker Secrets (For Docker Swarm)

Docker Secrets provide a secure way to manage sensitive data. They work in Docker Swarm mode.

### Step 1: Initialize Docker Swarm

```bash
docker swarm init
```

### Step 2: Create Secrets

```bash
# Create secrets from values
echo "https://api.yourbackend.com" | docker secret create vite_api_url -
echo "your-google-client-id" | docker secret create vite_google_client_id -
echo "pk_live_xxxxx" | docker secret create vite_stripe_public_key -
```

Or from files:

```bash
# Create secrets from files
docker secret create vite_api_url ./secrets/api_url.txt
docker secret create vite_google_client_id ./secrets/google_client_id.txt
```

### Step 3: List Secrets

```bash
docker secret ls
```

### Step 4: Deploy with Secrets

```bash
# Deploy the stack with secrets
docker stack deploy -c docker-compose.secrets.yml genwrite
```

### Step 5: Check Service Status

```bash
docker service ls
docker service logs genwrite_frontend
```

---

## 🌐 Production Deployment

### Building for Production

```bash
# 1. Create your production environment file
cp .env.example .env.production

# 2. Edit with your production values
nano .env.production

# 3. Build the production image
docker build \
  $(cat .env.production | grep -v '^#' | sed 's/^/--build-arg /' | tr '\n' ' ') \
  -t genwrite-frontend:production .

# 4. Tag for your registry (example with Docker Hub)
docker tag genwrite-frontend:production yourusername/genwrite-frontend:v1.0.13

# 5. Push to registry
docker push yourusername/genwrite-frontend:v1.0.13
```

### Deploying to a Server

```bash
# On your production server
# 1. Pull the image
docker pull yourusername/genwrite-frontend:v1.0.13

# 2. Run the container
docker run -d \
  --name genwrite-frontend \
  -p 80:80 \
  --restart unless-stopped \
  yourusername/genwrite-frontend:v1.0.13
```

---

## 🐞 Troubleshooting

### Common Issues

#### 1. "Permission denied" when running Docker

```bash
# Add yourself to the docker group
sudo usermod -aG docker $USER
# Then log out and log back in
```

#### 2. Port already in use

```bash
# Find what's using the port
sudo lsof -i :80

# Kill the process or use a different port
docker run -d -p 8080:80 genwrite-frontend:latest
```

#### 3. Build fails with out of memory

```bash
# Increase Docker's memory limit in Docker Desktop
# Or for Linux, check your system memory
free -h
```

#### 4. Environment variables not working

```bash
# Verify build args are being passed
docker build --progress=plain --build-arg VITE_API_URL=test -t test .

# Check the built files
docker run --rm genwrite-frontend:latest cat /usr/share/nginx/html/assets/*.js | grep -o "VITE_"
```

#### 5. Container keeps restarting

```bash
# Check logs for errors
docker logs genwrite-frontend

# Check container status
docker inspect genwrite-frontend
```

### Useful Commands

```bash
# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove all unused data
docker system prune -a

# View Docker disk usage
docker system df

# Enter running container
docker exec -it genwrite-frontend sh
```

---

## 📚 Quick Reference

| Command                       | Description             |
| ----------------------------- | ----------------------- |
| `docker build -t name .`      | Build an image          |
| `docker run -d -p 80:80 name` | Run a container         |
| `docker ps`                   | List running containers |
| `docker ps -a`                | List all containers     |
| `docker logs name`            | View container logs     |
| `docker stop name`            | Stop a container        |
| `docker rm name`              | Remove a container      |
| `docker images`               | List images             |
| `docker rmi name`             | Remove an image         |
| `docker exec -it name sh`     | Enter a container       |
| `docker compose up -d`        | Start with compose      |
| `docker compose down`         | Stop with compose       |

---

## 🎉 Next Steps

1. Set up CI/CD pipeline (GitHub Actions, GitLab CI, etc.)
2. Configure HTTPS with Let's Encrypt
3. Set up container monitoring (Prometheus, Grafana)
4. Implement health checks
5. Configure log aggregation

---

_Generated on: 2025-12-14_
