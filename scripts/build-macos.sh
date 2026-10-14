#!/usr/bin/env bash
# HeartWave macOS Packaging Script
set -e

echo "============================================="
echo " Building HeartWave for macOS (.dmg / .app)"
echo "============================================="

# Ensure Rust is in PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Build Frontend
echo "Building Web Frontend..."
npm run build:renderer

# Build Tauri macOS Bundle
echo "Building Tauri macOS Bundles..."
npx tauri build --bundles dmg,app

echo "macOS build completed! Output located in src-tauri/target/release/bundle/dmg/"
