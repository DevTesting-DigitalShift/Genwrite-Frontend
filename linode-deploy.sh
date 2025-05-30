#!/bin/bash

set -e

echo "🚀 Starting Genwrite Frontend Deployment..."

PROJECT_NAME="Genwrite-Frontend"
REPO_DIR=$(pwd)
BUILD_DIR="dist"  # Change this to `build` if using Create React App

# --------------------------
# 1. Install packages
# --------------------------
echo "📦 Installing required packages..."
sudo apt update && sudo apt install -y curl git nginx

# --------------------------
# 2. Install NVM & Node LTS
# --------------------------
if ! command -v nvm &> /dev/null; then
  echo "📦 Installing NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts
nvm alias default lts/*

# --------------------------
# 3. Install dependencies & build
# --------------------------
echo "📦 Installing frontend dependencies..."
npm install

echo "⚙️ Building frontend..."
npm run build

# --------------------------
# 4. Move build to /var/www
# --------------------------
DEPLOY_DIR="/var/www/$PROJECT_NAME"

echo "📂 Deploying to $DEPLOY_DIR..."
sudo mkdir -p "$DEPLOY_DIR"
sudo cp -r "$BUILD_DIR"/* "$DEPLOY_DIR"

# --------------------------
# 5. Create SSL cert (if not already)
# --------------------------
SSL_CERT="/etc/ssl/certs/genwrite-selfsigned.crt"
SSL_KEY="/etc/ssl/private/genwrite-selfsigned.key"
PUBLIC_IP=$(curl -s https://api.ipify.org)

if [ ! -f "$SSL_CERT" ]; then
  echo "🔐 Generating SSL for $PUBLIC_IP..."
  cat > openssl-ip.cnf <<EOF
[req]
distinguished_name=req_distinguished_name
x509_extensions=v3_req
prompt=no

[req_distinguished_name]
CN=$PUBLIC_IP

[v3_req]
subjectAltName=@alt_names

[alt_names]
IP.1=$PUBLIC_IP
EOF

  sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_KEY" \
    -out "$SSL_CERT" \
    -config openssl-ip.cnf \
    -extensions v3_req

  rm openssl-ip.cnf
fi

# --------------------------
# 6. Nginx config
# --------------------------
NGINX_CONF="/etc/nginx/sites-available/genwrite"

sudo tee "$NGINX_CONF" > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name _;

    ssl_certificate $SSL_CERT;
    ssl_certificate_key $SSL_KEY;
    include /etc/nginx/snippets/ssl-params.conf;

    root $DEPLOY_DIR;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location / {
        try_files \$uri /index.html;
    }
}
EOF

# Enable config
sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# --------------------------
# 7. Restart Nginx
# --------------------------
echo "🔁 Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Frontend Deployment Complete!"
echo "🌐 Open: https://$PUBLIC_IP/"
