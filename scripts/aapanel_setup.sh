#!/usr/bin/env bash
# ==============================================================================
# NHIT Visual Lab — aaPanel Automated CLI Integration & Setup Script
# ==============================================================================
set -euo pipefail

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

clear
echo -e "${CYAN}${BOLD}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║          ⚡ aaPanel SETUP WIZARD — NHIT VISUAL LAB (vlab.nhit.in)            ║"
echo "║                     Automated Reverse Proxy & Docker                         ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

DOMAIN="vlab.nhit.in"
PORT="8080"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo -e "📁 Application Directory:   ${BOLD}${APP_DIR}${NC}"
echo -e "🌐 Target aaPanel Domain:   ${BOLD}${DOMAIN}${NC}"
echo -e "🔌 Internal Docker Port:    ${BOLD}127.0.0.1:${PORT}${NC}\n"

# ── 1. Verify aaPanel Environment ─────────────────────────────────────────────
echo -e "${BLUE}${BOLD}[Step 1/5] Checking aaPanel Environment...${NC}"

if [ -d "/www/server/panel" ]; then
    echo -e "${GREEN}✓ aaPanel detected at /www/server/panel${NC}"
else
    echo -e "${YELLOW}⚠️ Notice: Standard aaPanel directory /www/server/panel not found.${NC}"
    echo -e "If aaPanel is running under a custom path, the script will configure Docker & Nginx templates."
fi

# ── 2. Check & Install Docker / Docker Compose ─────────────────────────────────
echo -e "\n${BLUE}${BOLD}[Step 2/5] Checking Docker & Docker Compose...${NC}"
if ! command -v docker &>/dev/null; then
    echo -e "🐳 Installing Docker Engine..."
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sudo sh /tmp/get-docker.sh
    rm -f /tmp/get-docker.sh
    echo -e "${GREEN}✓ Docker installed successfully.${NC}"
else
    echo -e "${GREEN}✓ Docker is already installed ($(docker --version)).${NC}"
fi

# ── 3. Configure aaPanel Nginx Virtual Host ───────────────────────────────────
echo -e "\n${BLUE}${BOLD}[Step 3/5] Setting up Nginx Reverse Proxy for ${DOMAIN}...${NC}"

AAPANEL_NGINX_DIR="/www/server/panel/vhost/nginx"
if [ -d "${AAPANEL_NGINX_DIR}" ]; then
    sudo cp "${SCRIPT_DIR}/nginx/aapanel_nginx.conf" "${AAPANEL_NGINX_DIR}/${DOMAIN}.conf"
    mkdir -p "/www/wwwroot/${DOMAIN}" 2>/dev/null || true
    mkdir -p "/www/wwwlogs" 2>/dev/null || true
    
    # Reload aaPanel Nginx if service is running
    if [ -f "/etc/init.d/nginx" ]; then
        echo "Testing and reloading aaPanel Nginx service..."
        sudo /etc/init.d/nginx reload || sudo nginx -s reload || true
    elif command -v nginx &>/dev/null; then
        sudo nginx -t && sudo nginx -s reload || true
    fi
    echo -e "${GREEN}✓ aaPanel Nginx vhost active for ${DOMAIN}.${NC}"
else
    echo -e "${YELLOW}Notice: ${AAPANEL_NGINX_DIR} not present. Use aaPanel GUI (Website -> Add Site -> Reverse Proxy).${NC}"
fi

# ── 4. Build & Launch Docker Production Container ─────────────────────────────
echo -e "\n${BLUE}${BOLD}[Step 4/5] Launching Production Simulation Engine Container...${NC}"
cd "${APP_DIR}"

docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

# ── 5. Health Check & Validation ──────────────────────────────────────────────
echo -e "\n${BLUE}${BOLD}[Step 5/5] Verifying API Health Status...${NC}"
sleep 5

HEALTH_URL="http://127.0.0.1:${PORT}/api/health"
if curl -s -f "${HEALTH_URL}" > /dev/null 2>&1; then
    echo -e "${GREEN}${BOLD}✓ Application is Healthy & Running on 127.0.0.1:${PORT}!${NC}"
else
    echo -e "${YELLOW}⚠️ Container starting up. Checking container logs:${NC}"
    docker compose -f docker-compose.prod.yml logs --tail 25
fi

# ── aaPanel Summary & SSL Guide ───────────────────────────────────────────────
echo -e "\n${GREEN}${BOLD}══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  🎉 aaPanel SETUP COMPLETE FOR NHIT VISUAL LAB!                             ${NC}"
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "🌐 Site URL:            ${CYAN}${BOLD}http://${DOMAIN}${NC} (or https://${DOMAIN})"
echo -e "📊 Backend Health API:   ${CYAN}http://127.0.0.1:${PORT}/api/health${NC}"
echo -e "📁 Repo Directory:      ${CYAN}${APP_DIR}${NC}"
echo ""
echo -e "${BOLD}🔒 To Enable Free 1-Click Let's Encrypt SSL in aaPanel Dashboard:${NC}"
echo -e "  1. Log into your aaPanel Dashboard (${CYAN}http://your-server-ip:8888${NC})"
echo -e "  2. Go to ${BOLD}Website${NC} menu"
echo -e "  3. If not listed, click ${BOLD}Add Site${NC} -> Domain: ${CYAN}${DOMAIN}${NC} -> Type: ${BOLD}Reverse Proxy${NC} -> Target: ${CYAN}http://127.0.0.1:8080${NC}"
echo -e "  4. Click on ${BOLD}${DOMAIN}${NC} in the list -> click ${BOLD}SSL${NC} tab"
echo -e "  5. Select ${CYAN}Let's Encrypt${NC} -> Check domain name -> Click ${BOLD}Apply${NC}"
echo -e "  6. Turn on ${CYAN}Force HTTPS${NC} toggle button."
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════════════════════════════════${NC}\n"
