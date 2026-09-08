#!/usr/bin/env bash
# ==============================================================================
# NHIT Visual Lab — Fast Production Re-Deploy Script
# Run this on your server anytime you want to quickly pull latest changes
# ==============================================================================
set -euo pipefail

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${APP_DIR}"

echo -e "${CYAN}${BOLD}⚡ Updating NHIT Visual Lab Production Deployment...${NC}"

echo -e "\n${BOLD}[1/4] Pulling latest code from GitHub...${NC}"
git fetch origin master
git reset --hard origin/master

# Check for explicit flags
FORCE_PROD=false
for arg in "$@"; do
    if [ "$arg" = "--prod" ] || [ "$arg" = "-p" ] || [ "$arg" = "--standard" ]; then
        FORCE_PROD=true
        break
    fi
done

DEPLOY_SUCCESS=false

# Attempt Zero-Downtime Blue-Green first (unless --prod is explicitly requested)
if [ "$FORCE_PROD" = false ] && [ -f "${SCRIPT_DIR}/zero_downtime_deploy.sh" ]; then
    echo -e "${CYAN}Executing zero-downtime deployment engine...${NC}"
    if bash "${SCRIPT_DIR}/zero_downtime_deploy.sh" "$@"; then
        DEPLOY_SUCCESS=true
        exit 0
    else
        echo -e "\n${YELLOW}⚠️ Blue-Green deployment did not complete. Initiating automatic fallback to standard production container swap on port 8080...${NC}"
    fi
fi

# ── Standard Production Container Swap (port 8080) ──────────────────────────
echo -e "\n${BOLD}[2/4] Building image in background before container swap...${NC}"
echo -e "${YELLOW}⚡ Live traffic continues 100% uninterrupted during image compilation.${NC}"
docker compose -f docker-compose.prod.yml build

echo -e "\n${BOLD}[3/4] Seamlessly launching updated production container...${NC}"
docker compose -f docker-compose.prod.yml up -d --no-build --remove-orphans

echo -e "\n${BOLD}[4/4] Verifying production health check...${NC}"
HEALTH_OK=false
for i in $(seq 1 20); do
    if curl -s -f --noproxy "*" -m 3 http://127.0.0.1:8080/api/health > /dev/null 2>&1 || \
       curl -s -f --noproxy "*" -m 3 http://localhost:8080/api/health > /dev/null 2>&1 || \
       docker exec vlab-simulators-prod curl -s -f http://localhost:8080/api/health > /dev/null 2>&1; then
        HEALTH_OK=true
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

if [ "$HEALTH_OK" = true ]; then
    echo -e "${GREEN}${BOLD}✓ Deployment Successful & Healthy on https://vlab.nhit.in (port 8080)!${NC}"
else
    echo -e "${YELLOW}⚠️ Container is starting up. Container logs:${NC}"
    docker compose -f docker-compose.prod.yml logs --tail 25
fi

echo -e "\n${BOLD}[Maintenance] Cleaning up unused Docker images...${NC}"
docker image prune -f > /dev/null 2>&1 || true

echo -e "\n${GREEN}${BOLD}🎉 Production is live and up to date!${NC}\n"
