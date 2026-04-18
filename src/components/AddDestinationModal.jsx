import { useState } from 'react'
import { format, parseISO, startOfDay } from 'date-fns'
import CitySearch from './CitySearch'

export default function AddDestinationModal({ editing, destinations, onAdd, onUpdate, onClose }) {
  const [city, setCity] = useState(
    editing
      ? { city: editing.city, country: editing.country, countryCode: editing.countryCode }
      : null
  )
  const [arrival, setArrival] = useState(
    editing ? format(new Date(editing.arrival), 'yyyy-MM-dd') : ''
  )
  const [departure, setDeparture] = useState(
    editing ? format(new Date(editing.departure), 'yyyy-MM-dd') : ''
  )
  const [type, setType] = useState(editing?.type || 'vacation')
  const [airline, setAirline] = useState(editing?.airline || '')
  const [flightNumber, setFlightNumber] = useState(editing?.flightNumber || '')
  const [departureTime, setDepartureTime] = useState(editing?.departureTime || '')
  const [arrivalTime, setArrivalTime] = useState(editing?.arrivalTime || '')
  const [notes, setNotes] = useState(editing?.notes || '')
  const [budget, setBudget] = useState(editing?.budget != null ? String(editing.budget) : '')
  const [error, setError] = useState('')

  const validate = () => {
    if (!city?.city) return 'Please select a city'
    if (!city?.countryCode) return 'Could not determine country — try a different search'
    if (!arrival) return 'Please set an arrival date'
    if (!departure) return 'Please set a departure date'
    const arr = startOfDay(parseISO(arrival))
    const dep = startOfDay(parseISO(departure))
    if (dep < arr) return 'Departure cannot be before arrival'

    const others = editing ? destinations.filter((d) => d.id !== editing.id) : destinations
    const overlaps = others.some((d) => {
      const dArr = startOfDay(new Date(d.arrival))
      const dDep = startOfDay(new Date(d.departure))
      return arr < dDep && dep > dArr
    })
    if (overlaps) return 'These dates overlap with an existing destination'
    return null
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const err = validate()
    if (err) {
      setError(err)
      return
    }

    const dest = {
      city: city.city,
      country: city.country,
      countryCode: city.countryCode,
      ...(city.lat != null && { lat: city.lat, lng: city.lng }),
      arrival: startOfDay(parseISO(arrival)).toISOString(),
      departure: startOfDay(parseISO(departure)).toISOString(),
      type,
      ...(airline && { airline }),
      ...(flightNumber && { flightNumber }),
      ...(departureTime && { departureTime }),
      ...(arrivalTime && { arrivalTime }),
      ...(notes && { notes }),
      ...(budget !== '' && !isNaN(parseFloat(budget)) && { budget: parseFloat(budget) }),
    }

    if (editing) {
      onUpdate(dest)
    } else {
      onAdd(dest)
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.06)' }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {editing ? 'Edit destination' : 'Add destination'}
          </h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors rounded"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* City */}
          <div>
            <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">City</label>
            <CitySearch
              value={city}
              onChange={(c) => { setCity(c); setError('') }}
              placeholder="Search for a city…"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Arrival</label>
              <input
                type="date"
                value={arrival}
                onChange={(e) => { setArrival(e.target.value); setError('') }}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Departure</label>
              <input
                type="date"
                value={departure}

                onChange={(e) => { setDeparture(e.target.value); setError('') }}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Type</label>
            <div className="flex gap-2">
              {[
                { key: 'vacation', label: 'Vacation' },
                { key: 'business', label: 'Business' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  className={`flex-1 text-xs py-2 rounded border transition-colors ${
                    type === key
                      ? key === 'vacation'
                        ? 'bg-sky-50 border-sky-200 text-sky-700 font-medium'
                        : 'bg-violet-50 border-violet-200 text-violet-700 font-medium'
                      : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300 hover:text-gray-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">
              Budget <span className="text-gray-300">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
              <input
                type="number"
                value={budget}
                min="0"
                step="0.01"
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-200 rounded pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          </div>

          {/* Flight details */}
          <details className="group">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-500 select-none list-none flex items-center gap-1">
              <span className="group-open:rotate-90 transition-transform inline-block">›</span>
              Flight details <span className="text-gray-300">(optional)</span>
            </summary>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Airline</label>
                  <input
                    type="text"
                    value={airline}
                    onChange={(e) => setAirline(e.target.value)}
                    placeholder="e.g. Air France"
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Flight number</label>
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="e.g. AF123"
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Departure time</label>
                  <input
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Arrival time</label>
                  <input
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything else to remember…"
                  rows={2}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none"
                />
              </div>
            </div>
          </details>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <span>⚠</span> {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-sm text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 rounded py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 text-sm bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white rounded py-2 hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors font-medium"
            >
              {editing ? 'Save changes' : 'Add destination'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
