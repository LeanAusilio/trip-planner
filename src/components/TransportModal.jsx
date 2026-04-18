import { useState } from 'react'
import { format, parseISO, startOfDay } from 'date-fns'
import { TRANSPORT_CONFIG, TransportIcon } from './Icons'

export default function TransportModal({ editing, onSave, onClose }) {
  const [type, setType]                   = useState(editing?.type || 'flight')
  const [fromCity, setFromCity]           = useState(editing?.fromCity || '')
  const [toCity, setToCity]               = useState(editing?.toCity || '')
  const [departureDate, setDepartureDate] = useState(
    editing ? format(new Date(editing.departureDate), 'yyyy-MM-dd') : ''
  )
  const [departureTime, setDepartureTime] = useState(editing?.departureTime || '')
  const [arrivalDate, setArrivalDate]     = useState(
    editing ? format(new Date(editing.arrivalDate), 'yyyy-MM-dd') : ''
  )
  const [arrivalTime, setArrivalTime]     = useState(editing?.arrivalTime || '')
  const [carrier, setCarrier]             = useState(editing?.carrier || '')
  const [bookingRef, setBookingRef]       = useState(editing?.bookingRef || '')
  const [notes, setNotes]                 = useState(editing?.notes || '')
  const [budget, setBudget]               = useState(editing?.budget != null ? String(editing.budget) : '')
  const [error, setError]                 = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!fromCity.trim()) { setError('Please enter a departure city'); return }
    if (!toCity.trim())   { setError('Please enter an arrival city'); return }
    if (!departureDate)   { setError('Please set a departure date'); return }
    if (!arrivalDate)     { setError('Please set an arrival date'); return }

    const dep = startOfDay(parseISO(departureDate))
    const arr = startOfDay(parseISO(arrivalDate))
    if (arr < dep) { setError('Arrival date cannot be before departure date'); return }

    onSave({
      ...(editing ? { id: editing.id } : {}),
      type,
      fromCity: fromCity.trim(),
      toCity: toCity.trim(),
      departureDate: dep.toISOString(),
      arrivalDate: arr.toISOString(),
      ...(departureTime && { departureTime }),
      ...(arrivalTime   && { arrivalTime }),
      ...(carrier.trim()    && { carrier: carrier.trim() }),
      ...(bookingRef.trim() && { bookingRef: bookingRef.trim() }),
      ...(notes.trim()      && { notes: notes.trim() }),
      ...(budget !== '' && !isNaN(parseFloat(budget)) && { budget: parseFloat(budget) }),
    })
  }

  const cfg = TRANSPORT_CONFIG[type]

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.06)' }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {editing ? 'Edit transport' : 'Add transport'}
          </h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
          >✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs text-gray-400 dark:text-gray-500 mb-2">Type</label>
            <div className="grid grid-cols-5 gap-1.5">
              {Object.entries(TRANSPORT_CONFIG).map(([key, c]) => {
                const selected = type === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setType(key)}
                    style={selected ? { background: c.color, borderColor: c.color } : {}}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border transition-all ${
                      selected ? 'text-white' : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span style={selected ? {} : { filter: 'grayscale(1)', opacity: 0.5 }}>
                      <TransportIcon type={key} size={16} color={selected ? 'white' : cfg.color} />
                    </span>
                    <span className="text-[9px] font-medium leading-none">{c.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* From / To */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">From</label>
              <input
                type="text"
                value={fromCity}
                onChange={(e) => { setFromCity(e.target.value); setError('') }}
                placeholder="City or airport"
                autoFocus
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">To</label>
              <input
                type="text"
                value={toCity}
                onChange={(e) => { setToCity(e.target.value); setError('') }}
                placeholder="City or airport"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          </div>

          {/* Departure */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Departure date</label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => { setDepartureDate(e.target.value); setError('') }}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Departure time</label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          </div>

          {/* Arrival */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Arrival date</label>
              <input
                type="date"
                value={arrivalDate}
                min={departureDate || undefined}
                onChange={(e) => { setArrivalDate(e.target.value); setError('') }}
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

          {/* Optional details */}
          <details className="group">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-500 select-none list-none flex items-center gap-1">
              <span className="group-open:rotate-90 transition-transform inline-block">›</span>
              More details <span className="text-gray-300">(optional)</span>
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">
                  {type === 'flight' ? 'Airline' : type === 'train' ? 'Train operator' : type === 'ferry' ? 'Ferry operator' : 'Carrier'}
                </label>
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder={type === 'flight' ? 'e.g. Air France' : 'e.g. Eurostar'}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">
                  {type === 'flight' ? 'Flight number' : 'Booking reference'}
                </label>
                <input
                  type="text"
                  value={bookingRef}
                  onChange={(e) => setBookingRef(e.target.value)}
                  placeholder={type === 'flight' ? 'e.g. AF123' : 'e.g. BK-4921'}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Budget</label>
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
              <div>
                <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything to remember…"
                  rows={2}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none"
                />
              </div>
            </div>
          </details>

          {error && <p className="text-xs text-red-400">⚠ {error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-sm text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 rounded py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >Cancel</button>
            <button
              type="submit"
              className="flex-1 text-sm bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white rounded py-2 hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors font-medium"
            >{editing ? 'Save' : 'Add transport'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
