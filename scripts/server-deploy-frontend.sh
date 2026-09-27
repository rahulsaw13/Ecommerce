#!/bin/bash
# Deploy ecommerce frontend by building on the server.
# Run from Windows Bash: bash scripts/server-deploy-frontend.sh
# Avoids uploading 692MB build — uploads only source + env, builds remotely.

set -e

SERVER="root@72.61.242.55"
SSH_KEY="$HOME/.ssh/server_72_61_242_55"
REPO_URL="https://github.com/rahulsaw13/Ecommerce.git"
BRANCH="rahulsaw"
REMOTE_SRC="/root/ecommerce-source"
REMOTE_SERVE="/var/www/ecommerce"
ENV_FILE="$(dirname "$0")/../.env.production"

SSH="ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER"

echo "==> Uploading .env.production to server..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$ENV_FILE" "$SERVER:$REMOTE_SRC/.env.production.tmp"

echo "==> Setting up source on server..."
$SSH bash -s <<REMOTE
set -e

# Clone on first run, pull on subsequent runs
if [ ! -d "$REMOTE_SRC/.git" ]; then
  echo "  Cloning repo..."
  git clone --branch $BRANCH $REPO_URL $REMOTE_SRC
else
  echo "  Pulling latest..."
  cd $REMOTE_SRC
  git fetch origin
  git checkout $BRANCH
  git reset --hard origin/$BRANCH
fi

cd $REMOTE_SRC

# Place env file
mv .env.production.tmp .env.production

echo "  Installing dependencies..."
npm ci --prefer-offline --no-audit --no-fund --legacy-peer-deps 2>&1 | tail -3

echo "  Building..."
npm run build:prod 2>&1 | tail -10

echo "  Deploying to nginx root..."
rsync -a --delete build/ $REMOTE_SERVE/

echo "  Done. Verifying..."
ls -lh $REMOTE_SERVE/index.html
REMOTE

echo ""
echo "Deploy complete: https://srirammart-dev.dukaansarthi.com"
