import { useState, useEffect, useCallback, useRef } from 'react'
import { uuid } from './lib/uuid'
import { format, differenceInDays, startOfDay } from 'date-fns'
import { formatCurrency } from './utils/formatUtils'
import QuickStartModal from './components/quickstart/QuickStartModal'
import InlineDestinationCreator from './components/InlineDestinationCreator'
import CollaborationModal from './components/CollaborationModal'
import { useCollaboration } from './hooks/useCollaboration'
import Timeline from './components/Timeline'
import AddDestinationModal from './components/AddDestinationModal'
import ActivityModal from './components/ActivityModal'
import HotelModal from './components/HotelModal'
import TransportModal from './components/TransportModal'
import ExportModal from './components/ExportModal'
import DetailCard from './components/DetailCard'
import TripSidebar from './components/TripSidebar'
import PackingList from './components/PackingList'
import TripDocuments from './components/TripDocuments'
import WeatherWidget from './components/WeatherWidget'
import WeatherBadge from './components/WeatherBadge'
import MapView from './components/MapView'
import SummaryDashboard from './components/SummaryDashboard'
import { createDemoTrips } from './lib/demoData'
import { Flag } from './components/CitySearch'
import { ACTIVITY_CONFIG, ActivityIcon, BedIcon, TRANSPORT_CONFIG, TransportIcon, PlaneIcon, SuitcaseIcon } from './components/Icons'
import HeaderMenus from './components/HeaderMenus'
import MobileBottomBar from './components/MobileBottomBar'
import TravelStats from './components/TravelStats'
import AuthButton from './components/AuthButton'
import WelcomeScreen from './components/WelcomeScreen'
import { shareToWhatsApp, exportTripCard, copyTripShareLink, deserializeTripFromUrl } from './utils/share'
import { openTripSummaryPrint } from './utils/export'
import { supabase } from './lib/supabase'
import { useAuth } from './hooks/useAuth'
import { useCloudSync } from './hooks/useCloudSync'
import { STORAGE_KEY, DARK_MODE_KEY, GUEST_MODE_KEY, TRIP_LIMIT_GUEST, TRIP_LIMIT_AUTH } from './lib/constants'
import IOSInstallPrompt from './components/IOSInstallPrompt'
import BookingImportModal from './components/BookingImportModal'

// ── Dark mode ──────────────────────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem(DARK_MODE_KEY)
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem(DARK_MODE_KEY, String(dark))
  }, [dark])
  return [dark, setDark]
}

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
    documents: data.documents || [],
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
  const { user, loading: authLoading } = useAuth()
  const [guestMode, setGuestMode] = useState(() => !!localStorage.getItem(GUEST_MODE_KEY))
  const [sharedTrip, setSharedTrip] = useState(() => deserializeTripFromUrl())
  const [shareCopied, setShareCopied] = useState(false)
  const showWelcome = !authLoading && !user && !guestMode
  const [trips, setTrips] = useState(() => loadState().trips)
  const [activeTripId, setActiveTripId] = useState(() => { const s = loadState(); return s.activeTripId || s.trips[0]?.id })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [modal, setModal] = useState(null)
  const [showExport, setShowExport] = useState(false)
  const [showQuickStart, setShowQuickStart] = useState(false)
  const [showCollab, setShowCollab] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showBookingImport, setShowBookingImport] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [destSplit, setDestSplit] = useState(63)
  const [destsOpen, setDestsOpen] = useState(true)
  const [hotelsOpen, setHotelsOpen] = useState(true)
  const [transportsOpen, setTransportsOpen] = useState(true)
  const twoColRef = useRef(null)
  const [undoSnapshot, setUndoSnapshot] = useState(null)
  const [undoVisible, setUndoVisible] = useState(false)
  const undoTimerRef = useRef(null)

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ trips, activeTripId }))
  }, [trips, activeTripId])

  const { deleteFromCloud } = useCloudSync({ userId: user?.id, trips, setTrips, setActiveTripId })

  // ── Active trip helpers ──
  const activeTrip = trips.find((t) => t.id === activeTripId) || trips[0]
  const { destinations, hotels, activities, transports, packingList, documents = [], currency: tripCurrency = 'USD' } = activeTrip || {
    destinations: [], hotels: [], activities: [], transports: [], packingList: [], documents: [], currency: 'USD',
  }

  const updateActiveTrip = useCallback((updates) => {
    setTrips((prev) => prev.map((t) => (t.id === activeTripId ? { ...t, ...updates } : t)))
  }, [activeTripId])

  const setCurrency = useCallback((c) => updateActiveTrip({ currency: c }), [updateActiveTrip])

  const collab = useCollaboration({
    tripData: { destinations, hotels, activities, transports, packingList, currency: tripCurrency },
    onRemoteUpdate: updateActiveTrip,
  })

  // ── Demo seed (?demo in URL adds a pre-filled trip without touching existing data) ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.has('demo')) return
    window.history.replaceState(null, '', window.location.pathname + window.location.hash)
    setTrips((prev) => {
      if (prev.some((t) => t.name === 'Europe Demo')) return prev
      const [europeData, asiaData] = createDemoTrips()
      const europeTrip = makeTrip(europeData.name, europeData)
      const asiaTrip   = makeTrip(asiaData.name, asiaData)
      setActiveTripId(europeTrip.id)
      // Drop any empty default "My Trip" placeholder so the sidebar stays clean
      const existing = prev.filter((t) => !(t.name === 'My Trip' && t.destinations.length === 0))
      return [...existing, asiaTrip, europeTrip]
    })
  }, [])

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

  const tripLimit = user ? TRIP_LIMIT_AUTH : TRIP_LIMIT_GUEST

  const addTrip = (name) => {
    if (trips.length >= tripLimit) return
    const trip = makeTrip(name)
    setTrips((prev) => [...prev, trip])
    setActiveTripId(trip.id)
    setSidebarOpen(false)
  }
  const deleteTrip = (id) => {
    deleteFromCloud(id)
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

  // ── Undo ──
  const snapshotForUndo = useCallback(() => {
    setUndoSnapshot({ trips, activeTripId })
  }, [trips, activeTripId])

  const showUndoToast = useCallback(() => {
    setUndoVisible(true)
    clearTimeout(undoTimerRef.current)
    undoTimerRef.current = setTimeout(() => setUndoVisible(false), 5000)
  }, [])

  const handleUndo = () => {
    if (undoSnapshot) {
      setTrips(undoSnapshot.trips)
      setActiveTripId(undoSnapshot.activeTripId)
    }
    setUndoVisible(false)
    clearTimeout(undoTimerRef.current)
  }

  // ── Inline first-destination creator ──
  const handleInlineAdd = ({ city, arrival, departure }) => {
    const dest = {
      id: uuid(),
      city: city.city,
      country: city.country,
      countryCode: city.countryCode,
      lat: city.lat ?? null,
      lng: city.lng ?? null,
      arrival,
      departure,
      type: 'vacation',
    }
    const newTrip = makeTrip(city.city, { destinations: [dest] })
    setTrips((prev) => {
      const existing = prev.filter((t) => !(t.name === 'My Trip' && t.destinations.length === 0))
      return [...existing, newTrip]
    })
    setActiveTripId(newTrip.id)
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

  // ── Documents ──
  const addDocument = (doc) => updateActiveTrip({ documents: [...documents, doc] })
  const deleteDocument = (id) => updateActiveTrip({ documents: documents.filter((d) => d.id !== id) })

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

  const handleSaveSharedTrip = () => {
    if (!sharedTrip || trips.length >= tripLimit) return
    const trip = makeTrip(sharedTrip.name, sharedTrip)
    setTrips((prev) => [...prev, trip])
    setActiveTripId(trip.id)
    setSharedTrip(null)
    window.history.replaceState(null, '', window.location.pathname)
  }

  const handleCopyShareLink = async () => {
    if (!activeTrip) return
    try {
      await copyTripShareLink(activeTrip)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2500)
    } catch (err) {
      console.error('[Wayfar] copy share link failed', err)
    }
  }

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
        tripLimit={tripLimit}
      />

      {/* ── Shared trip banner ── */}
      {sharedTrip && (
        <div className="relative z-20 bg-sky-50 dark:bg-sky-950 border-b border-sky-100 dark:border-sky-900 px-4 py-2.5">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-sky-700 dark:text-sky-300">
              Viewing shared trip: <strong>{sharedTrip.name}</strong>
              <span className="ml-2 text-xs text-sky-400 font-normal">({sharedTrip.destinations?.length ?? 0} destinations)</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveSharedTrip}
                disabled={trips.length >= tripLimit}
                className="text-xs font-medium bg-sky-600 text-white px-3 py-1.5 rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save to my trips
              </button>
              <button
                onClick={() => {
                  setSharedTrip(null)
                  window.history.replaceState(null, '', window.location.pathname)
                }}
                className="text-xs text-sky-500 hover:text-sky-700 dark:hover:text-sky-300 px-2 py-1.5 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Share copied toast ── */}
      {shareCopied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium px-4 py-2.5 rounded-full shadow-lg pointer-events-none">
          Link copied to clipboard ✓
        </div>
      )}

      {/* ── Header ── */}
      <header className="relative z-20 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-8 py-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-6xl mx-auto gap-2">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="w-11 h-11 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-400 dark:text-gray-500 flex-shrink-0"
              title="Trips"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            {/* Auth button — mobile only (desktop version is in the right section) */}
            <div className="sm:hidden flex-shrink-0">
              <AuthButton user={user} onShowWelcome={() => {
                localStorage.removeItem(GUEST_MODE_KEY)
                setGuestMode(false)
              }} />
            </div>
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
                    ${formatCurrency(totalBudget)}
                  </span>
                </>}
              </div>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <AuthButton user={user} onShowWelcome={() => {
              localStorage.removeItem(GUEST_MODE_KEY)
              setGuestMode(false)
            }} />
            <HeaderMenus
              hasData={hasData}
              onAddDestination={() => setModal({ type: 'destination', editing: null })}
              onAddTransport={() => setModal({ type: 'transport', editing: null })}
              onAddHotel={() => setModal({ type: 'hotel', editing: null })}
              onAddActivity={() => setModal({ type: 'activity', editing: null, context: destinations[0] ?? null })}
              onImportBooking={() => setShowBookingImport(true)}
              onExport={() => setShowExport(true)}
              onSummaryPDF={() => openTripSummaryPrint({ name: activeTrip?.name, destinations, hotels, activities, transports })}
              onCopyShareLink={handleCopyShareLink}
              onWhatsApp={() => shareToWhatsApp(activeTrip)}
              onInstagram={() => exportTripCard(destinations, activeTrip?.name)}
              onShare={() => setShowCollab(true)}
              onTravelStats={() => setShowStats(true)}
              isCollaborating={collab.isCollaborating}
              syncStatus={collab.syncStatus}
            />
            <button
              onClick={() => setDark((d) => !d)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-400 dark:text-gray-500"
              title={dark ? 'Light mode' : 'Dark mode'}
            >{dark ? '☀' : '☾'}</button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-24 sm:pb-8 dark:text-gray-100">
        {!hasData ? (
          <InlineDestinationCreator onAdd={handleInlineAdd} />
        ) : (
          <>
            {/* Mobile section-jump nav */}
            <div className="sm:hidden -mx-4 px-3 mb-5 flex gap-2 overflow-x-auto scrollbar-hide">
              {[
                { label: 'Timeline', id: 'sec-timeline' },
                { label: 'Map', id: 'sec-map' },
                { label: 'Hotels', id: 'sec-hotels', hide: hotels.length === 0 },
                { label: 'Summary', id: 'sec-summary' },
              ].filter(s => !s.hide).map(({ label, id }) => (
                <button
                  key={id}
                  onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Timeline */}
            <section id="sec-timeline" className="mb-12 -mx-4 sm:mx-0 px-4 sm:px-0">
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
                onDragStart={snapshotForUndo}
                onDragComplete={showUndoToast}
              />
            </section>

            {/* Weather widget */}
            <WeatherWidget destinations={destinations} />

            {/* Map */}
            <div id="sec-map"><MapView destinations={destinations} dark={dark} /></div>

            {/* Destinations + Packing list — side by side with drag-resize handle */}
            <div ref={twoColRef} className="flex flex-col lg:flex-row items-start mb-8">

            {/* Destination list */}
            {destinations.length > 0 && (
              <section
                className="two-col-left w-full flex-shrink-0"
                style={{ width: `${destSplit}%` }}
              >
                <div className="flex items-center justify-between mb-3 cursor-pointer select-none" onClick={() => setDestsOpen(o => !o)}>
                  <h2 className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <PlaneIcon size={12} color={dark ? 'white' : 'black'} /> Destinations
                  </h2>
                  <span className="text-xs text-gray-300 dark:text-gray-600">{destsOpen ? '▲' : '▼'}</span>
                </div>
                {destsOpen && <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
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
                              {dest.budget != null && <span className="ml-2 font-medium" style={{ color: '#166534' }}><span className="text-gray-200 mr-1.5">·</span>${formatCurrency(dest.budget)}</span>}
                            </p>
                            <WeatherBadge city={dest.city} countryCode={dest.countryCode} departure={dest.departure} />
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
                </div>}
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
              <div className="mt-8">
                <TripDocuments
                  documents={documents}
                  tripId={activeTrip?.id}
                  userId={user?.id}
                  onAdd={addDocument}
                  onDelete={deleteDocument}
                  dark={dark}
                />
              </div>
            </div>

            </div>{/* end two-col */}

            {/* Hotel list */}
            {hotels.length > 0 && (
              <section id="sec-hotels" className="mb-8">
                <div className="flex items-center justify-between mb-3 cursor-pointer select-none" onClick={() => setHotelsOpen(o => !o)}>
                  <h2 className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <BedIcon size={11} color="#9ca3af" /> Hotels
                  </h2>
                  <span className="text-xs text-gray-300 dark:text-gray-600">{hotelsOpen ? '▲' : '▼'}</span>
                </div>
                {hotelsOpen && <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
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
                            {hotel.budget != null && <span className="ml-2 font-medium" style={{ color: '#166534' }}><span className="text-gray-200 mr-1.5">·</span>${formatCurrency(hotel.budget)}</span>}
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setModal({ type: 'hotel', editing: hotel })} className="text-xs text-gray-400 hover:text-gray-600 px-2.5 py-1.5 rounded border border-transparent hover:border-gray-200 transition-colors">Edit</button>
                          <button onClick={() => deleteHotel(hotel.id)} className="text-xs text-gray-300 hover:text-red-400 px-2.5 py-1.5 rounded border border-transparent hover:border-red-100 transition-colors">Delete</button>
                        </div>
                      </div>
                    )
                  })}
                </div>}
              </section>
            )}

            {/* Transport list */}
            {transports.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-3 cursor-pointer select-none" onClick={() => setTransportsOpen(o => !o)}>
                  <h2 className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <TransportIcon type="flight" size={11} color="#9ca3af" /> Transports
                  </h2>
                  <span className="text-xs text-gray-300 dark:text-gray-600">{transportsOpen ? '▲' : '▼'}</span>
                </div>
                {transportsOpen && <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
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
                            {t.budget != null && <span className="ml-2 font-medium" style={{ color: '#166534' }}><span className="text-gray-200 mr-1.5">·</span>${formatCurrency(t.budget)}</span>}
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setModal({ type: 'transport', editing: t })} className="text-xs text-gray-400 hover:text-gray-600 px-2.5 py-1.5 rounded border border-transparent hover:border-gray-200 transition-colors">Edit</button>
                          <button onClick={() => deleteTransport(t.id)} className="text-xs text-gray-300 hover:text-red-400 px-2.5 py-1.5 rounded border border-transparent hover:border-red-100 transition-colors">Delete</button>
                        </div>
                      </div>
                    )
                  })}
                </div>}
              </section>
            )}

            {/* Summary dashboard */}
            <div id="sec-summary"><SummaryDashboard destinations={destinations} hotels={hotels} activities={activities} transports={transports} currency={tripCurrency} onCurrencyChange={setCurrency} /></div>
          </>
        )}
      </main>

      {/* ── Modals ── */}
      {modal?.type === 'destination' && (
        <AddDestinationModal
          editing={modal.editing}
          destinations={destinations}
          lastDeparture={!modal.editing && destinations.length > 0
            ? [...destinations].sort((a, b) => a.departure < b.departure ? 1 : -1)[0].departure
            : ''}
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
          activeDestination={!modal.editing ? (destinations.length > 0
            ? [...destinations].sort((a, b) => a.departure < b.departure ? 1 : -1)[0]
            : null) : null}
          onSave={(data) => { if (data.id) updateHotel(data.id, data); else addHotel(data) }}
          onClose={() => setModal(null)}
        />
      )}
      {showExport && (
        <ExportModal destinations={destinations} hotels={hotels} activities={activities} onClose={() => setShowExport(false)} />
      )}
      {showQuickStart && (
        <QuickStartModal dark={dark} onComplete={addTripWithData} onClose={() => setShowQuickStart(false)} />
      )}
      {showCollab && (
        <CollaborationModal
          isCollaborating={collab.isCollaborating}
          tripCode={collab.tripCode}
          syncStatus={collab.syncStatus}
          onStartSharing={collab.startSharing}
          onJoinTrip={collab.joinTrip}
          onStopSharing={collab.stopSharing}
          onClose={() => setShowCollab(false)}
          supabaseReady={supabase !== null}
        />
      )}
      {showStats && (
        <TravelStats
          trips={trips}
          user={user}
          dark={dark}
          onClose={() => setShowStats(false)}
        />
      )}
      <DetailCard item={selectedItem} onClose={() => setSelectedItem(null)} onEdit={handleDetailEdit} />

      {/* Mobile bottom action bar */}
      <MobileBottomBar
        hasData={hasData}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        onTravelStats={() => setShowStats(true)}
        onAddDestination={() => setModal({ type: 'destination', editing: null })}
        onAddTransport={() => setModal({ type: 'transport', editing: null })}
        onAddHotel={() => setModal({ type: 'hotel', editing: null })}
        onAddActivity={() => setModal({ type: 'activity', editing: null, context: destinations[0] ?? null })}
        onImportBooking={() => setShowBookingImport(true)}
        onExport={() => setShowExport(true)}
        onSummaryPDF={() => openTripSummaryPrint({ name: activeTrip?.name, destinations, hotels, activities, transports })}
        onCopyShareLink={handleCopyShareLink}
        onWhatsApp={() => shareToWhatsApp(activeTrip)}
        onInstagram={() => exportTripCard(destinations, activeTrip?.name)}
        onShare={() => setShowCollab(true)}
        isCollaborating={collab.isCollaborating}
        syncStatus={collab.syncStatus}
      />

      {/* Undo toast */}
      {undoVisible && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-xl px-4 py-2.5 shadow-lg">
          <span>Move applied</span>
          <button onClick={handleUndo} className="font-semibold underline">Undo</button>
          <button onClick={() => setUndoVisible(false)} className="opacity-50 hover:opacity-100 ml-1">✕</button>
        </div>
      )}

      {showBookingImport && (
        <BookingImportModal
          onImport={(data) => {
            setShowBookingImport(false)
            if (data.type === 'hotel') {
              setModal({ type: 'hotel', editing: null, prefill: data })
            } else if (data.type === 'transport') {
              setModal({ type: 'transport', editing: null, prefill: data })
            } else {
              setModal({ type: 'destination', editing: null, prefill: data })
            }
          }}
          onClose={() => setShowBookingImport(false)}
        />
      )}

      <IOSInstallPrompt />

      {showWelcome && (
        <WelcomeScreen
          onContinueAsGuest={() => {
            localStorage.setItem(GUEST_MODE_KEY, 'true')
            setGuestMode(true)
          }}
        />
      )}
    </div>
  )
}
