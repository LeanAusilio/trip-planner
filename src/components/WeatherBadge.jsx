import { useState, useEffect } from 'react'
import { differenceInDays, startOfDay, format } from 'date-fns'

function weatherEmoji(code) {
  if (code === 0)  return '☀️'
  if (code <= 3)   return '⛅'
  if (code <= 48)  return '🌫️'
  if (code <= 67)  return '🌧️'
  if (code <= 77)  return '❄️'
  if (code <= 82)  return '🌦️'
  return '⛈️'
}

// Module-level caches survive re-renders and avoid duplicate network calls
const geoCache = new Map()
const wxCache = new Map()

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

async function fetchDayWeather(lat, lng, dateStr) {
  const key = `${lat}|${lng}|${dateStr}`
  if (wxCache.has(key)) return wxCache.get(key)
  const params = new URLSearchParams({
    latitude: lat, longitude: lng,
    daily: 'temperature_2m_max,temperature_2m_min,weathercode',
    forecast_days: 14,
    timezone: 'auto',
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  const data = await res.json()
  if (!data.daily) return null
  const idx = data.daily.time.indexOf(dateStr)
  if (idx === -1) return null
  const result = {
    max: Math.round(data.daily.temperature_2m_max[idx]),
    min: Math.round(data.daily.temperature_2m_min[idx]),
    code: data.daily.weathercode[idx],
  }
  wxCache.set(key, result)
  return result
}

export default function WeatherBadge({ city, countryCode, date }) {
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    const arrival = startOfDay(new Date(date))
    const today = startOfDay(new Date())
    const daysAway = differenceInDays(arrival, today)
    // Open-Meteo only provides 14-day forecasts; skip past and far-future dates
    if (daysAway < 0 || daysAway > 13) return

    const dateStr = format(arrival, 'yyyy-MM-dd')
    let cancelled = false
    ;(async () => {
      try {
        const coords = await geocode(city, countryCode)
        if (!coords || cancelled) return
        const w = await fetchDayWeather(coords.lat, coords.lng, dateStr)
        if (!cancelled && w) setWeather(w)
      } catch {
        // silently fail — weather is decorative
      }
    })()
    return () => { cancelled = true }
  }, [city, countryCode, date])

  if (!weather) return null

  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500" title="Forecast on arrival day">
      <span>{weatherEmoji(weather.code)}</span>
      <span>{weather.max}° / {weather.min}°</span>
    </span>
  )
}
