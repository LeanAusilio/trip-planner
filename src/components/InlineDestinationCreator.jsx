import { useState } from 'react'
import { format, addDays, parseISO, startOfDay } from 'date-fns'
import CitySearch from './CitySearch'

export default function InlineDestinationCreator({ onAdd }) {
  const [city, setCity] = useState(null)
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  const [error, setError] = useState('')

  const handleCitySelect = (c) => {
    setCity(c)
    setError('')
  }

  const handleArrivalChange = (val) => {
    setArrival(val)
    setError('')
    if (val && !departure) {
      setDeparture(format(addDays(new Date(val), 7), 'yyyy-MM-dd'))
    }
  }

  const handleAdd = () => {
    if (!city?.city) { setError('Pick a city first'); return }
    if (!arrival) { setError('Set an arrival date'); return }
    if (!departure) { setError('Set a departure date'); return }
    if (startOfDay(parseISO(departure)) <= startOfDay(parseISO(arrival))) {
      setError('Departure must be after arrival')
      return
    }
    onAdd({ city, arrival, departure })
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 sm:py-36 gap-6 px-4">
      <div className="text-center">
        <p className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-300">
          Where are you going?
        </p>
        <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">
          Search for your first destination to get started
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <CitySearch
          value={city}
          onChange={handleCitySelect}
          placeholder="Search for a city…"
        />

        {city && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Arrival</label>
              <input
                type="date"
                value={arrival}
                onChange={(e) => handleArrivalChange(e.target.value)}
                autoFocus
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-400 transition-colors bg-white dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Departure</label>
              <input
                type="date"
                value={departure}
                min={arrival || undefined}
                onChange={(e) => { setDeparture(e.target.value); setError('') }}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-400 transition-colors bg-white dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        )}

        {city && arrival && departure && (
          <button
            onClick={handleAdd}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
          >
            Start planning {city.city} →
          </button>
        )}

        {error && <p className="text-xs text-red-400 text-center">⚠ {error}</p>}
      </div>
    </div>
  )
}
