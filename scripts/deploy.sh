#!/usr/bin/env bash
# ==============================================================================
# NHIT Visual Lab — Fast Production Re-Deploy Script
# Run this on your server anytime you want to quickly pull latest changes
# ==============================================================================
set -euo pipefail

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${APP_DIR}"

echo -e "${CYAN}${BOLD}⚡ Updating NHIT Visual Lab Production Deployment...${NC}"

echo -e "\n${BOLD}[1/4] Pulling latest code from GitHub...${NC}"
git fetch origin master
git reset --hard origin/master

echo -e "\n${BOLD}[2/4] Rebuilding and launching production container...${NC}"
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

echo -e "\n${BOLD}[3/4] Running health check...${NC}"
sleep 4
if curl -s -f http://127.0.0.1:8080/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}${BOLD}✓ Deployment Successful & Healthy on https://vlab.nhit.in!${NC}"
else
    echo -e "${YELLOW}⚠️ Container starting up. Checking logs:${NC}"
    docker compose -f docker-compose.prod.yml logs --tail 20
fi

echo -e "\n${BOLD}[4/4] Cleaning up unused Docker images...${NC}"
docker image prune -f > /dev/null 2>&1 || true

echo -e "\n${GREEN}${BOLD}🎉 Production is live and up to date!${NC}\n"
