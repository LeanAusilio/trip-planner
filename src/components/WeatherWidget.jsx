import { useState, useEffect } from 'react'
import { startOfDay, addDays, differenceInDays } from 'date-fns'

// WMO weather codes → emoji + label
function weatherInfo(code) {
  if (code === 0)               return { icon: '☀️', label: 'Clear' }
  if (code <= 3)                return { icon: '⛅', label: 'Cloudy' }
  if (code <= 48)               return { icon: '🌫️', label: 'Fog' }
  if (code <= 67)               return { icon: '🌧️', label: 'Rain' }
  if (code <= 77)               return { icon: '❄️', label: 'Snow' }
  if (code <= 82)               return { icon: '🌦️', label: 'Showers' }
  return { icon: '⛈️', label: 'Storm' }
}

function WeatherCard({ dest }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!dest.lat || !dest.lng) { setLoading(false); return }
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${dest.lat}&longitude=${dest.lng}&daily=temperature_2m_max,temperature_2m_min,weathercode&forecast_days=7&timezone=auto`
    )
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [dest.lat, dest.lng])

  if (loading) return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm min-w-[180px]">
      <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-3" />
      <div className="h-8 w-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
    </div>
  )

  if (!data?.daily) return null

  const { time, temperature_2m_max, temperature_2m_min, weathercode } = data.daily
  // Show up to 5 days starting from destination arrival or today, whichever is later
  const today = startOfDay(new Date())
  const arrival = startOfDay(new Date(dest.arrival))
  const startFrom = arrival > today ? arrival : today

  const days = time
    .map((t, i) => ({ date: new Date(t), max: Math.round(temperature_2m_max[i]), min: Math.round(temperature_2m_min[i]), code: weathercode[i] }))
    .filter((d) => d.date >= startFrom)
    .slice(0, 5)

  if (days.length === 0) return null

  const avgMax = Math.round(days.reduce((s, d) => s + d.max, 0) / days.length)

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex-shrink-0">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{dest.city}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">~{avgMax}°C</span>
      </div>
      <div className="flex gap-2">
        {days.map((day, i) => {
          const info = weatherInfo(day.code)
          return (
            <div key={i} className="flex flex-col items-center gap-0.5 min-w-[36px]">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {day.date.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2)}
              </span>
              <span className="text-lg leading-tight" title={info.label}>{info.icon}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{day.max}°</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{day.min}°</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function WeatherWidget({ destinations }) {
  const today = startOfDay(new Date())
  // Show destinations starting within the next 14 days that have coordinates
  const upcoming = destinations.filter((d) => {
    if (!d.lat || !d.lng) return false
    const arrival = startOfDay(new Date(d.arrival))
    return differenceInDays(arrival, today) <= 14 && startOfDay(new Date(d.departure)) >= today
  })

  if (upcoming.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span>🌤</span> Weather Forecast
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {upcoming.map((dest) => (
          <WeatherCard key={dest.id} dest={dest} />
        ))}
      </div>
    </section>
  )
}
