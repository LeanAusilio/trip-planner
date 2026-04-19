import { useState, useEffect, useCallback, useRef } from 'react'
import { uuid } from './lib/uuid'
import { format, differenceInDays, startOfDay } from 'date-fns'
import QuickStartModal from './components/quickstart/QuickStartModal'
import Timeline from './components/Timeline'
import AddDestinationModal from './components/AddDestinationModal'
import ActivityModal from './components/ActivityModal'
import HotelModal from './components/HotelModal'
import TransportModal from './components/TransportModal'
import ExportModal from './components/ExportModal'
import DetailCard from './components/DetailCard'
import TripSidebar from './components/TripSidebar'
import PackingList from './components/PackingList'
import WeatherWidget from './components/WeatherWidget'
import MapView from './components/MapView'
import SummaryDashboard from './components/SummaryDashboard'
import { Flag } from './components/CitySearch'
import { ACTIVITY_CONFIG, ActivityIcon, BedIcon, TRANSPORT_CONFIG, TransportIcon, PlaneIcon, SuitcaseIcon } from './components/Icons'

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
const STORAGE_KEY = 'trip-planner-v3'

function makeTrip(name, data = {}) {
  return {
    id: uuid(),
    name,
    createdAt: new Date().toISOString(),
    destinations: data.destinations || [],
    hotels: data.hotels || [],
    activities: data.activities || [],
    transports: data.transports || [],
    packingList: data.packingList || [],
    currency: data.currency || 'USD',
  }
}

function loadState() {
  try {
    const v3 = localStorage.getItem(STORAGE_KEY)
    if (v3) {
      const s = JSON.parse(v3)
      if (s.trips && s.trips.length > 0) return s
    }
    // v2 stored a flat { destinations, hotels, activities, transports } object.
    // Wrap it in a single trip so existing user data is preserved on first load.
    const v2 = localStorage.getItem('trip-planner-v2')
    if (v2) {
      const s = JSON.parse(v2)
      const trip = makeTrip('My Trip', { ...s, transports: s.transports || [] })
      return { trips: [trip], activeTripId: trip.id }
    }
  } catch { /* ignore */ }
  const trip = makeTrip('My Trip')
  return { trips: [trip], activeTripId: trip.id }
}

function sortByDate(arr, field) {
  return [...arr].sort((a, b) => new Date(a[field]) - new Date(b[field]))
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useDarkMode()
  const [trips, setTrips] = useState(() => loadState().trips)
  const [activeTripId, setActiveTripId] = useState(() => { const s = loadState(); return s.activeTripId || s.trips[0]?.id })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [modal, setModal] = useState(null)
  const [showExport, setShowExport] = useState(false)
  const [showQuickStart, setShowQuickStart] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [destSplit, setDestSplit] = useState(63) // % width of destinations column on desktop
  const twoColRef = useRef(null)

  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ trips, activeTripId }))
  }, [trips, activeTripId])

  // ── Active trip helpers ──
  const activeTrip = trips.find((t) => t.id === activeTripId) || trips[0]
  const { destinations, hotels, activities, transports, packingList, currency: tripCurrency = 'USD' } = activeTrip || {
    destinations: [], hotels: [], activities: [], transports: [], packingList: [], currency: 'USD',
  }

  const updateActiveTrip = useCallback((updates) => {
    setTrips((prev) => prev.map((t) => (t.id === activeTripId ? { ...t, ...updates } : t)))
  }, [activeTripId])

  const setCurrency = useCallback((c) => updateActiveTrip({ currency: c }), [updateActiveTrip])

  // ── Trip management ──
  const addTripWithData = useCallback(({ name, destinations, hotels, activities }) => {
    const sortedDests = sortByDate(
      destinations.map((d) => ({ ...d, id: uuid(), type: 'vacation' })),
      'arrival'
    )
    const firstDestId = sortedDests[0]?.id
    const trip = makeTrip(name, {
      destinations: sortedDests,
      hotels: sortByDate(hotels.map((h) => ({ ...h, id: uuid() })), 'checkIn'),
      activities: activities.map((a) => ({ ...a, id: uuid(), destinationId: firstDestId || '' })),
    })
    setTrips((prev) => [...prev, trip])
    setActiveTripId(trip.id)
    setShowQuickStart(false)
  }, [])

  const addTrip = (name) => {
    if (trips.length >= 3) return
    const trip = makeTrip(name)
    setTrips((prev) => [...prev, trip])
    setActiveTripId(trip.id)
    setSidebarOpen(false)
  }
  const deleteTrip = (id) => {
    setTrips((prev) => {
      const next = prev.filter((t) => t.id !== id)
      if (next.length === 0) {
        const fresh = makeTrip('My Trip')
        setActiveTripId(fresh.id)
        return [fresh]
      }
      if (activeTripId === id) setActiveTripId(next[0].id)
      return next
    })
  }
  const renameTrip = (id, name) => {
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)))
  }

  // ── Destinations ──
  const addDestination = (dest) => {
    updateActiveTrip({ destinations: sortByDate([...destinations, { ...dest, id: uuid() }], 'arrival') })
    setModal(null)
  }
  const updateDestination = (id, updates) => {
    updateActiveTrip({ destinations: sortByDate(destinations.map((d) => (d.id === id ? { ...d, ...updates } : d)), 'arrival') })
  }
  const deleteDestination = (id) => {
    updateActiveTrip({
      destinations: destinations.filter((d) => d.id !== id),
      activities: activities.filter((a) => a.destinationId !== id),
    })
  }

  // ── Hotels ──
  const addHotel = (hotel) => {
    updateActiveTrip({ hotels: sortByDate([...hotels, { ...hotel, id: uuid() }], 'checkIn') })
    setModal(null)
  }
  const updateHotel = (id, updates) => {
    updateActiveTrip({ hotels: sortByDate(hotels.map((h) => (h.id === id ? { ...h, ...updates } : h)), 'checkIn') })
    setModal(null)
  }
  const deleteHotel = (id) => updateActiveTrip({ hotels: hotels.filter((h) => h.id !== id) })

  // ── Transports ──
  const saveTransport = (data) => {
    if (data.id) {
      updateActiveTrip({ transports: sortByDate(transports.map((t) => (t.id === data.id ? { ...t, ...data } : t)), 'departureDate') })
    } else {
      updateActiveTrip({ transports: sortByDate([...transports, { ...data, id: uuid() }], 'departureDate') })
    }
    setModal(null)
  }
  const deleteTransport = (id) => updateActiveTrip({ transports: transports.filter((t) => t.id !== id) })

  // ── Activities ──
  const saveActivity = (data) => {
    if (data.id) {
      updateActiveTrip({ activities: activities.map((a) => (a.id === data.id ? { ...a, ...data } : a)) })
    } else {
      updateActiveTrip({ activities: [...activities, { ...data, id: uuid() }] })
    }
    setModal(null)
  }
  const deleteActivity = (id) => updateActiveTrip({ activities: activities.filter((a) => a.id !== id) })

  // ── Packing list ──
  const addPackingItem = (text) => {
    updateActiveTrip({ packingList: [...packingList, { id: uuid(), text, checked: false }] })
  }
  const togglePackingItem = (id) => {
    updateActiveTrip({ packingList: packingList.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)) })
  }
  const deletePackingItem = (id) => {
    updateActiveTrip({ packingList: packingList.filter((i) => i.id !== id) })
  }
  const clearPackingChecked = () => {
    updateActiveTrip({ packingList: packingList.filter((i) => !i.checked) })
  }

  // ── Detail card helpers ──
  const openDestCard = (dest) => {
    const destActivities = activities.filter((a) => a.destinationId === dest.id)
    const destHotels = hotels.filter((h) => {
      const hIn = new Date(h.checkIn), hOut = new Date(h.checkOut)
      const arr = new Date(dest.arrival), dep = new Date(dest.departure)
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

  const startResizeDrag = useCallback((e) => {
    e.preventDefault()
    const container = twoColRef.current
    if (!container) return
    const onMove = (e) => {
      const rect = container.getBoundingClientRect()
      const pct = Math.round(Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 35), 80))
      setDestSplit(pct)
    }
    const onUp = () => {
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    document.body.style.cursor = 'col-resize'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  const handleDetailEdit = () => {
    if (!selectedItem) return
    if (selectedItem.kind === 'destination') setModal({ type: 'destination', editing: selectedItem.data })
    else if (selectedItem.kind === 'hotel') setModal({ type: 'hotel', editing: selectedItem.data })
    else if (selectedItem.kind === 'activity') setModal({ type: 'activity', editing: selectedItem.data, context: selectedItem.destination })
    else if (selectedItem.kind === 'transport') setModal({ type: 'transport', editing: selectedItem.data })
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
        className="fixed inset-0 z-0 pointer-events-none select-none"
        style={{
          backgroundImage: `url(${dark ? '/travel-bg-dark.svg' : '/travel-bg-light.svg'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
        aria-hidden="true"
      />

      {/* ── Trip sidebar ── */}
      <TripSidebar
        trips={trips}
        activeTripId={activeTripId}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={(id) => { setActiveTripId(id); setSidebarOpen(false) }}
        onAdd={addTrip}
        onNew={() => { setSidebarOpen(false); setShowQuickStart(true) }}
        onDelete={deleteTrip}
        onRename={renameTrip}
        dark={dark}
      />

      {/* ── Header ── */}
      <header className="relative z-10 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-8 py-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-6xl mx-auto gap-2">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-400 dark:text-gray-500 flex-shrink-0"
              title="Trips"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <h1 className="text-base font-medium text-gray-900 dark:text-gray-100 flex-shrink-0">Wayfar</h1>
            {/* Active trip name */}
            {activeTrip && (
              <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[140px]">/ {activeTrip.name}</span>
            )}
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
              >↑ Export</button>
            )}
            <button
              onClick={() => setModal({ type: 'transport', editing: null })}
              className="text-sm border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 flex items-center gap-1.5"
            >
              <TransportIcon type="flight" size={13} color="#9ca3af" /> Add transport
            </button>
            <button
              onClick={() => setModal({ type: 'hotel', editing: null })}
              className="text-sm border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 flex items-center gap-1.5"
            >
              <BedIcon size={13} color="#9ca3af" /> Add hotel
            </button>
            <button
              onClick={() => setModal({ type: 'destination', editing: null })}
              className="text-sm border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
            >+ Add destination</button>
            <button
              onClick={() => setDark((d) => !d)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-400 dark:text-gray-500"
              title={dark ? 'Light mode' : 'Dark mode'}
            >{dark ? '☀' : '☾'}</button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 dark:text-gray-100">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="text-3xl" style={{ filter: 'grayscale(1)', opacity: 0.18 }}>✈</div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">No trips planned yet</p>
              <p className="text-xs text-gray-300">Let's get you somewhere.</p>
            </div>
            <button
              onClick={() => setShowQuickStart(true)}
              data-testid="plan-a-trip-button"
              className="text-sm border border-gray-200 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-gray-500 font-medium"
            >Plan a trip →</button>
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

            {/* Weather widget */}
            <WeatherWidget destinations={destinations} />

            {/* Map */}
            <MapView destinations={destinations} dark={dark} />

            {/* Destinations + Packing list — side by side with drag-resize handle */}
            <div ref={twoColRef} className="flex flex-col lg:flex-row items-start mb-8">

            {/* Destination list */}
            {destinations.length > 0 && (
              <section
                className="two-col-left w-full flex-shrink-0"
                style={{ width: `${destSplit}%` }}
              >
                <h2 className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <PlaneIcon size={12} color={dark ? 'white' : 'black'} /> Destinations
                </h2>
                <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                  {destinations.map((dest, idx) => {
                    const nights = differenceInDays(startOfDay(new Date(dest.departure)), startOfDay(new Date(dest.arrival)))
                    const destActivities = activities.filter((a) => a.destinationId === dest.id)
                    const isVacation = dest.type === 'vacation'
                    return (
                      <div key={dest.id} className={idx < destinations.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}>
                        <div
                          className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                          onClick={() => openDestCard(dest)}
                        >
                          <Flag code={dest.countryCode} country={dest.country} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{dest.city}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-500">{dest.country}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: isVacation ? '#f0f9ff' : '#f5f3ff', color: isVacation ? '#0369a1' : '#6d28d9' }}>{dest.type}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {format(new Date(dest.arrival), 'MMM d')} – {format(new Date(dest.departure), 'MMM d, yyyy')}
                              <span className="mx-1.5 text-gray-200">·</span>
                              {nights} night{nights !== 1 ? 's' : ''}
                              {destActivities.length > 0 && <><span className="ml-2 text-gray-200 mr-1.5">·</span>{destActivities.length} activit{destActivities.length !== 1 ? 'ies' : 'y'}</>}
                              {dest.budget != null && <span className="ml-2 font-medium" style={{ color: '#166534' }}><span className="text-gray-200 mr-1.5">·</span>${dest.budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
                            </p>
                          </div>
                          <div className="hidden sm:flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setModal({ type: 'activity', editing: null, context: dest })} className="text-xs text-gray-400 hover:text-gray-600 px-2.5 py-1.5 rounded border border-transparent hover:border-gray-200 transition-colors">+ Activity</button>
                            <button onClick={() => setModal({ type: 'destination', editing: dest })} className="text-xs text-gray-400 hover:text-gray-600 px-2.5 py-1.5 rounded border border-transparent hover:border-gray-200 transition-colors">Edit</button>
                            <button onClick={() => deleteDestination(dest.id)} className="text-xs text-gray-300 hover:text-red-400 px-2.5 py-1.5 rounded border border-transparent hover:border-red-100 transition-colors">Delete</button>
                          </div>
                        </div>
                        {destActivities.length > 0 && (
                          <div className="px-5 pb-3 flex-wrap gap-2 hidden sm:flex">
                            {destActivities.sort((a, b) => new Date(a.date) - new Date(b.date)).map((act) => {
                              const cfg = ACTIVITY_CONFIG[act.type]
                              return (
                                <div key={act.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs" style={{ background: cfg.lightBg, border: `1px solid ${cfg.lightBorder}`, color: cfg.color }}>
                                  <span style={{ display: 'flex', alignItems: 'center' }}><ActivityIcon type={act.type} size={11} color={cfg.color} /></span>
                                  <span className="font-medium">{act.name}</span>
                                  <span style={{ opacity: 0.7 }}>{format(new Date(act.date), 'MMM d')}</span>
                                  <button onClick={() => setModal({ type: 'activity', editing: act, context: dest })} className="opacity-50 hover:opacity-100 transition-opacity">✎</button>
                                  <button onClick={() => deleteActivity(act.id)} className="opacity-40 hover:opacity-100 transition-opacity">✕</button>
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

            {/* Drag handle */}
            <div
              onMouseDown={startResizeDrag}
              className="hidden lg:flex w-5 self-stretch items-center justify-center cursor-col-resize flex-shrink-0 group"
            >
              <div className="w-px h-full bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-colors rounded-full" />
            </div>

            {/* Packing list */}
            <div className="w-full lg:flex-1 min-w-0 mt-8 lg:mt-0">
              <PackingList
                items={packingList}
                onAdd={addPackingItem}
                onToggle={togglePackingItem}
                onDelete={deletePackingItem}
                onClearChecked={clearPackingChecked}
                dark={dark}
              />
            </div>

            </div>{/* end two-col */}

            {/* Hotel list */}
            {hotels.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BedIcon size={11} color="#9ca3af" /> Hotels
                </h2>
                <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                  {hotels.map((hotel, idx) => {
                    const nights = differenceInDays(startOfDay(new Date(hotel.checkOut)), startOfDay(new Date(hotel.checkIn)))
                    return (
                      <div key={hotel.id} onClick={() => openHotelCard(hotel)} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer ${idx < hotels.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
                        <BedIcon size={15} color="#a8a29e" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{hotel.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Check-in {format(new Date(hotel.checkIn), 'MMM d')} · Check-out {format(new Date(hotel.checkOut), 'MMM d, yyyy')}
                            <span className="mx-1.5 text-gray-200">·</span>{nights} night{nights !== 1 ? 's' : ''}
                            {hotel.budget != null && <span className="ml-2 font-medium" style={{ color: '#166534' }}><span className="text-gray-200 mr-1.5">·</span>${hotel.budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setModal({ type: 'hotel', editing: hotel })} className="text-xs text-gray-400 hover:text-gray-600 px-2.5 py-1.5 rounded border border-transparent hover:border-gray-200 transition-colors">Edit</button>
                          <button onClick={() => deleteHotel(hotel.id)} className="text-xs text-gray-300 hover:text-red-400 px-2.5 py-1.5 rounded border border-transparent hover:border-red-100 transition-colors">Delete</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Transport list */}
            {transports.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <TransportIcon type="flight" size={11} color="#9ca3af" /> Transports
                </h2>
                <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                  {transports.map((t, idx) => {
                    const cfg = TRANSPORT_CONFIG[t.type]
                    return (
                      <div key={t.id} onClick={() => openTransportCard(t)} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer ${idx < transports.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
                        <span className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: cfg.lightBg, border: `1px solid ${cfg.lightBorder}` }}>
                          <TransportIcon type={t.type} size={13} color={cfg.color} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.fromCity} → {t.toCity}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {cfg.label} · {format(new Date(t.departureDate), 'MMM d')}
                            {t.departureDate !== t.arrivalDate && ` – ${format(new Date(t.arrivalDate), 'MMM d, yyyy')}`}
                            {t.carrier && <span className="ml-1.5 text-gray-400">· {t.carrier}</span>}
                            {t.budget != null && <span className="ml-2 font-medium" style={{ color: '#166534' }}><span className="text-gray-200 mr-1.5">·</span>${t.budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setModal({ type: 'transport', editing: t })} className="text-xs text-gray-400 hover:text-gray-600 px-2.5 py-1.5 rounded border border-transparent hover:border-gray-200 transition-colors">Edit</button>
                          <button onClick={() => deleteTransport(t.id)} className="text-xs text-gray-300 hover:text-red-400 px-2.5 py-1.5 rounded border border-transparent hover:border-red-100 transition-colors">Delete</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Summary dashboard */}
            <SummaryDashboard destinations={destinations} hotels={hotels} activities={activities} transports={transports} currency={tripCurrency} onCurrencyChange={setCurrency} />
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
        <ActivityModal destination={modal.context} editing={modal.editing} onSave={saveActivity} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'transport' && (
        <TransportModal editing={modal.editing} onSave={saveTransport} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'hotel' && (
        <HotelModal
          editing={modal.editing}
          hotels={hotels}
          onSave={(data) => { if (data.id) updateHotel(data.id, data); else addHotel(data) }}
          onClose={() => setModal(null)}
        />
      )}
      {showExport && (
        <ExportModal destinations={destinations} hotels={hotels} activities={activities} onClose={() => setShowExport(false)} />
      )}
      {showQuickStart && (
        <QuickStartModal onComplete={addTripWithData} onClose={() => setShowQuickStart(false)} />
      )}
      <DetailCard item={selectedItem} onClose={() => setSelectedItem(null)} onEdit={handleDetailEdit} />
    </div>
  )
}
