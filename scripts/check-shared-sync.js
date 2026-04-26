#!/usr/bin/env node
// Checks that shared pure-JS utilities are identical between web (src/) and mobile (mobile/src/)
import { readFileSync, existsSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// Only track files that are truly identical (same language, same content).
// formatUtils is excluded: mobile version has TypeScript types, web is plain JS.
const SHARED = [
  ['src/utils/travelStats.js', 'mobile/src/utils/travelStats.js'],
]

let ok = true
for (const [webPath, mobilePath] of SHARED) {
  const web = join(root, webPath)
  const mob = join(root, mobilePath)
  if (!existsSync(web)) { console.error(`MISSING web: ${webPath}`); ok = false; continue }
  if (!existsSync(mob)) { console.error(`MISSING mobile: ${mobilePath}`); ok = false; continue }
  const webContent = readFileSync(web, 'utf8').replace(/\r\n/g, '\n').trim()
  const mobContent = readFileSync(mob, 'utf8').replace(/\r\n/g, '\n').trim()
  if (webContent !== mobContent) {
    console.error(`OUT OF SYNC: ${webPath} vs ${mobilePath}`)
    ok = false
  } else {
    console.log(`OK: ${webPath}`)
  }
}

if (!ok) { console.error('\nFix: update both copies to match.'); process.exit(1) }
console.log('\nAll shared files in sync.')
