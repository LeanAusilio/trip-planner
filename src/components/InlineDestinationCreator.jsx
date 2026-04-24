import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import CitySearch from './CitySearch'
import DateRangePicker from './DateRangePicker'

async function fetchCityFact(cityName) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cityName)}`,
      { headers: { Accept: 'application/json' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.description || null
  } catch {
    return null
  }
}

export default function InlineDestinationCreator({ onAdd }) {
  const [city, setCity] = useState(null)
  const [range, setRange] = useState({ from: null, to: null })
  const [fact, setFact] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!city) { setFact(null); return }
    setFact(null)
    fetchCityFact(city.city).then(setFact)
  }, [city])

  const handleCitySelect = (c) => {
    setCity(c)
    setRange({ from: null, to: null })
    setError('')
  }

  const handleAdd = () => {
    if (!city?.city) { setError('Pick a city first'); return }
    if (!range.from) { setError('Pick an arrival date'); return }
    if (!range.to) { setError('Pick a departure date'); return }
    onAdd({
      city,
      arrival: format(range.from, 'yyyy-MM-dd'),
      departure: format(range.to, 'yyyy-MM-dd'),
    })
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-24 gap-8 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
          Where to next?
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Search a city to start planning your trip
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <CitySearch
          value={city}
          onChange={handleCitySelect}
          placeholder="Search for a city…"
        />

        {/* Did you know? */}
        {city && fact && (
          <div className="flex gap-2.5 items-start bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-2xl px-3.5 py-2.5 animate-fade-in">
            <span className="text-base leading-snug mt-0.5 flex-shrink-0">💡</span>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              <span className="font-semibold">{city.city}</span> — {fact}
            </p>
          </div>
        )}

        {/* Date range picker */}
        {city && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 pt-4 pb-3 shadow-sm">
            <DateRangePicker
              from={range.from}
              to={range.to}
              onChange={setRange}
              minDate={new Date()}
            />
          </div>
        )}

        {city && range.from && range.to && (
          <button
            onClick={handleAdd}
            className="w-full bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white text-sm font-semibold rounded-full py-3 transition-all shadow-sm shadow-sky-200 dark:shadow-none"
          >
            Start planning {city.city} →
          </button>
        )}

        {error && (
          <p className="text-xs text-red-400 text-center">⚠ {error}</p>
        )}
      </div>
    </div>
  )
}
