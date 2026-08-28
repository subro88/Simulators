#!/usr/bin/env bash
# ==============================================================================
# NHIT Visual Lab — CloudPanel One-Click Integration & Setup Script
# ==============================================================================
set -euo pipefail

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

clear
echo -e "${CYAN}${BOLD}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║          ☁️  CLOUDPANEL SETUP WIZARD — NHIT VISUAL LAB (vlab.nhit.in)        ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

DOMAIN="vlab.nhit.in"
PORT="8080"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo -e "📁 Application Directory: ${BOLD}${APP_DIR}${NC}"
echo -e "🌐 Target Domain:         ${BOLD}${DOMAIN}${NC}"
echo -e "🔌 Reverse Proxy Port:     ${BOLD}127.0.0.1:${PORT}${NC}\n"

# ── 1. Check if CloudPanel CLI (clpctl) is present ───────────────────────────
if command -v clpctl &>/dev/null; then
    echo -e "${GREEN}✓ CloudPanel CLI (clpctl) detected.${NC}"
    
    # Prompt site user
    read -r -p "Enter CloudPanel Site User (e.g. vlab-user or clp-user) [default: vlab]: " SITE_USER
    SITE_USER="${SITE_USER:-vlab}"
    
    echo -e "\n${BLUE}${BOLD}[1/4] Adding Reverse Proxy Site via clpctl...${NC}"
    clpctl site:add:reverse-proxy \
        --domainName="${DOMAIN}" \
        --siteUser="${SITE_USER}" \
        --reverseProxyUrl="http://127.0.0.1:${PORT}" || {
        echo -e "${YELLOW}Notice: Site might already exist in CloudPanel. Proceeding...${NC}"
    }

    echo -e "\n${BLUE}${BOLD}[2/4] Requesting Let's Encrypt SSL Certificate via clpctl...${NC}"
    clpctl lets-encrypt:install:certificate --domainName="${DOMAIN}" || {
        echo -e "${YELLOW}Notice: If DNS is not yet pointed, install SSL from CloudPanel UI once DNS resolves.${NC}"
    }
else
    echo -e "${YELLOW}Notice: Running on server without direct clpctl in PATH.${NC}"
    echo -e "You can configure the Reverse Proxy site via CloudPanel Web UI (see instructions below)."
fi

# ── 2. Build & Start Docker Container ─────────────────────────────────────────
echo -e "\n${BLUE}${BOLD}[3/4] Building & Launching Docker Production Container...${NC}"
cd "${APP_DIR}"

if ! command -v docker &>/dev/null; then
    echo -e "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sudo sh /tmp/get-docker.sh
    rm -f /tmp/get-docker.sh
fi

docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

# ── 3. Health Check ───────────────────────────────────────────────────────────
echo -e "\n${BLUE}${BOLD}[4/4] Verifying Application Health...${NC}"
sleep 5
if curl -s -f "http://127.0.0.1:${PORT}/api/health" > /dev/null; then
    echo -e "${GREEN}${BOLD}✓ Application is Healthy & Running on 127.0.0.1:${PORT}${NC}"
else
    echo -e "${YELLOW}⚠️ Checking logs:${NC}"
    docker compose -f docker-compose.prod.yml logs --tail 20
fi

# ── CloudPanel Instructions ───────────────────────────────────────────────────
echo -e "\n${GREEN}${BOLD}══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  🎉 CLOUDPANEL SETUP READY!                                                  ${NC}"
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}If setting up via CloudPanel Web Dashboard:${NC}"
echo -e "  1. Log into ${CYAN}https://your-server-ip:8443${NC}"
echo -e "  2. Click ${BOLD}+ Add Site${NC} -> Select ${CYAN}Create a Reverse Proxy${NC}"
echo -e "  3. Enter Domain Name: ${BOLD}${DOMAIN}${NC}"
echo -e "  4. Enter Reverse Proxy URL: ${BOLD}http://127.0.0.1:${PORT}${NC}"
echo -e "  5. Under the site's ${BOLD}SSL/TLS${NC} tab -> Click ${CYAN}New Let's Encrypt Certificate${NC}"
echo -e "  6. Under the site's ${BOLD}Vhost${NC} tab -> Paste content of ${CYAN}scripts/nginx/cloudpanel_vhost.conf${NC} for WebSocket & Caching support."
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════════════════════════════════${NC}\n"
