#!/bin/bash

echo "Building AI Chat Android APK..."

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Install Capacitor dependencies
echo "Installing Capacitor..."
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/splash-screen

# Initialize Capacitor if not already done
if [ ! -f "capacitor.config.ts" ]; then
    echo "Initializing Capacitor..."
    npx cap init "AI Chat App" "com.aichat.app" --web-dir=out
fi

# Build the Next.js app
echo "Building Next.js app..."
npm run build

# Export static files
echo "Exporting static files..."
npx next export

# Add Android platform if not already added
if [ ! -d "android" ]; then
    echo "Adding Android platform..."
    npx cap add android
fi

# Copy web assets to native project
echo "Copying web assets..."
npx cap copy

# Sync Capacitor
echo "Syncing Capacitor..."
npx cap sync

echo "Android project is ready!"
echo "To build the APK:"
echo "1. Open Android Studio: npx cap open android"
echo "2. In Android Studio, go to Build > Build Bundle(s) / APK(s) > Build APK(s)"
echo "3. The APK will be generated in android/app/build/outputs/apk/debug/"

# Optionally open Android Studio
read -p "Do you want to open Android Studio now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx cap open android
fi
