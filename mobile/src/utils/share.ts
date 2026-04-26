import { Linking } from 'react-native'
import { format, addDays, differenceInDays } from 'date-fns'
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import * as Print from 'expo-print'
import { supabase } from '../lib/supabase'
import type { Trip, Activity } from '../types/trip'

// ── Helpers ────────────────────────────────────────────────────────────────

function flagEmoji(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return '📍'
  return [...countryCode.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('')
}

function activityEmoji(type: string): string {
  return ({ restaurant: '🍴', attraction: '📷', shopping: '🛍', medical: '🏥' } as Record<string, string>)[type] ?? '📌'
}

// ── WhatsApp ───────────────────────────────────────────────────────────────

function buildTripText(trip: Trip, url: string): string {
  const dests = trip.destinations.slice(0, 6).map((d) => {
    const flag = flagEmoji(d.countryCode)
    const arr = format(new Date(d.arrival), 'MMM d')
    const dep = format(new Date(d.departure), 'MMM d')
    const nights = differenceInDays(new Date(d.departure), new Date(d.arrival))
    return `${flag} ${d.city} · ${arr}–${dep} (${nights} night${nights !== 1 ? 's' : ''})`
  })
  const extra = trip.destinations.length > 6 ? `\n+${trip.destinations.length - 6} more` : ''
  return `✈️ ${trip.name || 'My trip'} on Wayfar\n\n${dests.join('\n')}${extra}\n\n🔗 ${url}`
}

async function saveSharedTrip(trip: Trip): Promise<string | null> {
  if (!supabase) return null
  try {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    const { error } = await supabase.from('shared_trips').insert({
      code,
      data: {
        name: trip.name,
        destinations: trip.destinations,
        hotels: trip.hotels ?? [],
        activities: trip.activities ?? [],
        transports: trip.transports ?? [],
        currency: trip.currency,
      },
    })
    return error ? null : code
  } catch {
    return null
  }
}

export async function shareToWhatsApp(trip: Trip): Promise<void> {
  if (!trip?.destinations?.length) return
  const code = await saveSharedTrip(trip)
  const url = code
    ? `https://wayfar-eta.vercel.app/?trip=${code}`
    : 'https://wayfar-eta.vercel.app'
  const text = buildTripText(trip, url)
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
  const canOpen = await Linking.canOpenURL(waUrl)
  if (canOpen) {
    await Linking.openURL(waUrl)
  } else {
    // Fall back to expo-sharing as plain text
    await shareAsText(text, `${trip.name || 'trip'}.txt`)
  }
}

// ── ICS calendar export ────────────────────────────────────────────────────

function icsDateStr(date: string): string {
  const d = new Date(date)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function icsEscape(str: string | undefined | null): string {
  return String(str ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function foldLine(line: string): string {
  if (line.length <= 75) return line
  const parts = [line.slice(0, 75)]
  let i = 75
  while (i < line.length) { parts.push(' ' + line.slice(i, i + 74)); i += 74 }
  return parts.join('\r\n')
}

function vevent(fields: Record<string, string | undefined>): string {
  const lines = ['BEGIN:VEVENT']
  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined && val !== '') lines.push(foldLine(`${key}:${val}`))
  }
  lines.push('END:VEVENT')
  return lines.join('\r\n')
}

function generateICS(trip: Trip): string {
  const { destinations, hotels, activities } = trip
  const blocks = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wayfar//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${trip.name || 'My Trip'}`,
  ]

  for (const dest of destinations) {
    const emoji = dest.type === 'vacation' ? '✈' : '💼'
    const destActs = (activities as Activity[])
      .filter((a) => a.destinationId === dest.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const actLines = destActs
      .map((a) => `${activityEmoji(a.type)} ${a.name} (${format(new Date(a.date), 'MMM d')})`)
      .join('\n')
    const desc = [
      `${dest.city}, ${dest.country}`,
      `Type: ${dest.type}`,
      actLines ? `Activities:\n${actLines}` : '',
    ].filter(Boolean).join('\n')

    blocks.push(vevent({
      UID: `dest-${dest.id}@wayfar`,
      'DTSTART;VALUE=DATE': icsDateStr(dest.arrival),
      'DTEND;VALUE=DATE': icsDateStr(format(addDays(new Date(dest.departure), 1), 'yyyy-MM-dd')),
      SUMMARY: icsEscape(`${emoji} ${dest.city}`),
      DESCRIPTION: icsEscape(desc),
      LOCATION: icsEscape(`${dest.city}, ${dest.country}`),
    }))
  }

  for (const hotel of hotels) {
    blocks.push(vevent({
      UID: `hotel-${hotel.id}@wayfar`,
      'DTSTART;VALUE=DATE': icsDateStr(hotel.checkIn),
      'DTEND;VALUE=DATE': icsDateStr(hotel.checkOut),
      SUMMARY: icsEscape(`🛏 ${hotel.name}`),
      DESCRIPTION: icsEscape(hotel.address ?? ''),
    }))
  }

  blocks.push('END:VCALENDAR')
  return blocks.join('\r\n')
}

export async function exportTripAsICS(trip: Trip): Promise<void> {
  const icsContent = generateICS(trip)
  const fileName = `${(trip.name || 'trip').replace(/[^a-z0-9]/gi, '_')}.ics`
  const file = new File(Paths.cache, fileName)
  file.write(icsContent)
  const canShare = await Sharing.isAvailableAsync()
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/calendar',
      dialogTitle: 'Export to Calendar',
      UTI: 'public.calendar-event',
    })
  }
}

// ── Print / PDF ────────────────────────────────────────────────────────────

function buildPrintHTML(trip: Trip): string {
  const { destinations, hotels, activities, transports } = trip
  const destRows = destinations.map((d) => {
    const nights = differenceInDays(new Date(d.departure), new Date(d.arrival))
    const destActs = (activities as Activity[])
      .filter((a) => a.destinationId === d.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const actHtml = destActs.length
      ? `<ul style="margin:4px 0 0 16px;padding:0;">${destActs.map((a) => `<li>${activityEmoji(a.type)} ${a.name} – ${format(new Date(a.date), 'MMM d')}</li>`).join('')}</ul>`
      : ''
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">
        ${flagEmoji(d.countryCode)} ${d.city}, ${d.country}
        ${actHtml}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">
        ${format(new Date(d.arrival), 'MMM d')} – ${format(new Date(d.departure), 'MMM d, yyyy')}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${nights}n</td>
    </tr>`
  }).join('')

  const hotelRows = hotels.map((h) => {
    const nights = differenceInDays(new Date(h.checkOut), new Date(h.checkIn))
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">🛏 ${h.name}${h.address ? ` <span style="color:#9ca3af;font-size:12px;">${h.address}</span>` : ''}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">${format(new Date(h.checkIn), 'MMM d')} – ${format(new Date(h.checkOut), 'MMM d, yyyy')}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${nights}n</td>
    </tr>`
  }).join('')

  const transportRows = transports.map((t) => `<tr>
    <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${t.fromCity} → ${t.toCity}${t.carrier ? ` · ${t.carrier}` : ''}${t.flightNumber ? ` ${t.flightNumber}` : ''}</td>
    <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;" colspan="2">${format(new Date(t.departureDate), 'MMM d, yyyy')}</td>
  </tr>`).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { font-family: -apple-system, sans-serif; color: #1f2937; padding: 32px; }
  h1 { font-size: 24px; font-weight: 700; color: #0ea5e9; margin: 0 0 4px; }
  .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
  h2 { font-size: 13px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin: 20px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; padding: 8px 12px; background: #f9fafb; font-size: 12px; color: #6b7280; }
</style></head>
<body>
  <h1>✈️ ${trip.name || 'My Trip'}</h1>
  <div class="subtitle">Exported from Wayfar · ${format(new Date(), 'MMMM d, yyyy')}</div>

  ${destinations.length ? `<h2>Destinations</h2>
  <table><thead><tr><th>City</th><th>Dates</th><th style="text-align:right">Nights</th></tr></thead>
  <tbody>${destRows}</tbody></table>` : ''}

  ${hotels.length ? `<h2>Hotels</h2>
  <table><thead><tr><th>Hotel</th><th>Dates</th><th style="text-align:right">Nights</th></tr></thead>
  <tbody>${hotelRows}</tbody></table>` : ''}

  ${transports.length ? `<h2>Transport</h2>
  <table><thead><tr><th>Route</th><th colspan="2">Date</th></tr></thead>
  <tbody>${transportRows}</tbody></table>` : ''}
</body></html>`
}

export async function printTrip(trip: Trip): Promise<void> {
  const html = buildPrintHTML(trip)
  await Print.printAsync({ html })
}

// ── Generic text share ─────────────────────────────────────────────────────

async function shareAsText(text: string, fileName: string): Promise<void> {
  const file = new File(Paths.cache, fileName)
  file.write(text)
  const canShare = await Sharing.isAvailableAsync()
  if (canShare) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/plain' })
  }
}

export async function shareTripText(trip: Trip): Promise<void> {
  if (!trip?.destinations?.length) return
  const code = await saveSharedTrip(trip)
  const url = code
    ? `https://wayfar-eta.vercel.app/?trip=${code}`
    : 'https://wayfar-eta.vercel.app'
  const text = buildTripText(trip, url)
  await shareAsText(text, `${(trip.name || 'trip').replace(/[^a-z0-9]/gi, '_')}.txt`)
}
