#!/bin/bash

set -e

echo "🚀 Starting Genwrite Frontend Deployment (Git-based)..."

PROJECT_NAME="Genwrite-Frontend"
DOMAIN="app.genwrite.co"
DEPLOY_DIR="/var/www/$PROJECT_NAME"
GIT_BRANCH="main"  # Change if your branch is different

# --------------------------
# 1. Pull latest code from Git
# --------------------------
echo "🔄 Pulling latest code..."
git fetch origin
git checkout $GIT_BRANCH
git pull origin $GIT_BRANCH

# --------------------------
# 2. Prepare deployment directory
# --------------------------
echo "🧹 Cleaning previous deployment..."
sudo rm -rf "$DEPLOY_DIR"
sudo mkdir -p "$DEPLOY_DIR"

echo "📂 Copying dist to $DEPLOY_DIR..."
sudo cp -r dist/* "$DEPLOY_DIR"

# --------------------------
# 3. Setup NGINX (if needed)
# --------------------------
NGINX_CONF="/etc/nginx/sites-available/genwrite"

if [ ! -f "$NGINX_CONF" ]; then
  echo "⚙️ Creating new NGINX config for $DOMAIN..."
  sudo tee "$NGINX_CONF" > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    root $DEPLOY_DIR;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }
}
EOF

  sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
  sudo rm -f /etc/nginx/sites-enabled/default
  echo "🔁 Reloading NGINX..."
  sudo nginx -t && sudo systemctl reload nginx
else
  echo "✅ NGINX config for $DOMAIN already exists. Skipping..."
fi

# --------------------------
# 4. Setup SSL with Certbot (if not already)
# --------------------------
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
if [ ! -d "$CERT_DIR" ]; then
  echo "🔐 Running Certbot for $DOMAIN..."
  sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" --redirect
else
  echo "✅ SSL cert for $DOMAIN already exists. Skipping Certbot."
fi

# --------------------------
# 5. Done
# --------------------------
echo "✅ Frontend deployed successfully!"
echo "🌐 Visit: https://$DOMAIN/"
