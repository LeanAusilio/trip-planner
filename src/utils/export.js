import { format, addDays, differenceInDays } from 'date-fns'

// ── Shared ─────────────────────────────────────────────────────────────────
export function activityEmoji(type) {
  return { restaurant: '🍴', attraction: '📷', shopping: '🛍', medical: '🏥' }[type] || '📌'
}

// ── ICS / iCal ─────────────────────────────────────────────────────────────
function icsDateStr(date) {
  const d = new Date(date)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function icsEscape(str) {
  return String(str ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

// ICS spec: fold lines longer than 75 chars with CRLF + space
function foldLine(line) {
  if (line.length <= 75) return line
  const parts = [line.slice(0, 75)]
  let i = 75
  while (i < line.length) {
    parts.push(' ' + line.slice(i, i + 74))
    i += 74
  }
  return parts.join('\r\n')
}

function vevent(fields) {
  const lines = ['BEGIN:VEVENT']
  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined && val !== null && val !== '') {
      lines.push(foldLine(`${key}:${val}`))
    }
  }
  lines.push('END:VEVENT')
  return lines.join('\r\n')
}

export function generateICS(destinations, hotels, activities) {
  const blocks = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trip Planner//EN',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:My Trips',
    'X-WR-TIMEZONE:UTC',
  ]

  // Destinations
  for (const dest of destinations) {
    const emoji = dest.type === 'vacation' ? '✈' : '💼'
    const destActs = activities
      .filter((a) => a.destinationId === dest.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
    const actLines = destActs
      .map((a) => `${activityEmoji(a.type)} ${a.name} (${format(new Date(a.date), 'MMM d')})`)
      .join('\n')
    const desc = [
      `${dest.city}, ${dest.country}`,
      `Type: ${dest.type}`,
      `Arrival: ${format(new Date(dest.arrival), 'MMM d, yyyy')}`,
      `Departure: ${format(new Date(dest.departure), 'MMM d, yyyy')}`,
      actLines ? `\nActivities:\n${actLines}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    blocks.push(vevent({
      UID: `dest-${dest.id}@trip-planner`,
      'DTSTART;VALUE=DATE': icsDateStr(dest.arrival),
      'DTEND;VALUE=DATE': icsDateStr(addDays(new Date(dest.departure), 1)),
      SUMMARY: icsEscape(`${emoji} ${dest.city}`),
      DESCRIPTION: icsEscape(desc),
      LOCATION: icsEscape(`${dest.city}, ${dest.country}`),
    }))
  }

  // Hotels
  for (const hotel of hotels) {
    const nights = differenceInDays(new Date(hotel.checkOut), new Date(hotel.checkIn))
    blocks.push(vevent({
      UID: `hotel-${hotel.id}@trip-planner`,
      'DTSTART;VALUE=DATE': icsDateStr(hotel.checkIn),
      'DTEND;VALUE=DATE': icsDateStr(addDays(new Date(hotel.checkOut), 1)),
      SUMMARY: icsEscape(`🏨 ${hotel.name}`),
      DESCRIPTION: icsEscape(
        `Hotel: ${hotel.name}\nCheck-in: ${format(new Date(hotel.checkIn), 'MMM d, yyyy')}\nCheck-out: ${format(new Date(hotel.checkOut), 'MMM d, yyyy')}\n${nights} nights`
      ),
    }))
  }

  // Activities
  for (const act of activities) {
    const dest = destinations.find((d) => d.id === act.destinationId)
    blocks.push(vevent({
      UID: `act-${act.id}@trip-planner`,
      'DTSTART;VALUE=DATE': icsDateStr(act.date),
      'DTEND;VALUE=DATE': icsDateStr(addDays(new Date(act.date), 1)),
      SUMMARY: icsEscape(`${activityEmoji(act.type)} ${act.name}`),
      DESCRIPTION: icsEscape(dest ? `${act.name}\n${dest.city}, ${dest.country}` : act.name),
      LOCATION: dest ? icsEscape(`${dest.city}, ${dest.country}`) : undefined,
    }))
  }

  blocks.push('END:VCALENDAR')
  return blocks.join('\r\n')
}

export function downloadICS(destinations, hotels, activities) {
  const content = generateICS(destinations, hotels, activities)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'trips.ics'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Google Calendar ─────────────────────────────────────────────────────────
function gcalDateStr(date) {
  const d = new Date(date)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function gcalUrl({ title, start, end, description, location }) {
  const params = new URLSearchParams({ action: 'TEMPLATE', text: title })
  params.set('dates', `${gcalDateStr(start)}/${gcalDateStr(end)}`)
  if (description) params.set('details', description)
  if (location)    params.set('location', location)
  return `https://www.google.com/calendar/render?${params.toString()}`
}

export function buildGoogleEvents(destinations, hotels, activities) {
  const destEvents = destinations.map((dest) => ({
    id: `dest-${dest.id}`,
    category: 'destination',
    label: dest.city,
    sub: `${dest.country} · ${format(new Date(dest.arrival), 'MMM d')} – ${format(new Date(dest.departure), 'MMM d, yyyy')}`,
    countryCode: dest.countryCode,
    url: gcalUrl({
      title: `${dest.type === 'vacation' ? '✈' : '💼'} ${dest.city}`,
      start: dest.arrival,
      end: addDays(new Date(dest.departure), 1),
      description: `${dest.type.charAt(0).toUpperCase() + dest.type.slice(1)} in ${dest.city}, ${dest.country}`,
      location: `${dest.city}, ${dest.country}`,
    }),
  }))

  const hotelEvents = hotels.map((hotel) => ({
    id: `hotel-${hotel.id}`,
    category: 'hotel',
    label: hotel.name,
    sub: `Check-in ${format(new Date(hotel.checkIn), 'MMM d')} · Check-out ${format(new Date(hotel.checkOut), 'MMM d, yyyy')}`,
    url: gcalUrl({
      title: `🏨 ${hotel.name}`,
      start: hotel.checkIn,
      end: addDays(new Date(hotel.checkOut), 1),
      description: `Hotel stay: ${hotel.name}`,
    }),
  }))

  const activityEvents = activities.map((act) => {
    const dest = destinations.find((d) => d.id === act.destinationId)
    return {
      id: `act-${act.id}`,
      category: 'activity',
      actType: act.type,
      label: act.name,
      sub: `${format(new Date(act.date), 'MMM d, yyyy')}${dest ? ` · ${dest.city}` : ''}`,
      url: gcalUrl({
        title: `${activityEmoji(act.type)} ${act.name}`,
        start: act.date,
        end: addDays(new Date(act.date), 1),
        description: dest ? `${dest.city}, ${dest.country}` : '',
        location: dest ? `${dest.city}, ${dest.country}` : '',
      }),
    }
  }).sort((a, b) => new Date(a.date) - new Date(b.date))

  return { destEvents, hotelEvents, activityEvents }
}

// ── PDF / Print ─────────────────────────────────────────────────────────────
export function openPrintWindow(destinations, hotels, activities) {
  const win = window.open('', '_blank', 'width=820,height=960')
  if (!win) {
    alert('Please allow popups for this site to use PDF export.')
    return
  }
  win.document.write(buildPrintHTML(destinations, hotels, activities))
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 700)
}

function buildPrintHTML(destinations, hotels, activities) {
  const today = format(new Date(), 'MMMM d, yyyy')

  const destRows = destinations.map((dest) => {
    const nights = differenceInDays(new Date(dest.departure), new Date(dest.arrival))
    const destActs = activities
      .filter((a) => a.destinationId === dest.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
    const actHTML = destActs
      .map(
        (a) =>
          `<div style="margin-top:5px;padding-left:32px;font-size:12px;color:#6b7280;">${activityEmoji(a.type)} ${a.name} <span style="color:#d1d5db;margin:0 4px;">·</span> ${format(new Date(a.date), 'MMM d')}</div>`
      )
      .join('')

    return `
      <tr>
        <td style="padding:16px 0;vertical-align:top;border-top:1px solid #f3f4f6;">
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="https://flagcdn.com/20x15/${dest.countryCode.toLowerCase()}.png" width="20" height="15" alt="${dest.country}" style="border-radius:2px;flex-shrink:0;" />
            <div>
              <span style="font-size:14px;font-weight:500;color:#111;">${dest.city}</span>
              <span style="font-size:12px;color:#9ca3af;margin-left:6px;">${dest.country}</span>
            </div>
            <span style="margin-left:4px;padding:2px 7px;border-radius:20px;font-size:10px;font-weight:500;background:${dest.type === 'vacation' ? '#f0f9ff' : '#f5f3ff'};color:${dest.type === 'vacation' ? '#0369a1' : '#6d28d9'};">${dest.type}</span>
          </div>
          ${actHTML}
        </td>
        <td style="padding:16px 0;text-align:right;vertical-align:top;border-top:1px solid #f3f4f6;white-space:nowrap;">
          <div style="font-size:12px;color:#374151;">${format(new Date(dest.arrival), 'MMM d')} – ${format(new Date(dest.departure), 'MMM d, yyyy')}</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:2px;">${nights} night${nights !== 1 ? 's' : ''}</div>
        </td>
      </tr>`
  }).join('')

  const hotelRows = hotels.map((hotel) => {
    const nights = differenceInDays(new Date(hotel.checkOut), new Date(hotel.checkIn))
    return `
      <tr>
        <td style="padding:16px 0;vertical-align:top;border-top:1px solid #f3f4f6;">
          <div style="font-size:14px;font-weight:500;color:#111;">🛏 ${hotel.name}</div>
        </td>
        <td style="padding:16px 0;text-align:right;vertical-align:top;border-top:1px solid #f3f4f6;white-space:nowrap;">
          <div style="font-size:12px;color:#374151;">Check-in ${format(new Date(hotel.checkIn), 'MMM d')} · Check-out ${format(new Date(hotel.checkOut), 'MMM d, yyyy')}</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:2px;">${nights} night${nights !== 1 ? 's' : ''}</div>
        </td>
      </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Trip Itinerary</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: white; color: #111;
      padding: 52px 60px;
      max-width: 720px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print { body { padding: 28px 36px; } }
    table { width: 100%; border-collapse: collapse; }
    h2 {
      font-size: 10px; font-weight: 500;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: #9ca3af; margin-top: 36px; margin-bottom: 2px;
    }
    .no-print { display: none; }
    @media screen { .print-btn {
      display: inline-block; margin-top: 32px;
      padding: 8px 18px; border: 1px solid #e5e7eb; border-radius: 6px;
      font-size: 12px; font-family: inherit; cursor: pointer; background: white;
    }}
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-end;">
    <div>
      <h1 style="font-size:22px;font-weight:500;letter-spacing:-0.02em;">Trip Itinerary</h1>
      <p style="font-size:12px;color:#9ca3af;margin-top:4px;">Exported ${today}</p>
    </div>
    <div style="font-size:11px;color:#d1d5db;">${destinations.length} destination${destinations.length !== 1 ? 's' : ''} · ${hotels.length} hotel${hotels.length !== 1 ? 's' : ''}</div>
  </div>

  ${destinations.length > 0 ? `<h2>Destinations</h2><table>${destRows}</table>` : ''}
  ${hotels.length > 0 ? `<h2>Hotels</h2><table>${hotelRows}</table>` : ''}

  <button class="print-btn no-print" onclick="window.print()">Save as PDF</button>
</body>
</html>`
}
