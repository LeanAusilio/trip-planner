import { useState, useEffect, useCallback } from 'react'
import { format, differenceInDays, startOfDay } from 'date-fns'
import Timeline from './components/Timeline'
import AddDestinationModal from './components/AddDestinationModal'
import ActivityModal from './components/ActivityModal'
import HotelModal from './components/HotelModal'
import TransportModal from './components/TransportModal'
import ExportModal from './components/ExportModal'
import DetailCard from './components/DetailCard'
import { Flag } from './components/CitySearch'
import { ACTIVITY_CONFIG, ActivityIcon, BedIcon, TRANSPORT_CONFIG, TransportIcon } from './components/Icons'

// ── Dark mode ──────────────────────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('trip-planner-dark')
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('trip-planner-dark', String(dark))
  }, [dark])

  return [dark, setDark]
}

// ── Storage ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'trip-planner-v2'

function loadState() {
  try {
    const v2 = localStorage.getItem(STORAGE_KEY)
    if (v2) {
      const s = JSON.parse(v2)
      return { ...s, transports: s.transports || [] }
    }
    const v1 = localStorage.getItem('trip-planner-v1')
    if (v1) return { destinations: JSON.parse(v1), hotels: [], activities: [], transports: [] }
  } catch { /* ignore */ }
  return { destinations: [], hotels: [], activities: [], transports: [] }
}

function sortByDate(arr, field) {
  return [...arr].sort((a, b) => new Date(a[field]) - new Date(b[field]))
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useDarkMode()
  const initial = loadState()
  const [destinations, setDestinations] = useState(sortByDate(initial.destinations, 'arrival'))
  const [hotels, setHotels]             = useState(sortByDate(initial.hotels, 'checkIn'))
  const [activities, setActivities]     = useState(initial.activities || [])
  const [transports, setTransports]     = useState(sortByDate(initial.transports, 'departureDate'))

  // Modals: { type: 'destination'|'activity'|'hotel', editing: obj|null, context: obj|null }
  const [modal, setModal] = useState(null)
  const [showExport, setShowExport] = useState(false)
  // Detail card: { kind: 'destination'|'hotel'|'activity', data, activities?, hotels?, destination? }
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ destinations, hotels, activities, transports }))
  }, [destinations, hotels, activities, transports])

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

  // ── Transports ──
  const saveTransport = (data) => {
    if (data.id) {
      setTransports((prev) => sortByDate(prev.map((t) => (t.id === data.id ? { ...t, ...data } : t)), 'departureDate'))
    } else {
      setTransports((prev) => sortByDate([...prev, { ...data, id: crypto.randomUUID() }], 'departureDate'))
    }
    setModal(null)
  }
  const deleteTransport = (id) => setTransports((prev) => prev.filter((t) => t.id !== id))

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

  // ── Detail card helpers ──
  const openDestCard = (dest) => {
    const destActivities = activities.filter((a) => a.destinationId === dest.id)
    const destHotels = hotels.filter((h) => {
      const hIn  = new Date(h.checkIn)
      const hOut = new Date(h.checkOut)
      const arr  = new Date(dest.arrival)
      const dep  = new Date(dest.departure)
      return hIn < dep && hOut > arr
    })
    setSelectedItem({ kind: 'destination', data: dest, activities: destActivities, hotels: destHotels })
  }
  const openHotelCard = (hotel) => setSelectedItem({ kind: 'hotel', data: hotel })
  const openActivityCard = (act) => {
    const dest = destinations.find((d) => d.id === act.destinationId)
    setSelectedItem({ kind: 'activity', data: act, destination: dest })
  }
  const openTransportCard = (transport) => setSelectedItem({ kind: 'transport', data: transport })

  const handleDetailEdit = () => {
    if (!selectedItem) return
    if (selectedItem.kind === 'destination') {
      setModal({ type: 'destination', editing: selectedItem.data })
    } else if (selectedItem.kind === 'hotel') {
      setModal({ type: 'hotel', editing: selectedItem.data })
    } else if (selectedItem.kind === 'activity') {
      const dest = selectedItem.destination
      setModal({ type: 'activity', editing: selectedItem.data, context: dest })
    } else if (selectedItem.kind === 'transport') {
      setModal({ type: 'transport', editing: selectedItem.data })
    }
    setSelectedItem(null)
  }

  // ── Stats ──
  const totalNights = destinations.reduce(
    (s, d) => s + differenceInDays(startOfDay(new Date(d.departure)), startOfDay(new Date(d.arrival))), 0
  )
  const vacCount  = destinations.filter((d) => d.type === 'vacation').length
  const bizCount  = destinations.filter((d) => d.type === 'business').length
  const hasData   = destinations.length > 0 || hotels.length > 0

  const totalBudget = [
    ...destinations.map((d) => d.budget ?? 0),
    ...hotels.map((h) => h.budget ?? 0),
    ...activities.map((a) => a.budget ?? 0),
    ...transports.map((t) => t.budget ?? 0),
  ].reduce((sum, b) => sum + b, 0)
  const hasBudget = totalBudget > 0

  return (
    <div className="min-h-screen relative transition-colors">
      {/* ── Background ── */}
      <div
        className="fixed inset-0 z-0 pointer-events-none select-none transition-[background-image] duration-500"
        style={{
          backgroundImage: `url(${dark ? '/travel-bg-dark.svg' : '/travel-bg-light.svg'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
        aria-hidden="true"
      />

      {/* ── Header ── */}
      <header className="relative z-10 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-8 py-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-6xl mx-auto gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h1 className="text-base font-medium text-gray-900 dark:text-gray-100 flex-shrink-0">Wayfar</h1>
            {hasData && (
              <div className="flex items-center gap-2 flex-wrap">
                {destinations.length > 0 && <>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">{totalNights} nights</span>
                </>}
                {vacCount > 0 && <>
                  <span className="text-xs text-gray-300 hidden sm:inline">·</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full hidden sm:inline" style={{ background: '#f0f9ff', color: '#0369a1' }}>{vacCount} vacation</span>
                </>}
                {bizCount > 0 && <>
                  <span className="text-xs text-gray-300 hidden sm:inline">·</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full hidden sm:inline" style={{ background: '#f5f3ff', color: '#6d28d9' }}>{bizCount} business</span>
                </>}
                {hasBudget && <>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: '#f0fdf4', color: '#166534' }}>
                    ${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </>}
              </div>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            {hasData && (
              <button
                onClick={() => setShowExport(true)}
                className="text-sm border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-400 dark:text-gray-500 flex items-center gap-1.5"
              >
                ↑ Export
              </button>
            )}
            <button
              onClick={() => setModal({ type: 'transport', editing: null })}
              className="text-sm border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 flex items-center gap-1.5"
            >
              <TransportIcon type="flight" size={13} color="#9ca3af" />
              Add transport
            </button>
            <button
              onClick={() => setModal({ type: 'hotel', editing: null })}
              className="text-sm border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 flex items-center gap-1.5"
            >
              <BedIcon size={13} color="#9ca3af" />
              Add hotel
            </button>
            <button
              onClick={() => setModal({ type: 'destination', editing: null })}
              className="text-sm border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
            >
              + Add destination
            </button>
            <button
              onClick={() => setDark((d) => !d)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-400 dark:text-gray-500"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? '☀' : '☾'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 dark:text-gray-100">
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
            <section className="mb-12 -mx-4 sm:mx-0 px-4 sm:px-0">
              <Timeline
                destinations={destinations}
                activities={activities}
                hotels={hotels}
                transports={transports}
                dark={dark}
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
                onClickDest={openDestCard}
                onClickHotel={openHotelCard}
                onClickActivity={openActivityCard}
                onClickTransport={openTransportCard}
                onEditTransport={(t) => setModal({ type: 'transport', editing: t })}
                onDeleteTransport={deleteTransport}
              />
            </section>

            {/* ── Destination list ── */}
            {destinations.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-3">
                  Destinations
                </h2>
                <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                  {destinations.map((dest, idx) => {
                    const nights = differenceInDays(startOfDay(new Date(dest.departure)), startOfDay(new Date(dest.arrival)))
                    const destActivities = activities.filter((a) => a.destinationId === dest.id)
                    const isVacation = dest.type === 'vacation'

                    return (
                      <div
                        key={dest.id}
                        className={idx < destinations.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}
                      >
                        {/* Destination row */}
                        <div
                          className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                          onClick={() => openDestCard(dest)}
                        >
                          <Flag code={dest.countryCode} country={dest.country} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{dest.city}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-500">{dest.country}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                                background: isVacation ? '#f0f9ff' : '#f5f3ff',
                                color: isVacation ? '#0369a1' : '#6d28d9',
                              }}>
                                {dest.type}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {format(new Date(dest.arrival), 'MMM d')} – {format(new Date(dest.departure), 'MMM d, yyyy')}
                              <span className="mx-1.5 text-gray-200">·</span>
                              {nights} night{nights !== 1 ? 's' : ''}
                              {destActivities.length > 0 && (
                                <span className="ml-2">
                                  <span className="text-gray-200 mr-1.5">·</span>
                                  {destActivities.length} activit{destActivities.length !== 1 ? 'ies' : 'y'}
                                </span>
                              )}
                              {dest.budget != null && (
                                <span className="ml-2 font-medium" style={{ color: '#166534' }}>
                                  <span className="text-gray-200 mr-1.5">·</span>
                                  ${dest.budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="hidden sm:flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
                          <div className="px-5 pb-3 flex flex-wrap gap-2 hidden sm:flex">
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
                <h2 className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BedIcon size={11} color="#9ca3af" /> Hotels
                </h2>
                <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                  {hotels.map((hotel, idx) => {
                    const nights = differenceInDays(startOfDay(new Date(hotel.checkOut)), startOfDay(new Date(hotel.checkIn)))
                    return (
                      <div
                        key={hotel.id}
                        onClick={() => openHotelCard(hotel)}
                        className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer ${
                          idx < hotels.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                        }`}
                      >
                        <BedIcon size={15} color="#a8a29e" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{hotel.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Check-in {format(new Date(hotel.checkIn), 'MMM d')} · Check-out {format(new Date(hotel.checkOut), 'MMM d, yyyy')}
                            <span className="mx-1.5 text-gray-200">·</span>
                            {nights} night{nights !== 1 ? 's' : ''}
                            {hotel.budget != null && (
                              <span className="ml-2 font-medium" style={{ color: '#166534' }}>
                                <span className="text-gray-200 mr-1.5">·</span>
                                ${hotel.budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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

            {/* ── Transport list ── */}
            {transports.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <TransportIcon type="flight" size={11} color="#9ca3af" /> Transports
                </h2>
                <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                  {transports.map((t, idx) => {
                    const cfg = TRANSPORT_CONFIG[t.type]
                    return (
                      <div
                        key={t.id}
                        onClick={() => openTransportCard(t)}
                        className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer ${
                          idx < transports.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                        }`}
                      >
                        <span className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: cfg.lightBg, border: `1px solid ${cfg.lightBorder}` }}>
                          <TransportIcon type={t.type} size={13} color={cfg.color} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {t.fromCity} → {t.toCity}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {cfg.label} · {format(new Date(t.departureDate), 'MMM d')}
                            {t.departureDate !== t.arrivalDate && ` – ${format(new Date(t.arrivalDate), 'MMM d, yyyy')}`}
                            {t.carrier && <span className="ml-1.5 text-gray-400">· {t.carrier}</span>}
                            {t.budget != null && (
                              <span className="ml-2 font-medium" style={{ color: '#166534' }}>
                                <span className="text-gray-200 mr-1.5">·</span>
                                ${t.budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setModal({ type: 'transport', editing: t })}
                            className="text-xs text-gray-400 hover:text-gray-600 px-2.5 py-1.5 rounded border border-transparent hover:border-gray-200 transition-colors"
                          >Edit</button>
                          <button
                            onClick={() => deleteTransport(t.id)}
                            className="text-xs text-gray-300 hover:text-red-400 px-2.5 py-1.5 rounded border border-transparent hover:border-red-100 transition-colors"
                          >Delete</button>
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
      {modal?.type === 'transport' && (
        <TransportModal
          editing={modal.editing}
          onSave={saveTransport}
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
      <DetailCard
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onEdit={handleDetailEdit}
      />
    </div>
  )
}

