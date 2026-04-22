import sharp from 'sharp'
import { readFileSync } from 'fs'
import { mkdirSync } from 'fs'

mkdirSync('public', { recursive: true })
mkdirSync('scripts', { recursive: true })

const svg = readFileSync('public/wayfar-logo-light.svg')

await sharp(svg).resize(192, 192).png().toFile('public/icon-192.png')
console.log('✓ icon-192.png')

await sharp(svg).resize(512, 512).png().toFile('public/icon-512.png')
console.log('✓ icon-512.png')

await sharp(svg).resize(180, 180).png().toFile('public/apple-touch-icon.png')
console.log('✓ apple-touch-icon.png')

console.log('All icons generated.')
