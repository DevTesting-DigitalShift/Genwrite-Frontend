#!/bin/sh
# =============================================================================
# GenWrite Frontend - Docker Entrypoint Script
# =============================================================================
# This script runs when the container starts
# It can be used for runtime configuration if needed
# =============================================================================

set -e

echo "🚀 GenWrite Frontend Container Starting..."
echo "📅 $(date)"

# If using Docker secrets, you can read them here
# Note: For Vite apps, env vars are baked in at build time
# This is mainly for logging/debugging purposes

if [ -f /run/secrets/vite_api_url ]; then
    echo "✅ Docker secrets detected"
fi

# Verify the build output exists
if [ -d /usr/share/nginx/html ]; then
    echo "✅ Static files found"
    FILE_COUNT=$(find /usr/share/nginx/html -type f | wc -l)
    echo "📁 Total files: $FILE_COUNT"
else
    echo "❌ Error: Static files not found!"
    exit 1
fi

# Check if index.html exists
if [ -f /usr/share/nginx/html/index.html ]; then
    echo "✅ index.html found"
else
    echo "❌ Error: index.html not found!"
    exit 1
fi

echo "🎉 Container ready to serve!"
echo "================================================"
