import { useState, useEffect } from 'react'
import { format, differenceInDays, startOfDay } from 'date-fns'
import Timeline from './components/Timeline'
import AddDestinationModal from './components/AddDestinationModal'
import ActivityModal from './components/ActivityModal'
import HotelModal from './components/HotelModal'
import ExportModal from './components/ExportModal'
import { Flag } from './components/CitySearch'
import { ACTIVITY_CONFIG, ActivityIcon, BedIcon } from './components/Icons'

// ── Storage ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'trip-planner-v2'

function loadState() {
  try {
    const v2 = localStorage.getItem(STORAGE_KEY)
    if (v2) return JSON.parse(v2)
    // migrate from v1
    const v1 = localStorage.getItem('trip-planner-v1')
    if (v1) return { destinations: JSON.parse(v1), hotels: [], activities: [] }
  } catch { /* ignore */ }
  return { destinations: [], hotels: [], activities: [] }
}

function sortByDate(arr, field) {
  return [...arr].sort((a, b) => new Date(a[field]) - new Date(b[field]))
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const initial = loadState()
  const [destinations, setDestinations] = useState(sortByDate(initial.destinations, 'arrival'))
  const [hotels, setHotels]             = useState(sortByDate(initial.hotels, 'checkIn'))
  const [activities, setActivities]     = useState(initial.activities || [])

  // Modals: { type: 'destination'|'activity'|'hotel', editing: obj|null, context: obj|null }
  const [modal, setModal] = useState(null)
  const [showExport, setShowExport] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ destinations, hotels, activities }))
  }, [destinations, hotels, activities])

  // ── Destinations ──
  const addDestination = (dest) => {
    setDestinations((prev) => sortByDate([...prev, { ...dest, id: crypto.randomUUID() }], 'arrival'))
    setModal(null)
  }
  const updateDestination = (id, updates) => {
    setDestinations((prev) => sortByDate(prev.map((d) => (d.id === id ? { ...d, ...updates } : d)), 'arrival'))
  }
  const deleteDestination = (id) => {
    setDestinations((prev) => prev.filter((d) => d.id !== id))
    setActivities((prev) => prev.filter((a) => a.destinationId !== id))
  }

  // ── Hotels ──
  const addHotel = (hotel) => {
    setHotels((prev) => sortByDate([...prev, { ...hotel, id: crypto.randomUUID() }], 'checkIn'))
    setModal(null)
  }
  const updateHotel = (id, updates) => {
    setHotels((prev) => sortByDate(prev.map((h) => (h.id === id ? { ...h, ...updates } : h)), 'checkIn'))
    setModal(null)
  }
  const deleteHotel = (id) => setHotels((prev) => prev.filter((h) => h.id !== id))

  // ── Activities ──
  const saveActivity = (data) => {
    if (data.id) {
      setActivities((prev) => prev.map((a) => (a.id === data.id ? { ...a, ...data } : a)))
    } else {
      setActivities((prev) => [...prev, { ...data, id: crypto.randomUUID() }])
    }
    setModal(null)
  }
  const deleteActivity = (id) => setActivities((prev) => prev.filter((a) => a.id !== id))

  // ── Stats ──
  const totalNights = destinations.reduce(
    (s, d) => s + differenceInDays(startOfDay(new Date(d.departure)), startOfDay(new Date(d.arrival))), 0
  )
  const vacCount  = destinations.filter((d) => d.type === 'vacation').length
  const bizCount  = destinations.filter((d) => d.type === 'business').length
  const hasData   = destinations.length > 0 || hotels.length > 0

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ── */}
      <header className="border-b border-gray-100 px-8 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-medium text-gray-900">Trip Planner</h1>
            {hasData && (
              <div className="flex items-center gap-2 ml-1">
                {destinations.length > 0 && <>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{totalNights} nights</span>
                </>}
                {vacCount > 0 && <>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#f0f9ff', color: '#0369a1' }}>{vacCount} vacation</span>
                </>}
                {bizCount > 0 && <>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#f5f3ff', color: '#6d28d9' }}>{bizCount} business</span>
                </>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasData && (
              <button
                onClick={() => setShowExport(true)}
                className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-400 flex items-center gap-1.5"
              >
                ↑ Export
              </button>
            )}
            <button
              onClick={() => setModal({ type: 'hotel', editing: null })}
              className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 flex items-center gap-1.5"
            >
              <BedIcon size={13} color="#9ca3af" />
              Add hotel
            </button>
            <button
              onClick={() => setModal({ type: 'destination', editing: null })}
              className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
            >
              + Add destination
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-6xl mx-auto px-8 py-8">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="text-3xl mb-4" style={{ filter: 'grayscale(1)', opacity: 0.18 }}>✈</div>
            <p className="text-sm text-gray-300 mb-1">No trips planned yet</p>
            <p className="text-xs text-gray-200 mb-5">Start by adding a destination</p>
            <button
              onClick={() => setModal({ type: 'destination', editing: null })}
              className="text-xs border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-400"
            >
              Add your first destination
            </button>
          </div>
        ) : (
          <>
            {/* Timeline */}
            <section className="mb-12">
              <Timeline
                destinations={destinations}
                activities={activities}
                hotels={hotels}
                onUpdateDest={updateDestination}
                onEditDest={(dest) => setModal({ type: 'destination', editing: dest })}
                onDeleteDest={deleteDestination}
                onEditActivity={(act) => {
                  const dest = destinations.find((d) => d.id === act.destinationId)
                  setModal({ type: 'activity', editing: act, context: dest })
                }}
                onDeleteActivity={deleteActivity}
                onEditHotel={(hotel) => setModal({ type: 'hotel', editing: hotel })}
                onDeleteHotel={deleteHotel}
              />
            </section>

            {/* ── Destination list ── */}
            {destinations.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                  Destinations
                </h2>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  {destinations.map((dest, idx) => {
                    const nights = differenceInDays(startOfDay(new Date(dest.departure)), startOfDay(new Date(dest.arrival)))
                    const destActivities = activities.filter((a) => a.destinationId === dest.id)
                    const isVacation = dest.type === 'vacation'

                    return (
                      <div
                        key={dest.id}
                        className={idx < destinations.length - 1 ? 'border-b border-gray-100' : ''}
                      >
                        {/* Destination row */}
                        <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                          <Flag code={dest.countryCode} country={dest.country} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-800">{dest.city}</span>
                              <span className="text-xs text-gray-400">{dest.country}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                                background: isVacation ? '#f0f9ff' : '#f5f3ff',
                                color: isVacation ? '#0369a1' : '#6d28d9',
                              }}>
                                {dest.type}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {format(new Date(dest.arrival), 'MMM d')} – {format(new Date(dest.departure), 'MMM d, yyyy')}
                              <span className="mx-1.5 text-gray-200">·</span>
                              {nights} night{nights !== 1 ? 's' : ''}
                              {destActivities.length > 0 && (
                                <span className="ml-2">
                                  <span className="text-gray-200 mr-1.5">·</span>
                                  {destActivities.length} activit{destActivities.length !== 1 ? 'ies' : 'y'}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => setModal({ type: 'activity', editing: null, context: dest })}
                              className="text-xs text-gray-400 hover:text-gray-600 px-2.5 py-1.5 rounded border border-transparent hover:border-gray-200 transition-colors"
                            >
                              + Activity
                            </button>
                            <button
                              onClick={() => setModal({ type: 'destination', editing: dest })}
                              className="text-xs text-gray-400 hover:text-gray-600 px-2.5 py-1.5 rounded border border-transparent hover:border-gray-200 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteDestination(dest.id)}
                              className="text-xs text-gray-300 hover:text-red-400 px-2.5 py-1.5 rounded border border-transparent hover:border-red-100 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Activities for this destination */}
                        {destActivities.length > 0 && (
                          <div className="px-5 pb-3 flex flex-wrap gap-2">
                            {destActivities
                              .sort((a, b) => new Date(a.date) - new Date(b.date))
                              .map((act) => {
                                const cfg = ACTIVITY_CONFIG[act.type]
                                return (
                                  <div
                                    key={act.id}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                                    style={{ background: cfg.lightBg, border: `1px solid ${cfg.lightBorder}`, color: cfg.color }}
                                  >
                                    <span style={{ display: 'flex', alignItems: 'center' }}>
                                      <ActivityIcon type={act.type} size={11} color={cfg.color} />
                                    </span>
                                    <span className="font-medium">{act.name}</span>
                                    <span style={{ opacity: 0.7 }}>{format(new Date(act.date), 'MMM d')}</span>
                                    <button
                                      onClick={() => setModal({ type: 'activity', editing: act, context: dest })}
                                      className="opacity-50 hover:opacity-100 transition-opacity"
                                    >✎</button>
                                    <button
                                      onClick={() => deleteActivity(act.id)}
                                      className="opacity-40 hover:opacity-100 transition-opacity"
                                    >✕</button>
                                  </div>
                                )
                              })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── Hotel list ── */}
            {hotels.length > 0 && (
              <section>
                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BedIcon size={11} color="#9ca3af" /> Hotels
                </h2>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  {hotels.map((hotel, idx) => {
                    const nights = differenceInDays(startOfDay(new Date(hotel.checkOut)), startOfDay(new Date(hotel.checkIn)))
                    return (
                      <div
                        key={hotel.id}
                        className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors ${
                          idx < hotels.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        <BedIcon size={15} color="#a8a29e" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700">{hotel.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Check-in {format(new Date(hotel.checkIn), 'MMM d')} · Check-out {format(new Date(hotel.checkOut), 'MMM d, yyyy')}
                            <span className="mx-1.5 text-gray-200">·</span>
                            {nights} night{nights !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setModal({ type: 'hotel', editing: hotel })}
                            className="text-xs text-gray-400 hover:text-gray-600 px-2.5 py-1.5 rounded border border-transparent hover:border-gray-200 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteHotel(hotel.id)}
                            className="text-xs text-gray-300 hover:text-red-400 px-2.5 py-1.5 rounded border border-transparent hover:border-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* ── Modals ── */}
      {modal?.type === 'destination' && (
        <AddDestinationModal
          editing={modal.editing}
          destinations={destinations}
          onAdd={addDestination}
          onUpdate={(updates) => { updateDestination(modal.editing.id, updates); setModal(null) }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'activity' && modal.context && (
        <ActivityModal
          destination={modal.context}
          editing={modal.editing}
          onSave={saveActivity}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'hotel' && (
        <HotelModal
          editing={modal.editing}
          hotels={hotels}
          onSave={(data) => {
            if (data.id) updateHotel(data.id, data)
            else addHotel(data)
          }}
          onClose={() => setModal(null)}
        />
      )}
      {showExport && (
        <ExportModal
          destinations={destinations}
          hotels={hotels}
          activities={activities}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}

