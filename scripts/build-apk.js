const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("🚀 Starting Android APK build process...")

try {
  // Check if we're in the right directory
  if (!fs.existsSync("capacitor.config.ts")) {
    throw new Error("Please run this script from the project root directory")
  }

  // Install dependencies
  console.log("📦 Installing dependencies...")
  execSync("npm install", { stdio: "inherit" })

  // Create www directory and copy files
  console.log("📁 Preparing web assets...")
  if (!fs.existsSync("www")) {
    fs.mkdirSync("www")
  }

  // Copy HTML file
  if (fs.existsSync("index.html")) {
    fs.copyFileSync("index.html", "www/index.html")
  }

  // Add Android platform if it doesn't exist
  if (!fs.existsSync("android")) {
    console.log("🤖 Adding Android platform...")
    execSync("npx cap add android", { stdio: "inherit" })
  }

  // Sync with native project
  console.log("🔄 Syncing with native project...")
  execSync("npx cap sync", { stdio: "inherit" })

  console.log("✅ Build process completed successfully!")
  console.log("\n📱 To generate the APK:")
  console.log("1. Run: npx cap open android")
  console.log("2. In Android Studio, go to Build > Build Bundle(s) / APK(s) > Build APK(s)")
  console.log("3. The APK will be in: android/app/build/outputs/apk/debug/")
  console.log("\n🔧 Or run directly on device:")
  console.log("npx cap run android")
} catch (error) {
  console.error("❌ Build failed:", error.message)
  process.exit(1)
}
