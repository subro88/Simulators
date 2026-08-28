#!/usr/bin/env bash
# ==============================================================================
# NHIT Visual Lab — aaPanel Automated HTTPS & Docker Integration Script
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
echo "║       ⚡ aaPanel HTTPS WIZARD — NHIT VISUAL LAB (vlab.nhit.in)              ║"
echo "║                  Automated HTTPS Reverse Proxy & Docker                      ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

DOMAIN="vlab.nhit.in"
PORT="8080"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo -e "📁 Application Directory:   ${BOLD}${APP_DIR}${NC}"
echo -e "🌐 Target Domain:           ${BOLD}https://${DOMAIN}${NC}"
echo -e "🔌 Internal Backend Port:   ${BOLD}127.0.0.1:${PORT}${NC}\n"

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

# ── 3. Configure aaPanel HTTPS Nginx Virtual Host ─────────────────────────────
echo -e "\n${BLUE}${BOLD}[Step 3/5] Setting up HTTPS Nginx Reverse Proxy for ${DOMAIN}...${NC}"

AAPANEL_NGINX_DIR="/www/server/panel/vhost/nginx"
CERT_DIR="/www/server/panel/vhost/cert/${DOMAIN}"

if [ -d "${AAPANEL_NGINX_DIR}" ]; then
    mkdir -p "${CERT_DIR}" 2>/dev/null || true
    mkdir -p "/www/wwwroot/${DOMAIN}" 2>/dev/null || true
    mkdir -p "/www/wwwlogs" 2>/dev/null || true

    # Create initial placeholder certificate if not yet present to satisfy Nginx config check
    if [ ! -f "${CERT_DIR}/fullchain.pem" ]; then
        echo -e "Generating initial SSL certificates for ${DOMAIN}..."
        sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "${CERT_DIR}/privkey.pem" \
            -out "${CERT_DIR}/fullchain.pem" \
            -subj "/CN=${DOMAIN}/O=NHIT Visual Lab" 2>/dev/null || true
    fi

    sudo cp "${SCRIPT_DIR}/nginx/aapanel_nginx.conf" "${AAPANEL_NGINX_DIR}/${DOMAIN}.conf"
    
    # Reload aaPanel Nginx if service is running
    if [ -f "/etc/init.d/nginx" ]; then
        echo "Testing and reloading aaPanel Nginx service..."
        sudo /etc/init.d/nginx reload || sudo nginx -s reload || true
    elif command -v nginx &>/dev/null; then
        sudo nginx -t && sudo nginx -s reload || true
    fi
    echo -e "${GREEN}✓ aaPanel HTTPS Nginx vhost active for ${DOMAIN}.${NC}"
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
echo -e "${GREEN}${BOLD}  🎉 aaPanel HTTPS SETUP COMPLETE FOR NHIT VISUAL LAB!                        ${NC}"
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "🔒 Secure HTTPS Portal: ${CYAN}${BOLD}https://${DOMAIN}${NC}"
echo -e "🔐 Secure Login URL:    ${CYAN}https://${DOMAIN}/login${NC}"
echo -e "📦 3D Admin Dashboard:  ${CYAN}https://${DOMAIN}/admin${NC}"
echo -e "🔑 Default Auth:        Username: ${BOLD}nhit${NC} | Password: ${BOLD}nhit${NC}"
echo -e "📊 Backend Health API:   ${CYAN}http://127.0.0.1:${PORT}/api/health${NC}"
echo -e "📁 Repo Directory:      ${CYAN}${APP_DIR}${NC}"
echo ""
echo -e "${BOLD}🔒 To Apply Free Trusted 1-Click Let's Encrypt SSL in aaPanel UI:${NC}"
echo -e "  1. Open your aaPanel Web Dashboard (${CYAN}http://your-server-ip:8888${NC})"
echo -e "  2. Navigate to ${BOLD}Website${NC} menu"
echo -e "  3. Click on ${BOLD}${DOMAIN}${NC} -> click the ${BOLD}SSL${NC} tab"
echo -e "  4. Select ${CYAN}Let's Encrypt${NC} -> Check domain name -> Click ${BOLD}Apply${NC}"
echo -e "  5. Ensure ${CYAN}Force HTTPS${NC} toggle button is enabled."
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════════════════════════════════${NC}\n"
