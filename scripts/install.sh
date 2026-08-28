#!/usr/bin/env bash
# ==============================================================================
# NHIT Visual Lab (vlab.nhit.in) — Interactive First-Time Production Installer
# ==============================================================================
set -euo pipefail

# ANSI Color Codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Determine installation directory (Current repo location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

clear
echo -e "${CYAN}${BOLD}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║          🚀 NHIT VISUAL LAB & SIMULATORS — PRODUCTION INSTALLER             ║"
echo "║                      Interactive Setup Wizard v2.0                           ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "📁 Installing in-place at: ${BOLD}${APP_DIR}${NC}\n"

# ── 1. Interactive Configuration Prompts ──────────────────────────────────────
echo -e "${BLUE}${BOLD}[Step 1/6] Configuration Parameters${NC}"

# Domain prompt
read -r -p "Enter Domain / Subdomain for Visual Lab [default: vlab.nhit.in]: " INPUT_DOMAIN
DOMAIN="${INPUT_DOMAIN:-vlab.nhit.in}"

# Admin Email prompt
read -r -p "Enter Administrator Email (for Let's Encrypt SSL) [default: admin@nhit.in]: " INPUT_EMAIL
ADMIN_EMAIL="${INPUT_EMAIL:-admin@nhit.in}"

# Port prompt & Conflict check
DEFAULT_PORT=8080
while true; do
    read -r -p "Enter internal application port [default: ${DEFAULT_PORT}]: " INPUT_PORT
    PORT="${INPUT_PORT:-$DEFAULT_PORT}"
    
    # Check if port is already in use
    if command -v ss &>/dev/null; then
        PORT_IN_USE=$(ss -tuln | grep -q ":${PORT} " && echo "yes" || echo "no")
    elif command -v netstat &>/dev/null; then
        PORT_IN_USE=$(netstat -tuln | grep -q ":${PORT} " && echo "yes" || echo "no")
    elif command -v lsof &>/dev/null; then
        PORT_IN_USE=$(lsof -i ":${PORT}" &>/dev/null && echo "yes" || echo "no")
    else
        PORT_IN_USE="no"
    fi

    if [ "$PORT_IN_USE" = "yes" ]; then
        echo -e "${YELLOW}⚠️  Port ${PORT} is currently in use by another process.${NC}"
        read -r -p "Do you want to use a different port? (y/n) [default: y]: " CHG_PORT
        CHG_PORT="${CHG_PORT:-y}"
        if [[ "$CHG_PORT" =~ ^[Yy]$ ]]; then
            continue
        else
            echo -e "${YELLOW}Proceeding with port ${PORT} (ensure existing container/process is replaced).${NC}"
            break
        fi
    else
        echo -e "${GREEN}✓ Port ${PORT} is available.${NC}"
        break
    fi
done

# Concurrency workers
NUM_CPUS=$(nproc 2>/dev/null || echo 2)
DEFAULT_WORKERS=$((NUM_CPUS * 2 > 4 ? 4 : NUM_CPUS * 2))
read -r -p "Enter number of Gunicorn Uvicorn workers [default: ${DEFAULT_WORKERS}]: " INPUT_WORKERS
WORKERS="${INPUT_WORKERS:-$DEFAULT_WORKERS}"

echo ""
echo -e "${BOLD}Summary of Settings:${NC}"
echo -e "  • Domain:          ${CYAN}${DOMAIN}${NC}"
echo -e "  • Admin Email:     ${CYAN}${ADMIN_EMAIL}${NC}"
echo -e "  • Internal Port:   ${CYAN}${PORT}${NC}"
echo -e "  • Backend Workers: ${CYAN}${WORKERS}${NC}"
echo -e "  • App Directory:   ${CYAN}${APP_DIR}${NC}"
echo ""

read -r -p "Proceed with installation? (y/n) [default: y]: " CONFIRM
CONFIRM="${CONFIRM:-y}"
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "${RED}Installation aborted by user.${NC}"
    exit 0
fi

# ── 2. System Dependency Checks & Installation ────────────────────────────────
echo -e "\n${BLUE}${BOLD}[Step 2/6] Checking & Installing System Prerequisites...${NC}"

# Check for sudo/root
if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
    echo -e "${YELLOW}Please enter sudo password when prompted.${NC}"
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "🐳 Installing Docker Engine..."
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sudo sh /tmp/get-docker.sh
    sudo usermod -aG docker "$USER" 2>/dev/null || true
    rm -f /tmp/get-docker.sh
    echo -e "${GREEN}✓ Docker installed successfully.${NC}"
else
    echo -e "${GREEN}✓ Docker Engine is already installed ($(docker --version)).${NC}"
fi

# Check Nginx
if ! command -v nginx &> /dev/null; then
    echo -e "🌐 Installing Nginx Web Server..."
    sudo apt-get update && sudo apt-get install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    echo -e "${GREEN}✓ Nginx installed successfully.${NC}"
else
    echo -e "${GREEN}✓ Nginx is already installed.${NC}"
fi

# Check Certbot
if ! command -v certbot &> /dev/null; then
    echo -e "🔒 Installing Certbot for Nginx SSL..."
    sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✓ Certbot installed successfully.${NC}"
else
    echo -e "${GREEN}✓ Certbot is already installed.${NC}"
fi

# ── 3. Generate Nginx VirtualHost Configuration ──────────────────────────────
echo -e "\n${BLUE}${BOLD}[Step 3/6] Configuring Nginx Reverse Proxy for ${DOMAIN}...${NC}"

NGINX_CONF_AVAILABLE="/etc/nginx/sites-available/${DOMAIN}.conf"
NGINX_CONF_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}.conf"

sudo mkdir -p /var/www/certbot

# Create safe initial HTTP-only server block for Certbot challenge
sudo tee "${NGINX_CONF_AVAILABLE}" > /dev/null <<EOF
# Nginx Virtual Host for ${DOMAIN} (Managed by NHIT Visual Lab Installer)

upstream vlab_${PORT}_backend {
    server 127.0.0.1:${PORT} fail_timeout=0;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    # ACME-challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript image/svg+xml model/gltf-binary model/gltf+json;

    client_max_body_size 50M;

    # Root redirect
    location = / {
        return 301 /nhitvisuallab/index.html;
    }

    # Static Assets Caching
    location ~* \.(glb|gltf|svg|png|jpg|jpeg|gif|ico|woff2?|ttf|eot)$ {
        proxy_pass http://vlab_${PORT}_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
    }

    # WebSocket Proxying
    location /ws/ {
        proxy_pass http://vlab_${PORT}_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # General HTTP/API Proxy
    location / {
        proxy_pass http://vlab_${PORT}_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

sudo ln -sf "${NGINX_CONF_AVAILABLE}" "${NGINX_CONF_ENABLED}"

# Test Nginx configuration safely without breaking other sites
echo -e "Testing Nginx configuration syntax..."
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo -e "${GREEN}✓ Nginx configuration active and reloaded.${NC}"
else
    echo -e "${RED}❌ Nginx syntax check failed. Restoring previous state...${NC}"
    sudo rm -f "${NGINX_CONF_ENABLED}"
    exit 1
fi

# ── 4. Obtain Let's Encrypt SSL Certificate ──────────────────────────────────
echo -e "\n${BLUE}${BOLD}[Step 4/6] Acquiring SSL Certificate via Certbot...${NC}"

# Check DNS resolution
SERVER_IP=$(curl -4 -s https://ifconfig.me || curl -4 -s https://api.ipify.org || echo "unknown")
DOMAIN_RESOLVED_IP=$(getent hosts "$DOMAIN" | awk '{ print $1 }' | head -n 1 || echo "unresolved")

if [ "$DOMAIN_RESOLVED_IP" = "$SERVER_IP" ] || [ "$DOMAIN_RESOLVED_IP" != "unresolved" ]; then
    echo -e "DNS check: ${DOMAIN} resolves to ${DOMAIN_RESOLVED_IP} (Server IP: ${SERVER_IP})"
    if sudo certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${ADMIN_EMAIL}" --redirect; then
        echo -e "${GREEN}✓ SSL Certificate successfully issued and configured for https://${DOMAIN}${NC}"
        sudo systemctl reload nginx
    else
        echo -e "${YELLOW}⚠️ Certbot was unable to automatically issue certificate. Running in HTTP mode.${NC}"
        echo -e "${YELLOW}You can re-run: sudo certbot --nginx -d ${DOMAIN} after DNS resolves.${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Notice: ${DOMAIN} DNS (${DOMAIN_RESOLVED_IP}) does not match server public IP (${SERVER_IP}).${NC}"
    echo -e "${YELLOW}Skipping automatic SSL issuance for now. HTTP is active on port 80.${NC}"
    echo -e "${YELLOW}Once your DNS A record propagates, simply run:${NC}"
    echo -e "${CYAN}  sudo certbot --nginx -d ${DOMAIN}${NC}"
fi

# ── 5. Build and Launch Docker Production Containers ──────────────────────────
echo -e "\n${BLUE}${BOLD}[Step 5/6] Building & Starting Docker Production Stack...${NC}"
cd "$APP_DIR"

# Write environment file
cat <<EOF > .env
PORT=${PORT}
WEB_CONCURRENCY=${WORKERS}
LOG_LEVEL=info
DOMAIN=${DOMAIN}
EOF

# Update docker-compose.prod.yml port if needed
sed -i "s/127.0.0.1:[0-9]*:8080/127.0.0.1:${PORT}:8080/g" docker-compose.prod.yml

# Build and start
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

# ── 6. Verification & Healthcheck ─────────────────────────────────────────────
echo -e "\n${BLUE}${BOLD}[Step 6/6] Verifying Application Health Status...${NC}"
echo "Waiting for container initialization..."
sleep 5

HEALTH_CHECK_URL="http://127.0.0.1:${PORT}/api/health"
MAX_RETRIES=6
RETRY_COUNT=0
HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Pinging ${HEALTH_CHECK_URL} (attempt ${RETRY_COUNT}/${MAX_RETRIES})..."
    if curl -s -f "${HEALTH_CHECK_URL}" > /tmp/vlab_health.json 2>/dev/null; then
        HEALTHY=true
        break
    fi
    sleep 3
done

if [ "$HEALTHY" = true ]; then
    echo -e "${GREEN}${BOLD}✓ Application is Healthy & Running!${NC}"
    echo -e "Health response: ${CYAN}$(cat /tmp/vlab_health.json)${NC}"
    rm -f /tmp/vlab_health.json
else
    echo -e "${YELLOW}⚠️ Local healthcheck returned non-200. Showing container logs:${NC}"
    docker compose -f docker-compose.prod.yml logs --tail 30
fi

# ── Final Summary & CI/CD Helper ──────────────────────────────────────────────
echo -e "\n${GREEN}${BOLD}══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  🎉 NHIT VISUAL LAB PRODUCTION INSTALLATION COMPLETE!                        ${NC}"
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "🌐 Web Portal URL:       ${CYAN}${BOLD}https://${DOMAIN}${NC} (or http://${DOMAIN})"
echo -e "📊 API Health Endpoint:  ${CYAN}http://127.0.0.1:${PORT}/api/health${NC}"
echo -e "📁 Installed At:         ${CYAN}${APP_DIR}${NC}"
echo -e "🐳 Container Name:       ${CYAN}vlab-simulators-prod${NC}"
echo -e "🔄 Workers:              ${CYAN}${WORKERS} Gunicorn Uvicorn Workers${NC}"
echo ""
echo -e "${BOLD}📋 GitHub Actions CI/CD Pipeline Configuration:${NC}"
echo -e "To enable automatic updates upon pushing to GitHub, go to:"
echo -e "${CYAN}https://github.com/subro88/Simulators/settings/secrets/actions${NC}"
echo -e "and add these 4 Repository Secrets:"
echo -e "  1. ${BOLD}SSH_HOST${NC}:     ${CYAN}${SERVER_IP}${NC}"
echo -e "  2. ${BOLD}SSH_USER${NC}:     ${CYAN}${USER}${NC}"
echo -e "  3. ${BOLD}SSH_KEY${NC}:      ${CYAN}(Your private SSH key e.g. cat ~/.ssh/id_rsa)${NC}"
echo -e "  4. ${BOLD}SSH_PORT${NC}:     ${CYAN}22${NC}"
echo ""
echo -e "${BOLD}Useful Server Commands:${NC}"
echo -e "  • Check logs:         ${CYAN}docker compose -f docker-compose.prod.yml logs -f${NC}"
echo -e "  • Restart app:        ${CYAN}docker compose -f docker-compose.prod.yml restart${NC}"
echo -e "  • Manual update:      ${CYAN}./scripts/deploy.sh${NC}"
echo -e "  • Test Nginx:         ${CYAN}sudo nginx -t && sudo systemctl reload nginx${NC}"
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════════════════════════════════${NC}\n"
