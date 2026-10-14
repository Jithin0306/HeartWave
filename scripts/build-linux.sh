#!/usr/bin/env bash
# HeartWave Linux Packaging Script
set -e

echo "============================================="
echo " Building HeartWave for Linux (.AppImage / .deb)"
echo "============================================="

# Ensure Rust is in PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Check & Install Linux prerequisites if needed
if command -v apt-get &> /dev/null; then
    echo "Checking required libraries..."
    sudo apt-get update -qq
    sudo apt-get install -y -qq \
        libwebkit2gtk-4.1-dev \
        build-essential \
        curl \
        wget \
        file \
        libxdo-dev \
        libssl-dev \
        libayatana-appindicator3-dev \
        librsvg2-dev
fi

# Build Frontend
echo "Building Web Frontend..."
npm run build:renderer

# Build Tauri Linux Bundle
echo "Building Tauri Linux Bundles..."
npx tauri build --bundles appimage,deb

echo "Linux build completed! Output located in src-tauri/target/release/bundle/appimage/ and deb/"
