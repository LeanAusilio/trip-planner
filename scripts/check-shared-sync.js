#!/usr/bin/env node
// Checks that shared pure-JS utilities are identical between web (src/) and mobile (mobile/src/)
const fs = require('fs')
const path = require('path')
const root = path.resolve(__dirname, '..')

const SHARED = [
  ['src/utils/travelStats.js', 'mobile/src/utils/travelStats.js'],
  ['src/utils/formatUtils.js', 'mobile/src/utils/formatUtils.ts'],
]

let ok = true
for (const [webPath, mobilePath] of SHARED) {
  const web = path.join(root, webPath)
  const mob = path.join(root, mobilePath)
  if (!fs.existsSync(web)) { console.error(`MISSING web: ${webPath}`); ok = false; continue }
  if (!fs.existsSync(mob)) { console.error(`MISSING mobile: ${mobilePath}`); ok = false; continue }
  const webContent = fs.readFileSync(web, 'utf8').replace(/\r\n/g, '\n').trim()
  const mobContent = fs.readFileSync(mob, 'utf8').replace(/\r\n/g, '\n').trim()
  if (webContent !== mobContent) {
    console.error(`OUT OF SYNC: ${webPath} vs ${mobilePath}`)
    ok = false
  } else {
    console.log(`OK: ${webPath}`)
  }
}

if (!ok) { console.error('\nFix: update both copies to match.'); process.exit(1) }
console.log('\nAll shared files in sync.')
