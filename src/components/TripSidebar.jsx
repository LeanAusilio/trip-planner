import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { Flag } from './CitySearch'

const DEFAULT_MAX_TRIPS = 3

function TripRow({ trip, isActive, onSelect, onDelete, onRename }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(trip.name)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const commitRename = () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== trip.name) onRename(trip.id, trimmed)
    else setName(trip.name)
    setEditing(false)
  }

  const firstDest = trip.destinations?.[0]
  const lastDest  = trip.destinations?.[trip.destinations.length - 1]
  const dateRange = firstDest && lastDest
    ? `${format(new Date(firstDest.arrival), 'MMM d')} – ${format(new Date(lastDest.departure), 'MMM yyyy')}`
    : 'No dates yet'

  return (
    <div
      onClick={() => !editing && onSelect(trip.id)}
      className={`group relative px-4 py-3.5 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${
        isActive
          ? 'bg-gray-50 dark:bg-gray-800/60'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
      }`}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r bg-gray-400 dark:bg-gray-500" />
      )}

      <div className="flex items-start gap-2">
        {firstDest ? (
          <Flag code={firstDest.countryCode} country={firstDest.country} />
        ) : (
          <span className="text-base leading-none mt-0.5">✈</span>
        )}

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setName(trip.name); setEditing(false) } }}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-sm font-medium bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 focus:outline-none focus:border-gray-400"
            />
          ) : (
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{trip.name}</p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{dateRange}</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">
            {trip.destinations?.length || 0} dest · {trip.hotels?.length || 0} hotels
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setEditing(true)}
            className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-colors"
            title="Rename"
          >✎</button>
          <button
            onClick={() => { if (window.confirm(`Delete "${trip.name}"?`)) onDelete(trip.id) }}
            className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 transition-colors"
            title="Delete"
          >✕</button>
        </div>
      </div>
    </div>
  )
}

export default function TripSidebar({ trips, activeTripId, open, onClose, onSelect, onAdd, onNew, onDelete, onRename, dark, tripLimit = DEFAULT_MAX_TRIPS }) {
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const inputRef = useRef(null)
  const atLimit = trips.length >= tripLimit

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  const handleAdd = () => {
    const name = newName.trim() || `Trip ${trips.length + 1}`
    onAdd(name)
    setNewName('')
    setAdding(false)
  }

  // Close on backdrop click or Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/20 dark:bg-black/40 sm:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed left-0 top-0 bottom-0 z-30 w-64 flex flex-col
          bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shadow-lg
          transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">My Trips</span>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors -mr-2.5"
          >✕</button>
        </div>

        {/* Trip list */}
        <div className="flex-1 overflow-y-auto">
          {trips.map((trip) => (
            <TripRow
              key={trip.id}
              trip={trip}
              isActive={trip.id === activeTripId}
              onSelect={onSelect}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </div>

        {/* Add trip */}
        <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800">
          {adding ? (
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewName('') } }}
                placeholder="Trip name…"
                className="flex-1 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-gray-400 text-gray-800 dark:text-gray-200"
              />
              <button
                onClick={handleAdd}
                className="text-sm bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white rounded px-3 py-1.5 hover:bg-gray-700 transition-colors font-medium"
              >Add</button>
            </div>
          ) : atLimit ? (
            <p className="text-xs text-gray-300 dark:text-gray-600 text-center py-1">3-trip limit reached</p>
          ) : (
            <button
              onClick={onNew ?? (() => setAdding(true))}
              className="w-full text-sm text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg py-2 hover:border-gray-300 hover:text-gray-500 dark:hover:border-gray-600 dark:hover:text-gray-400 transition-colors"
            >+ New trip</button>
          )}
        </div>
      </div>
    </>
  )
}
