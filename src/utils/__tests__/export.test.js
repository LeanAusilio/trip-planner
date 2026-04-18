import { describe, it, expect } from 'vitest'
import { generateICS, buildGoogleEvents, activityEmoji } from '../export.js'

const dest = {
  id: 'd1',
  city: 'Paris',
  country: 'France',
  countryCode: 'FR',
  arrival: '2025-06-01',
  departure: '2025-06-07',
  type: 'vacation',
}

const hotel = {
  id: 'h1',
  name: 'Hotel de Ville',
  checkIn: '2025-06-01',
  checkOut: '2025-06-07',
}

const activity = {
  id: 'a1',
  destinationId: 'd1',
  type: 'restaurant',
  name: 'Le Jules Verne',
  date: '2025-06-03',
}

describe('activityEmoji', () => {
  it('returns correct emojis for known types', () => {
    expect(activityEmoji('restaurant')).toBe('🍴')
    expect(activityEmoji('attraction')).toBe('📷')
    expect(activityEmoji('shopping')).toBe('🛍')
    expect(activityEmoji('medical')).toBe('🏥')
  })
  it('falls back to 📌 for unknown type', () => {
    expect(activityEmoji('unknown')).toBe('📌')
    expect(activityEmoji(undefined)).toBe('📌')
  })
})

describe('generateICS', () => {
  it('wraps content in VCALENDAR', () => {
    const ics = generateICS([dest], [], [])
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('END:VCALENDAR')
    expect(ics).toContain('VERSION:2.0')
  })

  it('creates a VEVENT for each destination', () => {
    const ics = generateICS([dest], [], [])
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('END:VEVENT')
    expect(ics).toContain('SUMMARY:✈ Paris')
    expect(ics).toContain('LOCATION:Paris\\, France')
  })

  it('formats destination dates as YYYYMMDD', () => {
    const ics = generateICS([dest], [], [])
    expect(ics).toContain('DTSTART;VALUE=DATE:20250601')
    // end date is departure + 1 day
    expect(ics).toContain('DTEND;VALUE=DATE:20250608')
  })

  it('uses 💼 emoji for business destinations', () => {
    const bizDest = { ...dest, type: 'business' }
    const ics = generateICS([bizDest], [], [])
    expect(ics).toContain('SUMMARY:💼 Paris')
  })

  it('creates VEVENT for hotel', () => {
    const ics = generateICS([], [hotel], [])
    expect(ics).toContain('SUMMARY:🏨 Hotel de Ville')
    expect(ics).toContain('DTSTART;VALUE=DATE:20250601')
    expect(ics).toContain('DTEND;VALUE=DATE:20250608')
  })

  it('creates VEVENT for activity', () => {
    const ics = generateICS([dest], [], [activity])
    expect(ics).toContain('SUMMARY:🍴 Le Jules Verne')
    expect(ics).toContain('DTSTART;VALUE=DATE:20250603')
  })

  it('escapes special characters in ICS fields', () => {
    const specialDest = { ...dest, city: 'São Paulo, Brazil; test\\backslash' }
    const ics = generateICS([specialDest], [], [])
    expect(ics).toContain('São Paulo\\, Brazil\\; test\\\\backslash')
  })

  it('uses CRLF line endings', () => {
    const ics = generateICS([dest], [], [])
    expect(ics).toContain('\r\n')
    // Should not have bare LF between ICS fields
    expect(ics.split('\r\n').length).toBeGreaterThan(5)
  })

  it('generates unique UIDs per entity type', () => {
    const ics = generateICS([dest], [hotel], [activity])
    expect(ics).toContain(`UID:dest-d1@trip-planner`)
    expect(ics).toContain(`UID:hotel-h1@trip-planner`)
    expect(ics).toContain(`UID:act-a1@trip-planner`)
  })

  it('handles empty arrays without error', () => {
    expect(() => generateICS([], [], [])).not.toThrow()
    const ics = generateICS([], [], [])
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).not.toContain('BEGIN:VEVENT')
  })

  it('folds long lines at 75 characters with CRLF + space', () => {
    const longNameDest = { ...dest, city: 'A'.repeat(80) }
    const ics = generateICS([longNameDest], [], [])
    // A folded line should never exceed 75 chars before CRLF
    const lines = ics.split('\r\n')
    lines.forEach((line) => {
      expect(line.length).toBeLessThanOrEqual(75)
    })
  })

  it('includes multiple destinations', () => {
    const dest2 = { ...dest, id: 'd2', city: 'London', country: 'UK', countryCode: 'GB', arrival: '2025-07-01', departure: '2025-07-05' }
    const ics = generateICS([dest, dest2], [], [])
    expect(ics).toContain('Paris')
    expect(ics).toContain('London')
    const veventCount = (ics.match(/BEGIN:VEVENT/g) || []).length
    expect(veventCount).toBe(2)
  })
})

describe('buildGoogleEvents', () => {
  it('returns destEvents, hotelEvents, activityEvents arrays', () => {
    const result = buildGoogleEvents([dest], [hotel], [activity])
    expect(result).toHaveProperty('destEvents')
    expect(result).toHaveProperty('hotelEvents')
    expect(result).toHaveProperty('activityEvents')
  })

  it('creates correct Google Calendar URLs for destinations', () => {
    const { destEvents } = buildGoogleEvents([dest], [], [])
    expect(destEvents).toHaveLength(1)
    expect(destEvents[0].url).toContain('google.com/calendar/render')
    expect(destEvents[0].url).toContain('Paris')
    expect(destEvents[0].url).toContain('20250601')
  })

  it('uses vacation emoji in destination title', () => {
    const { destEvents } = buildGoogleEvents([dest], [], [])
    expect(destEvents[0].url).toContain('%E2%9C%88') // ✈ URL-encoded
  })

  it('uses business emoji for business destinations', () => {
    const { destEvents } = buildGoogleEvents([{ ...dest, type: 'business' }], [], [])
    expect(destEvents[0].url).toContain('%F0%9F%92%BC') // 💼 URL-encoded
  })

  it('creates correct Google Calendar URLs for hotels', () => {
    const { hotelEvents } = buildGoogleEvents([], [hotel], [])
    expect(hotelEvents).toHaveLength(1)
    expect(hotelEvents[0].url).toContain('Hotel+de+Ville')
    expect(hotelEvents[0].label).toBe('Hotel de Ville')
  })

  it('creates correct activity events with destination context', () => {
    const { activityEvents } = buildGoogleEvents([dest], [], [activity])
    expect(activityEvents).toHaveLength(1)
    expect(activityEvents[0].label).toBe('Le Jules Verne')
    expect(activityEvents[0].actType).toBe('restaurant')
    expect(activityEvents[0].sub).toContain('Paris')
  })

  it('handles empty arrays', () => {
    const result = buildGoogleEvents([], [], [])
    expect(result.destEvents).toHaveLength(0)
    expect(result.hotelEvents).toHaveLength(0)
    expect(result.activityEvents).toHaveLength(0)
  })

  it('assigns correct category labels', () => {
    const { destEvents, hotelEvents, activityEvents } = buildGoogleEvents([dest], [hotel], [activity])
    expect(destEvents[0].category).toBe('destination')
    expect(hotelEvents[0].category).toBe('hotel')
    expect(activityEvents[0].category).toBe('activity')
  })
})
