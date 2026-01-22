/**
 * ICO生成スクリプト
 * SVGからアルファチャンネル対応のマルチサイズICOを生成
 *
 * 使用方法: node scripts/generate-ico.mjs
 * 前提: pnpm add -D sharp png-to-ico
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const __dirname = dirname(fileURLToPath(import.meta.url))
const resourcesDir = join(__dirname, '..', 'resources')

const SIZES = [16, 24, 32, 48, 64, 128, 256]

async function generateIco() {
  const svgPath = join(resourcesDir, 'icon.svg')
  const icoPath = join(resourcesDir, 'icon.ico')

  const svgBuffer = readFileSync(svgPath)

  console.log('Generating PNG files for each size...')

  const pngBuffers = await Promise.all(
    SIZES.map(async (size) => {
      const pngBuffer = await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({
          compressionLevel: 9
        })
        .toBuffer()
      console.log(`  - ${size}x${size} PNG generated`)
      return pngBuffer
    })
  )

  console.log('Converting to ICO with alpha channel...')

  const icoBuffer = await pngToIco(pngBuffers)
  writeFileSync(icoPath, icoBuffer)

  console.log(`ICO file created: ${icoPath}`)
  console.log('Sizes included:', SIZES.join(', '))
}

generateIco().catch((err) => {
  console.error('Error generating ICO:', err)
  process.exit(1)
})
