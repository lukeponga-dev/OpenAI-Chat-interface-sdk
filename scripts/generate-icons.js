const sharp = require("sharp")
const fs = require("fs")
const path = require("path")

const generateIcons = async () => {
  try {
    // Ensure the public directory exists
    const publicDir = path.join(process.cwd(), "public")
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }

    // Create SVG icon
    const width = 512
    const height = 512
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#000000"/>
        <text x="50%" y="50%" font-family="Arial" font-size="200" fill="white" text-anchor="middle" dominant-baseline="middle">AI</text>
      </svg>
    `

    const svgBuffer = Buffer.from(svg)

    // Generate icons
    const icons = [
      { size: 512, filename: "icon-512x512.png" },
      { size: 192, filename: "icon-192x192.png" },
    ]

    for (const icon of icons) {
      await sharp(svgBuffer).resize(icon.size, icon.size).png().toFile(path.join(publicDir, icon.filename))
    }

    return "Icons generated successfully"
  } catch (error) {
    throw new Error(`Icon generation failed: ${error.message}`)
  }
}

// Execute the function
generateIcons()
  .then((message) => console.log(message))
  .catch((error) => console.error(error.message))
