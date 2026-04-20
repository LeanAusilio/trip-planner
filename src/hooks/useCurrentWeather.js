import { useState, useEffect } from 'react'
import { startOfDay } from 'date-fns'

// Module-level caches shared across all hook instances
const geoCache = new Map()
const wxCache  = new Map() // key → { data, ts }
const WX_TTL   = 10 * 60 * 1000 // 10 minutes

export function wmoEmoji(code) {
  if (code === 0)  return '☀️'
  if (code <= 3)   return '⛅'
  if (code <= 48)  return '🌫️'
  if (code <= 67)  return '🌧️'
  if (code <= 77)  return '❄️'
  if (code <= 82)  return '🌦️'
  return '⛈️'
}

export function isCurrentOrFuture(departure) {
  return startOfDay(new Date(departure)) >= startOfDay(new Date())
}

export function utcOffsetLabel(ianaTimezone) {
  if (!ianaTimezone) return null
  try {
    const parts = new Intl.DateTimeFormat('en', { timeZone: ianaTimezone, timeZoneName: 'short' })
      .formatToParts(new Date())
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? null
  } catch {
    return null
  }
}

async function geocode(city, countryCode) {
  const key = `${city}|${countryCode}`
  if (geoCache.has(key)) return geoCache.get(key)
  const params = new URLSearchParams({ q: `${city}, ${countryCode}`, format: 'json', limit: 1 })
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'Accept-Language': 'en' },
  })
  const data = await res.json()
  const result = data[0] ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null
  geoCache.set(key, result)
  return result
}

async function fetchWeather(lat, lng) {
  const key = `${lat.toFixed(2)}|${lng.toFixed(2)}`
  const cached = wxCache.get(key)
  if (cached && Date.now() - cached.ts < WX_TTL) return cached.data

  const params = new URLSearchParams({
    latitude: lat, longitude: lng,
    current_weather: 'true',
    daily: 'temperature_2m_max,temperature_2m_min',
    forecast_days: 1,
    timezone: 'auto',
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  const json = await res.json()
  if (!json.current_weather) return null

  const data = {
    temp:     Math.round(json.current_weather.temperature),
    high:     Math.round(json.daily.temperature_2m_max[0]),
    low:      Math.round(json.daily.temperature_2m_min[0]),
    code:     json.current_weather.weathercode,
    timezone: json.timezone ?? null,
  }
  wxCache.set(key, { data, ts: Date.now() })
  return data
}

export function useCurrentWeather(city, countryCode, enabled = true) {
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    if (!enabled || !city || !countryCode) return
    let cancelled = false
    ;(async () => {
      try {
        const coords = await geocode(city, countryCode)
        if (!coords || cancelled) return
        const w = await fetchWeather(coords.lat, coords.lng)
        if (!cancelled && w) setWeather(w)
      } catch { /* silently fail — weather is decorative */ }
    })()
    return () => { cancelled = true }
  }, [city, countryCode, enabled])

  return weather
}
