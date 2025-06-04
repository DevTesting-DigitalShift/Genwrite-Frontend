#!/bin/bash

set -e

echo "🚀 Starting Genwrite Frontend Deployment (Git-based)..."

USEDOMAIN=true
PROJECT_NAME="Genwrite-Frontend"
DEPLOY_DIR="/var/www/$PROJECT_NAME"
GIT_BRANCH="main"

DOMAIN="app.genwrite.co"
PUBLIC_IP=$(curl -s https://api.ipify.org)
SERVER_NAME=$([ "$USEDOMAIN" = true ] && echo "$DOMAIN" || echo "$PUBLIC_IP")

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
# 3. Create SSL Cert
# --------------------------
if [ "$USEDOMAIN" = true ]; then
  echo "⚙️ Will use Certbot with domain: $DOMAIN"
else
  echo "🔐 Generating self-signed SSL for IP: $PUBLIC_IP"
  SSL_CERT="/etc/ssl/certs/genwrite-selfsigned.crt"
  SSL_KEY="/etc/ssl/private/genwrite-selfsigned.key"

  if [ ! -f "$SSL_CERT" ]; then
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
fi

# --------------------------
# 4. Setup NGINX
# --------------------------
NGINX_CONF="/etc/nginx/sites-available/genwrite"

echo "⚙️ Creating NGINX config for $SERVER_NAME"
sudo tee "$NGINX_CONF" > /dev/null <<EOF
server {
    listen 80;
    server_name $SERVER_NAME;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name $SERVER_NAME;

    root $DEPLOY_DIR;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }
EOF

if [ "$USEDOMAIN" = true ]; then
  sudo tee -a "$NGINX_CONF" > /dev/null <<EOF
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
EOF
else
  sudo tee -a "$NGINX_CONF" > /dev/null <<EOF
    ssl_certificate $SSL_CERT;
    ssl_certificate_key $SSL_KEY;
EOF
fi

sudo tee -a "$NGINX_CONF" > /dev/null <<EOF
}
EOF

sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# --------------------------
# 5. Certbot (if domain is used)
# --------------------------
if [ "$USEDOMAIN" = true ]; then
  CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
  if [ ! -d "$CERT_DIR" ]; then
    echo "🔐 Running Certbot for $DOMAIN..."
    sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" --redirect
  else
    echo "✅ SSL cert for $DOMAIN already exists. Skipping Certbot."
  fi
fi

# --------------------------
# 6. Done
# --------------------------
echo "✅ Frontend deployed successfully!"
if [ "$USEDOMAIN" = true ]; then
  echo "🌐 Visit: https://$DOMAIN/"
else
  echo "🌐 Visit: https://$PUBLIC_IP/"
  echo "⚠️ You may see a browser warning due to self-signed cert."
fi
