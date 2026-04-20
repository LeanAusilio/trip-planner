import { format, differenceInDays } from 'date-fns'
import { APP_URL } from '../lib/constants'

function flagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '📍'
  return [...countryCode.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('')
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

export function shareToWhatsApp(destinations, tripCode) {
  if (!destinations.length) return
  const lines = ['✈️ My Trip — Wayfar', '']
  for (const dest of destinations) {
    const nights = differenceInDays(new Date(dest.departure), new Date(dest.arrival))
    const flag = flagEmoji(dest.countryCode)
    const start = format(new Date(dest.arrival), 'MMM d')
    const end = format(new Date(dest.departure), 'MMM d')
    lines.push(
      `${flag} ${dest.city}, ${dest.country} · ${start}–${end} (${nights} night${nights !== 1 ? 's' : ''})`
    )
  }
  if (tripCode) {
    lines.push('', `🔗 Join this trip — code: ${tripCode}`)
  }
  window.open(
    `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`,
    '_blank',
    'noopener,noreferrer'
  )
}

export function exportTripCard(destinations, tripName) {
  const SIZE = 1080
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, SIZE)
  grad.addColorStop(0, '#f0f9ff')
  grad.addColorStop(1, '#dbeafe')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, SIZE, SIZE)

  // Decorative circle (top right)
  ctx.beginPath()
  ctx.arc(SIZE + 60, -60, 320, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(186,230,255,0.45)'
  ctx.fill()

  // Brand
  ctx.fillStyle = '#0369a1'
  ctx.font = "700 58px 'Geist', system-ui, sans-serif"
  ctx.textAlign = 'left'
  ctx.fillText('wayfar', 80, 115)

  // Trip name
  ctx.fillStyle = '#0f172a'
  ctx.font = "500 50px 'Geist', system-ui, sans-serif"
  const displayName = tripName || 'My Trip'
  ctx.fillText(displayName, 80, 185)

  // Date range
  if (destinations.length > 0) {
    const first = destinations[0].arrival
    const last = destinations[destinations.length - 1].departure
    const totalNights = differenceInDays(new Date(last), new Date(first))
    ctx.fillStyle = '#475569'
    ctx.font = "400 34px 'Geist', system-ui, sans-serif"
    ctx.fillText(
      `${format(new Date(first), 'MMM d')} – ${format(new Date(last), 'MMM d, yyyy')} · ${totalNights} nights`,
      80,
      236
    )
  }

  // Destination grid
  const MARGIN = 80
  const GAP = 22
  const GRID_Y = 288
  const cols = destinations.length <= 4 ? 2 : 3
  const cardW = Math.floor((SIZE - MARGIN * 2 - GAP * (cols - 1)) / cols)
  const cardH = cols === 2 ? 228 : 208

  destinations.slice(0, 9).forEach((dest, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = MARGIN + col * (cardW + GAP)
    const y = GRID_Y + row * (cardH + GAP)

    // Card shadow (approximated)
    ctx.shadowColor = 'rgba(0,0,0,0.08)'
    ctx.shadowBlur = 16
    ctx.shadowOffsetY = 4

    // Card background
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, x, y, cardW, cardH, 20)
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    // Type accent bar
    ctx.fillStyle = dest.type === 'vacation' ? '#bae6fd' : '#ddd6fe'
    roundRect(ctx, x, y, cardW, 6, 3)
    ctx.fill()

    // Flag emoji
    ctx.font = cols === 2 ? '64px system-ui' : '52px system-ui'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#000000'
    ctx.fillText(flagEmoji(dest.countryCode), x + 22, y + (cols === 2 ? 82 : 70))

    // City
    ctx.fillStyle = '#0f172a'
    ctx.font = `700 ${cols === 2 ? '34' : '28'}px 'Geist', system-ui, sans-serif`
    ctx.fillText(dest.city, x + 22, y + (cols === 2 ? 130 : 114))

    // Country + nights
    const nights = differenceInDays(new Date(dest.departure), new Date(dest.arrival))
    ctx.fillStyle = '#64748b'
    ctx.font = `400 ${cols === 2 ? '26' : '22'}px 'Geist', system-ui, sans-serif`
    ctx.fillText(
      `${dest.country} · ${nights}n`,
      x + 22,
      y + (cols === 2 ? 170 : 150)
    )
  })

  // Watermark
  ctx.fillStyle = '#94a3b8'
  ctx.font = "400 26px 'Geist', system-ui, sans-serif"
  ctx.textAlign = 'right'
  ctx.fillText('wayfar.app', SIZE - 80, SIZE - 56)

  // Trigger download
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = `wayfar-${(tripName || 'trip').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ── Read-only share link ────────────────────────────────────────────────────

export function serializeTripToUrl(trip) {
  const payload = {
    name: trip.name,
    destinations: trip.destinations,
    hotels: trip.hotels,
    activities: trip.activities,
    transports: trip.transports,
    currency: trip.currency,
  }
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
  return `${window.location.origin}${window.location.pathname}?view=${encoded}`
}

export function deserializeTripFromUrl() {
  const encoded = new URLSearchParams(window.location.search).get('view')
  if (!encoded) return null
  try {
    return JSON.parse(decodeURIComponent(escape(atob(encoded))))
  } catch {
    console.error('[Wayfar] Could not parse shared trip from URL')
    return null
  }
}

export async function copyTripShareLink(trip) {
  const url = serializeTripToUrl(trip)
  await navigator.clipboard.writeText(url)
  return url
}
