#!/usr/bin/env bash
# ==============================================================================
# NHIT Visual Lab (vlab.nhit.in) — Fast Zero-Downtime Deployment Script
# ==============================================================================
set -euo pipefail

echo "🚀 [1/4] Fetching latest changes from master..."
git fetch origin master
git reset --hard origin/master

echo "🐳 [2/4] Rebuilding and launching production container..."
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

echo "🧪 [3/4] Running health check..."
sleep 5
curl -f http://127.0.0.1:8080/api/health || {
    echo "❌ Healthcheck failed! Checking logs..."
    docker compose -f docker-compose.prod.yml logs --tail 50
    exit 1
}

echo "🧹 [4/4] Pruning unused docker images..."
docker image prune -f

echo "✅ NHIT Visual Lab (vlab.nhit.in) successfully updated!"
