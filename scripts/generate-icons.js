const sharp = require("sharp")
const fs = require("fs")
const path = require("path")

// Ensure the public directory exists
const publicDir = path.join(process.cwd(), "public")
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir)
}

// Create a simple icon with text "AI"
const width = 512
const height = 512
const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#000000"/>
  <text x="50%" y="50%" font-family="Arial" font-size="200" fill="white" text-anchor="middle" dominant-baseline="middle">AI</text>
</svg>
`

// Generate 512x512 icon
sharp(Buffer.from(svg))
  .png()
  .toFile(path.join(publicDir, "icon-512x512.png"), (err) => {
    if (err) {
      console.error("Error generating 512x512 icon:", err)
    } else {
      console.log("Generated 512x512 icon")
    }
  })

// Generate 192x192 icon
sharp(Buffer.from(svg))
  .resize(192, 192)
  .png()
  .toFile(path.join(publicDir, "icon-192x192.png"), (err) => {
    if (err) {
      console.error("Error generating 192x192 icon:", err)
    } else {
      console.log("Generated 192x192 icon")
    }
  })

console.log("Icon generation script executed")
