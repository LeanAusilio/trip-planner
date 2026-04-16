import { useState } from 'react'
import { format, parseISO, startOfDay } from 'date-fns'
import { ACTIVITY_CONFIG, ActivityIcon } from './Icons'

export default function ActivityModal({ destination, editing, onSave, onClose }) {
  const [type, setType] = useState(editing?.type || 'restaurant')
  const [name, setName] = useState(editing?.name || '')
  const [date, setDate] = useState(
    editing
      ? format(new Date(editing.date), 'yyyy-MM-dd')
      : format(new Date(destination.arrival), 'yyyy-MM-dd')
  )
  const [error, setError] = useState('')

  const arrivalStr = format(new Date(destination.arrival), 'yyyy-MM-dd')
  const departureStr = format(new Date(destination.departure), 'yyyy-MM-dd')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!date) { setError('Please pick a date'); return }

    const chosen = startOfDay(parseISO(date))
    const arr = startOfDay(new Date(destination.arrival))
    const dep = startOfDay(new Date(destination.departure))

    if (chosen < arr || chosen >= dep) {
      setError(`Date must be within your stay (${format(arr, 'MMM d')} – ${format(dep, 'MMM d')})`)
      return
    }

    onSave({
      ...(editing ? { id: editing.id } : {}),
      destinationId: destination.id,
      type,
      name: name.trim() || ACTIVITY_CONFIG[type].label,
      date: startOfDay(parseISO(date)).toISOString(),
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
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium text-gray-900">
            {editing ? 'Edit activity' : 'Add activity'}
          </h2>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors">
            ✕
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-5">{destination.city}, {destination.country}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(ACTIVITY_CONFIG).map(([key, cfg]) => {
                const selected = type === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setType(key)}
                    style={selected ? { background: cfg.color, borderColor: cfg.color } : {}}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border transition-all ${
                      selected
                        ? 'text-white'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <span style={selected ? {} : { filter: 'grayscale(1)', opacity: 0.5 }}>
                      <ActivityIcon type={key} size={18} />
                    </span>
                    <span className="text-[10px] font-medium leading-none">
                      {cfg.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              Name <span className="text-gray-300">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={ACTIVITY_CONFIG[type].label}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              min={arrivalStr}
              max={departureStr}
              onChange={(e) => { setDate(e.target.value); setError('') }}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
            />
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
              {editing ? 'Save' : 'Add activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
