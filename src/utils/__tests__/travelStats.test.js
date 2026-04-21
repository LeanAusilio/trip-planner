import { describe, it, expect } from 'vitest'
import {
  haversineKm,
  resolveCoords,
  tripDistanceKm,
  yearDistanceKm,
  yearNightsAway,
  yearGeographicStats,
  getFunComparisons,
  getAchievementBadges,
  getTravelPersonality,
  getAvailableYears,
  topCities,
  topCountries,
} from '../travelStats'

// Paris and Rome are ~1105 km apart
const PARIS = { id: '1', city: 'Paris', countryCode: 'FR', country: 'France', lat: 48.8566, lng: 2.3522, arrival: '2025-05-01', departure: '2025-05-06', type: 'vacation' }
const ROME  = { id: '2', city: 'Rome',  countryCode: 'IT', country: 'Italy',  lat: 41.9028, lng: 12.4964, arrival: '2025-05-06', departure: '2025-05-11', type: 'vacation' }
const TOKYO = { id: '3', city: 'Tokyo', countryCode: 'JP', country: 'Japan',  lat: 35.6762, lng: 139.6503, arrival: '2025-06-01', departure: '2025-06-08', type: 'business' }
// No lat/lng — falls back to lookup table (London|GB exists)
const LONDON_NO_COORDS = { id: '4', city: 'London', countryCode: 'GB', country: 'UK', arrival: '2025-07-01', departure: '2025-07-04', type: 'vacation' }

describe('haversineKm', () => {
  it('returns ~1105 km for Paris → Rome', () => {
    const km = haversineKm(48.8566, 2.3522, 41.9028, 12.4964)
    expect(km).toBeGreaterThan(1100)
    expect(km).toBeLessThan(1115)
  })

  it('returns 0 for null inputs', () => {
    expect(haversineKm(null, 2, 41, 12)).toBe(0)
    expect(haversineKm(48, null, 41, 12)).toBe(0)
  })

  it('returns 0 for same point', () => {
    expect(haversineKm(48.8566, 2.3522, 48.8566, 2.3522)).toBe(0)
  })
})

describe('resolveCoords', () => {
  it('returns exact coords when present', () => {
    const result = resolveCoords(PARIS)
    expect(result.lat).toBe(48.8566)
    expect(result.approximate).toBe(false)
  })

  it('falls back to lookup table for London without coords', () => {
    const result = resolveCoords(LONDON_NO_COORDS)
    expect(result).not.toBeNull()
    expect(result.approximate).toBe(true)
    expect(result.lat).toBeCloseTo(51.5074, 0)
  })

  it('returns null for unknown city without coords', () => {
    const unknown = { city: 'Zzyzx', countryCode: 'ZZ' }
    expect(resolveCoords(unknown)).toBeNull()
  })
})

describe('tripDistanceKm', () => {
  it('calculates Paris → Rome distance', () => {
    const { km, approximateCount, skippedCount } = tripDistanceKm([PARIS, ROME])
    expect(km).toBeGreaterThan(1100)
    expect(km).toBeLessThan(1115)
    expect(approximateCount).toBe(0)
    expect(skippedCount).toBe(0)
  })

  it('handles destinations with missing coords via fallback', () => {
    const { km, approximateCount } = tripDistanceKm([PARIS, LONDON_NO_COORDS])
    expect(km).toBeGreaterThan(300) // Paris → London ~340 km
    expect(approximateCount).toBeGreaterThan(0)
  })

  it('returns 0 for single destination', () => {
    const { km } = tripDistanceKm([PARIS])
    expect(km).toBe(0)
  })

  it('returns 0 for empty array', () => {
    const { km } = tripDistanceKm([])
    expect(km).toBe(0)
  })
})

const TRIP_2025 = {
  id: 't1',
  destinations: [PARIS, ROME, TOKYO],
  hotels: [], activities: [], transports: [],
}
const TRIP_2024 = {
  id: 't2',
  destinations: [
    { ...PARIS, arrival: '2024-03-01', departure: '2024-03-06' },
    { ...ROME,  arrival: '2024-03-06', departure: '2024-03-11' },
  ],
  hotels: [], activities: [], transports: [],
}

describe('yearDistanceKm', () => {
  it('aggregates distance across trips for a year', () => {
    const { km } = yearDistanceKm([TRIP_2025, TRIP_2024], 2025)
    expect(km).toBeGreaterThan(10_000) // Paris→Rome + Rome→Tokyo is ~10,400 km
  })

  it('filters correctly by year', () => {
    const { km: km2024 } = yearDistanceKm([TRIP_2025, TRIP_2024], 2024)
    const { km: km2025 } = yearDistanceKm([TRIP_2025, TRIP_2024], 2025)
    expect(km2024).toBeLessThan(km2025)
  })

  it('returns 0 for year with no trips', () => {
    const { km } = yearDistanceKm([TRIP_2025], 2023)
    expect(km).toBe(0)
  })
})

describe('yearNightsAway', () => {
  it('sums nights correctly', () => {
    const { total, vacation, business } = yearNightsAway([TRIP_2025], 2025)
    expect(total).toBe(17) // Paris 5 + Rome 5 + Tokyo 7
    expect(vacation).toBe(10) // Paris + Rome
    expect(business).toBe(7)  // Tokyo
  })
})

describe('yearGeographicStats', () => {
  it('returns correct country and continent counts', () => {
    const stats = yearGeographicStats([TRIP_2025], 2025)
    expect(stats.countryCodes).toContain('FR')
    expect(stats.countryCodes).toContain('IT')
    expect(stats.countryCodes).toContain('JP')
    expect(stats.continents).toContain('Europe')
    expect(stats.continents).toContain('Asia')
    expect(stats.destinationCount).toBe(3)
  })
})

describe('getFunComparisons', () => {
  it('returns an array sorted closest to 1x first', () => {
    const comps = getFunComparisons(28_450)
    expect(comps.length).toBeGreaterThan(0)
    // The first item should have a ratio closest to 1
    if (comps.length > 1) {
      expect(Math.abs(comps[0].ratio - 1)).toBeLessThanOrEqual(Math.abs(comps[1].ratio - 1))
    }
  })

  it('returns empty for 0 km', () => {
    expect(getFunComparisons(0)).toHaveLength(0)
  })

  it('generates correct text for ratio >= 1', () => {
    // 21,196 km = exactly 1x Great Wall
    const comps = getFunComparisons(21_196)
    const gw = comps.find((c) => c.key === 'GREAT_WALL')
    expect(gw).toBeDefined()
    expect(gw.ratio).toBeCloseTo(1, 1)
    expect(gw.text).toMatch(/traveled/)
  })

  it('generates percent text for ratio < 1', () => {
    const comps = getFunComparisons(1_000)
    const gw = comps.find((c) => c.key === 'GREAT_WALL')
    expect(gw).toBeDefined()
    expect(gw.text).toMatch(/%/)
  })
})

describe('getAchievementBadges', () => {
  it('always returns 9 badges', () => {
    expect(getAchievementBadges({ km: 0, nightsAway: 0, countryCodes: [], continents: [], destinationCount: 0 })).toHaveLength(9)
  })

  it('earns 10K Club at km >= 10000', () => {
    const badges = getAchievementBadges({ km: 10_001, nightsAway: 0, countryCodes: [], continents: [], destinationCount: 1 })
    expect(badges.find((b) => b.id === 'globetrotter_10k').earned).toBe(true)
  })

  it('does not earn 10K Club below threshold', () => {
    const badges = getAchievementBadges({ km: 9_999, nightsAway: 0, countryCodes: [], continents: [], destinationCount: 1 })
    expect(badges.find((b) => b.id === 'globetrotter_10k').earned).toBe(false)
  })

  it('earns Five Flags at 5+ countries', () => {
    const badges = getAchievementBadges({ km: 0, nightsAway: 0, countryCodes: ['FR','IT','JP','US','DE'], continents: [], destinationCount: 5 })
    expect(badges.find((b) => b.id === 'five_countries').earned).toBe(true)
  })
})

describe('getTravelPersonality', () => {
  it('returns a non-null personality when there are destinations', () => {
    const geo = { nightsAway: 30, vacationNights: 20, businessNights: 10, destinationCount: 4, countryCodes: ['FR','IT','DE'] }
    const dist = { km: 8_000 }
    expect(getTravelPersonality(geo, dist)).not.toBeNull()
  })

  it('returns null when no destinations', () => {
    const geo = { nightsAway: 0, vacationNights: 0, businessNights: 0, destinationCount: 0, countryCodes: [] }
    expect(getTravelPersonality(geo, { km: 0 })).toBeNull()
  })
})

describe('getAvailableYears', () => {
  it('extracts years from trip destinations', () => {
    const years = getAvailableYears([TRIP_2025, TRIP_2024])
    expect(years).toContain(2025)
    expect(years).toContain(2024)
    // Sorted descending
    expect(years[0]).toBeGreaterThanOrEqual(years[1])
  })

  it('returns current year for empty trips', () => {
    const years = getAvailableYears([])
    expect(years).toHaveLength(1)
    expect(years[0]).toBe(new Date().getFullYear())
  })
})

describe('topCities and topCountries', () => {
  const tripsWithRepeat = [
    { ...TRIP_2025 },
    { id: 't3', destinations: [{ ...PARIS, id: '5', arrival: '2024-01-01', departure: '2024-01-05' }], hotels: [], activities: [], transports: [] },
  ]

  it('ranks cities by visit count', () => {
    const cities = topCities(tripsWithRepeat, 3)
    expect(cities[0].city).toBe('Paris') // 2 visits
    expect(cities[0].visits).toBe(2)
  })

  it('ranks countries by visit count', () => {
    const countries = topCountries(tripsWithRepeat, 3)
    expect(countries[0].countryCode).toBe('FR') // Paris visited twice
  })
})
