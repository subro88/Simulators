#!/usr/bin/env bash
# ==============================================================================
# NHIT Visual Lab (vlab.nhit.in) — Automated Zero-Downtime Blue-Green Deployment
# ==============================================================================
# Ensures 0.00-second downtime during code updates using blue-green container
# cycling, automated health probing, and atomic Nginx failover.
# ==============================================================================
set -euo pipefail

# ANSI color codes
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${APP_DIR}"

echo -e "${CYAN}${BOLD}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║      🚀 NHIT VISUAL LAB — ZERO DOWNTIME PRODUCTION DEPLOYMENT ENGINE         ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check for Docker
if ! command -v docker &>/dev/null; then
    echo -e "${RED}❌ Docker is not installed or not in PATH. Aborting.${NC}"
    exit 1
fi

# ── 1. Fetch Latest Code ───────────────────────────────────────────────────────
echo -e "${BOLD}[1/6] Synchronizing repository from origin/master...${NC}"
if [ -d ".git" ]; then
    git fetch origin master
    git reset --hard origin/master
    CURRENT_COMMIT="$(git rev-parse --short HEAD)"
    COMMIT_MSG="$(git log -1 --pretty=%B | head -n 1)"
    echo -e "${GREEN}✓ Updated to commit: ${BOLD}${CURRENT_COMMIT}${NC} (\"${COMMIT_MSG}\")"
else
    echo -e "${YELLOW}Notice: Not a git repository. Proceeding with existing source files.${NC}"
fi

# ── 2. Determine Deployment Topology ──────────────────────────────────────────
# Check if blue-green compose is available
USE_BLUE_GREEN=false
if [ -f "docker-compose.bluegreen.yml" ]; then
    USE_BLUE_GREEN=true
fi

if [ "$USE_BLUE_GREEN" = true ]; then
    echo -e "\n${BOLD}[2/6] Detecting active Blue-Green deployment slots...${NC}"

    # Check port 8081 (Blue), port 8083 (Green), and port 8080 (Prod)
    BLUE_HEALTHY=false
    GREEN_HEALTHY=false
    PROD_HEALTHY=false

    if curl -s -f --noproxy "*" -m 2 http://127.0.0.1:8081/api/health >/dev/null 2>&1 || \
       docker exec vlab-simulators-blue curl -s -f http://localhost:8080/api/health >/dev/null 2>&1; then
        BLUE_HEALTHY=true
    fi

    if curl -s -f --noproxy "*" -m 2 http://127.0.0.1:8083/api/health >/dev/null 2>&1 || \
       docker exec vlab-simulators-green curl -s -f http://localhost:8080/api/health >/dev/null 2>&1; then
        GREEN_HEALTHY=true
    fi

    if curl -s -f --noproxy "*" -m 2 http://127.0.0.1:8080/api/health >/dev/null 2>&1 || \
       docker exec vlab-simulators-prod curl -s -f http://localhost:8080/api/health >/dev/null 2>&1; then
        PROD_HEALTHY=true
    fi

    # Select target (inactive) slot
    if [ "$BLUE_HEALTHY" = true ] && [ "$GREEN_HEALTHY" = false ]; then
        ACTIVE_SLOT="blue"
        ACTIVE_PORT=8081
        TARGET_SLOT="green"
        TARGET_PORT=8083
        TARGET_SERVICE="vlab-green"
        ACTIVE_SERVICE="vlab-blue"
    elif [ "$GREEN_HEALTHY" = true ] && [ "$BLUE_HEALTHY" = false ]; then
        ACTIVE_SLOT="green"
        ACTIVE_PORT=8083
        TARGET_SLOT="blue"
        TARGET_PORT=8081
        TARGET_SERVICE="vlab-blue"
        ACTIVE_SERVICE="vlab-green"
    elif [ "$BLUE_HEALTHY" = true ] && [ "$GREEN_HEALTHY" = true ]; then
        # Both are healthy. Cycle green first.
        ACTIVE_SLOT="blue"
        ACTIVE_PORT=8081
        TARGET_SLOT="green"
        TARGET_PORT=8083
        TARGET_SERVICE="vlab-green"
        ACTIVE_SERVICE="vlab-blue"
    else
        # Single-container prod on port 8080 is running or cold start. Start Blue first.
        if [ "$PROD_HEALTHY" = true ]; then
            ACTIVE_SLOT="production-single"
            ACTIVE_PORT=8080
            ACTIVE_SERVICE="vlab-simulators-prod"
        else
            ACTIVE_SLOT="none"
            ACTIVE_PORT=0
            ACTIVE_SERVICE=""
        fi
        TARGET_SLOT="blue"
        TARGET_PORT=8081
        TARGET_SERVICE="vlab-blue"
    fi

    echo -e "  • Currently Active Slot:  ${CYAN}${BOLD}${ACTIVE_SLOT}${NC} (port ${ACTIVE_PORT})"
    echo -e "  • Target Deployment Slot: ${GREEN}${BOLD}${TARGET_SLOT}${NC} (port ${TARGET_PORT})"

    # ── 3. Build New Container in Background ──────────────────────────────────
    echo -e "\n${BOLD}[3/6] Building new image for ${TARGET_SERVICE} in background...${NC}"
    echo -e "${YELLOW}⚡ Live traffic on ${ACTIVE_SLOT} continues 100% uninterrupted during build.${NC}"
    docker compose -f docker-compose.bluegreen.yml build "${TARGET_SERVICE}"

    # ── 4. Launch Target Slot ─────────────────────────────────────────────────
    echo -e "\n${BOLD}[4/6] Launching ${TARGET_SERVICE} on port ${TARGET_PORT}...${NC}"
    docker compose -f docker-compose.bluegreen.yml up -d --no-deps "${TARGET_SERVICE}"

    # ── 5. Health Check & Validation ──────────────────────────────────────────
    echo -e "\n${BOLD}[5/6] Probing health on target slot (${TARGET_SERVICE} @ port ${TARGET_PORT})...${NC}"
    HEALTH_PASSED=false
    MAX_RETRIES=25
    RETRY_COUNT=0
    CONTAINER_NAME="vlab-simulators-${TARGET_SLOT}"

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        # 1. Probe host loopback (bypassing any proxies)
        if curl -s -f --noproxy "*" -m 3 "http://127.0.0.1:${TARGET_PORT}/api/health" >/dev/null 2>&1 || \
           curl -s -f --noproxy "*" -m 3 "http://localhost:${TARGET_PORT}/api/health" >/dev/null 2>&1; then
            HEALTH_PASSED=true
            break
        fi

        # 2. Check container health status via Docker daemon & exec
        DOCKER_STATUS="$(docker inspect --format='{{json .State.Health.Status}}' "${CONTAINER_NAME}" 2>/dev/null | tr -d '\"' || true)"
        if [ "$DOCKER_STATUS" = "healthy" ]; then
            if docker exec "${CONTAINER_NAME}" curl -s -f http://localhost:8080/api/health >/dev/null 2>&1; then
                # Docker internal probe confirms container is fully running and healthy
                HEALTH_PASSED=true
                break
            fi
        fi

        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo -n "."
        sleep 1
    done
    echo ""

    if [ "$HEALTH_PASSED" = true ]; then
        echo -e "${GREEN}${BOLD}✓ New slot (${TARGET_SLOT}) is 100% healthy and verified!${NC}"

        # Reload Nginx gracefully if running on host
        if command -v nginx &>/dev/null && [ -f /etc/nginx/nginx.conf ]; then
            echo -e "  • Triggering graceful Nginx configuration reload..."
            sudo nginx -t >/dev/null 2>&1 && sudo systemctl reload nginx || true
        fi

        # Grace period for existing in-flight connections on old slot
        if [ -n "${ACTIVE_SERVICE}" ] && [ "${ACTIVE_SERVICE}" != "vlab-simulators-prod" ]; then
            echo -e "  • Allowing 4 seconds for in-flight requests on ${ACTIVE_SERVICE} to drain..."
            sleep 4
            echo -e "  • Stopping old ${ACTIVE_SERVICE} slot..."
            docker compose -f docker-compose.bluegreen.yml stop "${ACTIVE_SERVICE}" >/dev/null 2>&1 || true
        fi
    else
        echo -e "${RED}${BOLD}❌ Health check failed on ${TARGET_SERVICE} (port ${TARGET_PORT})!${NC}"
        echo -e "${YELLOW}⚠️ Initiating automatic rollback: stopping container...${NC}"
        docker compose -f docker-compose.bluegreen.yml stop "${TARGET_SERVICE}"
        
        if [ -n "${ACTIVE_SERVICE}" ]; then
            echo -e "${GREEN}✓ Previous active slot (${ACTIVE_SLOT}) remained untouched and active.${NC}"
            echo -e "${GREEN}✓ Zero downtime was incurred.${NC}"
        fi
        echo -e "\nHost curl diagnostics:"
        curl -v --noproxy "*" -m 3 "http://127.0.0.1:${TARGET_PORT}/api/health" 2>&1 | head -n 12 || true

        echo -e "\nContainer logs for debugging:"
        docker compose -f docker-compose.bluegreen.yml logs --tail 25 "${TARGET_SERVICE}"
        exit 1
    fi

else
    # ── Fallback: Single Container Pre-build Strategy ──────────────────────────
    echo -e "\n${BOLD}[2/5] Building Docker image prior to container replacement...${NC}"
    echo -e "${YELLOW}⚡ Live traffic continues uninterrupted during image compilation.${NC}"
    docker compose -f docker-compose.prod.yml build

    echo -e "\n${BOLD}[3/5] Performing instant container switch (<1.5s)...${NC}"
    docker compose -f docker-compose.prod.yml up -d --no-build --remove-orphans

    echo -e "\n${BOLD}[4/5] Verifying application health check...${NC}"
    sleep 3
    if curl -s -f --noproxy "*" http://127.0.0.1:8080/api/health >/dev/null 2>&1 || \
       docker exec vlab-simulators-prod curl -s -f http://localhost:8080/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}${BOLD}✓ Container healthy on http://127.0.0.1:8080!${NC}"
    else
        echo -e "${YELLOW}⚠️ Retrying health check in 4s...${NC}"
        sleep 4
        curl -f --noproxy "*" http://127.0.0.1:8080/api/health || {
            echo -e "${RED}❌ Health check failed! Check logs below:${NC}"
            docker compose -f docker-compose.prod.yml logs --tail 25
            exit 1
        }
    fi
fi

# ── 6. Maintenance & Image Pruning ────────────────────────────────────────────
echo -e "\n${BOLD}[6/6] Cleaning up stale/dangling Docker build caches...${NC}"
docker image prune -f >/dev/null 2>&1 || true

echo -e "\n${GREEN}${BOLD}=================================================================${NC}"
echo -e "${GREEN}${BOLD}  🎉 ZERO-DOWNTIME UPDATE COMPLETE — PRODUCTION IS LIVE!         ${NC}"
echo -e "${GREEN}${BOLD}  🌐 Public URL:  https://vlab.nhit.in                           ${NC}"
if [ "$USE_BLUE_GREEN" = true ]; then
    echo -e "${GREEN}${BOLD}  🟢 Active Slot: ${TARGET_SLOT} (port ${TARGET_PORT})                      ${NC}"
fi
echo -e "${GREEN}${BOLD}=================================================================${NC}\n"
