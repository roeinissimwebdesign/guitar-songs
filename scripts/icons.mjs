// Regenerates the PNG app icons from public/icon.svg (iOS home screen needs PNG).
// Run with: npm run icons
import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const svg = readFileSync(new URL('../public/icon.svg', import.meta.url))

for (const size of [192, 512]) {
  await sharp(svg, { density: 400 })
    .resize(size, size)
    .png()
    .toFile(new URL(`../public/icon-${size}.png`, import.meta.url).pathname)
  console.log(`icon-${size}.png`)
}
