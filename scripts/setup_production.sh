#!/usr/bin/env bash
# ==============================================================================
# NHIT Visual Lab (vlab.nhit.in) — Production Server Setup Script
# Ubuntu 20.04 / 22.04 / 24.04 LTS
# ==============================================================================
set -euo pipefail

echo "================================================================="
echo "  🚀 Starting NHIT Visual Lab Production Setup (vlab.nhit.in)   "
echo "================================================================="

DOMAIN="vlab.nhit.in"
APP_DIR="/var/www/vlab"

# 1. Update system packages
echo "📦 [1/6] Updating APT repositories..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git ufw nginx certbot python3-certbot-nginx

# 2. Install Docker & Docker Compose if not installed
if ! command -v docker &> /dev/null; then
    echo "🐳 [2/6] Installing Docker Engine & Docker Compose Plugin..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker "$USER"
    rm -f get-docker.sh
else
    echo "🐳 [2/6] Docker is already installed."
fi

# 3. Create project directory
echo "📁 [3/6] Setting up project directory at $APP_DIR..."
sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER:$USER" "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
    echo "📥 Cloning repository into $APP_DIR..."
    git clone https://github.com/subro88/Simulators.git "$APP_DIR"
else
    echo "📥 Pulling latest repository updates..."
    cd "$APP_DIR" && git pull origin master
fi

cd "$APP_DIR"

# 4. Configure Host-level Nginx Virtual Host
echo "🌐 [4/6] Configuring Nginx reverse proxy for $DOMAIN..."
sudo cp scripts/nginx/vlab.nhit.in.conf /etc/nginx/sites-available/vlab.nhit.in.conf
sudo ln -sf /etc/nginx/sites-available/vlab.nhit.in.conf /etc/nginx/sites-enabled/vlab.nhit.in.conf

# Temporarily test config before SSL issuance
sudo nginx -t

# 5. Acquire Let's Encrypt SSL Certificate
echo "🔒 [5/6] Requesting Let's Encrypt SSL Certificate for $DOMAIN..."
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m admin@nhit.in --redirect || {
    echo "⚠️ Certbot could not automatically issue certificate. Ensure DNS A record for $DOMAIN points to this server IP."
}

# Reload Nginx
sudo systemctl reload nginx

# 6. Build and start production container
echo "🏗️ [6/6] Building and starting Docker container with Gunicorn workers..."
docker compose -f docker-compose.prod.yml up -d --build

echo "================================================================="
echo "  ✅ NHIT Visual Lab is live and running at https://$DOMAIN     "
echo "  📊 Healthcheck: http://127.0.0.1:8080/api/health              "
echo "================================================================="
