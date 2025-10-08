#!/bin/bash

# Build script for Envict package
set -e

echo "🧹 Cleaning dist directory..."
npm run clean

echo "🔍 Running linting..."
npm run lint

echo "🔧 Type checking..."
npm run typecheck

echo "🏗️  Building for production..."
npm run build:prod

echo "✅ Build completed successfully!"
echo "📦 Package is ready for publishing"