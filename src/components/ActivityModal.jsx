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
  const [address, setAddress] = useState(editing?.address || '')
  const [phone, setPhone] = useState(editing?.phone || '')
  const [notes, setNotes] = useState(editing?.notes || '')
  const [website, setWebsite] = useState(editing?.website || '')
  const [openingHours, setOpeningHours] = useState(editing?.openingHours || '')
  const [reservationRef, setReservationRef] = useState(editing?.reservationRef || '')
  const [doctorName, setDoctorName] = useState(editing?.doctorName || '')
  const [time, setTime] = useState(editing?.time || '')
  const [budget, setBudget] = useState(editing?.budget != null ? String(editing.budget) : '')
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
      ...(address && { address: address.trim() }),
      ...(phone && { phone: phone.trim() }),
      ...(notes && { notes: notes.trim() }),
      ...(website && { website: website.trim() }),
      ...(openingHours && { openingHours: openingHours.trim() }),
      ...(reservationRef && { reservationRef: reservationRef.trim() }),
      ...(doctorName && { doctorName: doctorName.trim() }),
      ...(time && { time }),
      ...(budget !== '' && !isNaN(parseFloat(budget)) && { budget: parseFloat(budget) }),
    })
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
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {editing ? 'Edit activity' : 'Add activity'}
          </h2>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors">
            ✕
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">{destination.city}, {destination.country}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs text-gray-400 dark:text-gray-500 mb-2">Type</label>
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
                        : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300'
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
            <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">
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
            <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              min={arrivalStr}
              max={departureStr}
              onChange={(e) => { setDate(e.target.value); setError('') }}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          {/* Type-specific details */}
          <details className="group">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-500 select-none list-none flex items-center gap-1">
              <span className="group-open:rotate-90 transition-transform inline-block">›</span>
              More details <span className="text-gray-300">(optional)</span>
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              {type === 'restaurant' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Phone</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555 000 0000"
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Reservation ref</label>
                    <input type="text" value={reservationRef} onChange={(e) => setReservationRef(e.target.value)}
                      placeholder="e.g. RES-4921"
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
                  </div>
                </>
              )}

              {(type === 'attraction' || type === 'shopping') && (
                <div>
                  <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Website</label>
                  <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://…"
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
                </div>
              )}

              {type === 'attraction' && (
                <div>
                  <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Opening hours</label>
                  <input type="text" value={openingHours} onChange={(e) => setOpeningHours(e.target.value)}
                    placeholder="e.g. Mon–Fri 9:00–18:00"
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
                </div>
              )}

              {type === 'medical' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Doctor / provider</label>
                    <input type="text" value={doctorName} onChange={(e) => setDoctorName(e.target.value)}
                      placeholder="Dr. Smith"
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Appointment time</label>
                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5">Phone</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555 000 0000"
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
                  </div>
                </>
              )}

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
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything to remember…" rows={2}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none" />
              </div>
            </div>
          </details>

          {error && <p className="text-xs text-red-400">⚠ {error}</p>}

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
              {editing ? 'Save' : 'Add activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
