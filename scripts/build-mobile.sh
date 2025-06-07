#!/bin/bash

echo "🚀 Building AI Chat Mobile App..."

# Check if we're in the right directory
if [ ! -f "capacitor.config.ts" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create www directory and copy files
echo "📁 Preparing web assets..."
mkdir -p www
cp index.html www/
cp -r assets/* www/ 2>/dev/null || true

# Initialize Capacitor if not already done
if [ ! -d "android" ] && [ ! -d "ios" ]; then
    echo "⚡ Initializing Capacitor..."
    npx cap init "AI Chat Mobile" "com.aichat.mobile" --web-dir=www
fi

# Add platforms
echo "📱 Adding mobile platforms..."
if [ ! -d "android" ]; then
    npx cap add android
fi

if [ ! -d "ios" ]; then
    npx cap add ios
fi

# Sync with native projects
echo "🔄 Syncing with native projects..."
npx cap sync

echo "✅ Mobile app build completed!"
echo ""
echo "📱 To build Android APK:"
echo "   npx cap open android"
echo "   Then in Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)"
echo ""
echo "📱 To build iOS app:"
echo "   npx cap open ios"
echo "   Then in Xcode: Product > Archive"
echo ""
echo "🔧 To run on device:"
echo "   npx cap run android"
echo "   npx cap run ios"
