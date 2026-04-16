import { useState } from 'react'
import { format, parseISO, startOfDay, isBefore } from 'date-fns'
import { BedIcon } from './Icons'

export default function HotelModal({ editing, hotels, onSave, onClose }) {
  const [name, setName] = useState(editing?.name || '')
  const [checkIn, setCheckIn] = useState(
    editing ? format(new Date(editing.checkIn), 'yyyy-MM-dd') : ''
  )
  const [checkOut, setCheckOut] = useState(
    editing ? format(new Date(editing.checkOut), 'yyyy-MM-dd') : ''
  )
  const [error, setError] = useState('')

  const validate = () => {
    if (!name.trim()) return 'Please enter a hotel name'
    if (!checkIn) return 'Please set a check-in date'
    if (!checkOut) return 'Please set a check-out date'
    const ci = startOfDay(parseISO(checkIn))
    const co = startOfDay(parseISO(checkOut))
    if (!isBefore(ci, co)) return 'Check-out must be after check-in'

    const others = editing ? hotels.filter((h) => h.id !== editing.id) : hotels
    const overlaps = others.some((h) => {
      const hCi = startOfDay(new Date(h.checkIn))
      const hCo = startOfDay(new Date(h.checkOut))
      return ci < hCo && co > hCi
    })
    if (overlaps) return 'Dates overlap with another hotel'
    return null
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    onSave({
      ...(editing ? { id: editing.id } : {}),
      name: name.trim(),
      checkIn: startOfDay(parseISO(checkIn)).toISOString(),
      checkOut: startOfDay(parseISO(checkOut)).toISOString(),
    })
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.06)' }}
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BedIcon size={15} color="#9ca3af" />
            <h2 className="text-sm font-medium text-gray-900">
              {editing ? 'Edit hotel' : 'Add hotel'}
            </h2>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Hotel name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              placeholder="e.g. Hotel Ritz"
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Check-in</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => { setCheckIn(e.target.value); setError('') }}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Check-out</label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || undefined}
                onChange={(e) => { setCheckOut(e.target.value); setError('') }}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-400">⚠ {error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-sm text-gray-400 border border-gray-200 rounded py-2 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 text-sm bg-gray-900 text-white rounded py-2 hover:bg-gray-700 transition-colors font-medium"
            >
              {editing ? 'Save' : 'Add hotel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
