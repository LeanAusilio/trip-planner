import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import {
  format, addDays, differenceInDays, startOfDay,
  isSameDay, eachMonthOfInterval,
} from 'date-fns'
import { Flag } from './CitySearch'
import { ACTIVITY_CONFIG, ActivityIcon, BedIcon, TRANSPORT_CONFIG, TransportIcon } from './Icons'

const DAY_WIDTH      = 36
const DEST_H         = 44
const ACTIVITY_H     = 28
const ROW_H          = 4 + DEST_H + ACTIVITY_H
const ROW_GAP        = 4
const HOTEL_H        = 38
const HOTEL_GAP      = 12
const TRANSPORT_H    = 34
const TRANSPORT_GAP  = 12
const HEADER_H       = 52

const ZOOM_LEVELS = [18, 24, 36, 48, 64]

function computeRange(destinations, hotels, transports) {
  const today = startOfDay(new Date())
  const all = [
    ...destinations.map((d) => ({ s: new Date(d.arrival), e: new Date(d.departure) })),
    ...hotels.map((h) => ({ s: new Date(h.checkIn), e: new Date(h.checkOut) })),
    ...transports.map((t) => ({ s: new Date(t.departureDate), e: new Date(t.arrivalDate) })),
  ]
  if (all.length === 0) {
    return { startDate: addDays(today, -3), endDate: addDays(today, 30) }
  }
  const minDate = all.reduce((m, { s }) => (startOfDay(s) < m ? startOfDay(s) : m), startOfDay(all[0].s))
  const maxDate = all.reduce((m, { e }) => (startOfDay(e) > m ? startOfDay(e) : m), startOfDay(all[0].e))
  return { startDate: addDays(minDate, -4), endDate: addDays(maxDate, 5) }
}

// Group activities by destination and then by date, return { [destId]: { [dateKey]: [activity] } }
function groupActivities(activities) {
  const map = {}
  for (const a of activities) {
    if (!map[a.destinationId]) map[a.destinationId] = {}
    const key = format(new Date(a.date), 'yyyy-MM-dd')
    if (!map[a.destinationId][key]) map[a.destinationId][key] = []
    map[a.destinationId][key].push(a)
  }
  return map
}

/** Small activity pin — colored circle with white icon */
function ActivityPin({ activity, x, dayWidth, onEdit, onDelete, onSelect }) {
  const [hovered, setHovered] = useState(false)
  const cfg = ACTIVITY_CONFIG[activity.type]
  const PIN_SIZE = 24

  return (
    <div
      style={{
        position: 'absolute',
        left: x + dayWidth / 2 - PIN_SIZE / 2,
        top: 3,
        width: PIN_SIZE,
        height: PIN_SIZE,
        zIndex: hovered ? 20 : 2,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Circle */}
      <div
        onClick={() => onSelect?.(activity)}
        style={{
          width: PIN_SIZE,
          height: PIN_SIZE,
          borderRadius: '50%',
          background: cfg.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: hovered ? `0 2px 8px ${cfg.color}55` : 'none',
          transition: 'box-shadow 0.15s',
        }}
      >
        <ActivityIcon type={activity.type} size={13} />
      </div>

      {/* Tooltip */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            bottom: PIN_SIZE + 6,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#111',
            color: '#fff',
            borderRadius: 6,
            padding: '5px 8px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            fontSize: 11,
            lineHeight: 1.4,
            zIndex: 30,
          }}
        >
          <div style={{ fontWeight: 500 }}>{activity.name}</div>
          <div style={{ opacity: 0.6, fontSize: 10 }}>{format(new Date(activity.date), 'MMM d')}</div>
          {/* Arrow */}
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
            borderTop: '5px solid #111',
          }} />
        </div>
      )}

      {/* Edit/delete on hover */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: PIN_SIZE + 4,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 3,
            zIndex: 30,
            pointerEvents: 'auto',
          }}
        >
          <button
            onClick={() => onEdit(activity)}
            style={{
              fontSize: 10, background: 'white', border: '1px solid #e5e7eb',
              borderRadius: 4, padding: '2px 5px', cursor: 'pointer', color: '#6b7280',
            }}
          >Edit</button>
          <button
            onClick={() => onDelete(activity.id)}
            style={{
              fontSize: 10, background: 'white', border: '1px solid #fecaca',
              borderRadius: 4, padding: '2px 5px', cursor: 'pointer', color: '#f87171',
            }}
          >✕</button>
        </div>
      )}
    </div>
  )
}

export default function Timeline({
  destinations, activities, hotels, transports = [], dark,
  onUpdateDest, onEditDest, onDeleteDest,
  onEditActivity, onDeleteActivity,
  onEditHotel, onDeleteHotel,
  onEditTransport, onDeleteTransport,
  onClickDest, onClickHotel, onClickActivity, onClickTransport,
}) {
  const [zoomIdx, setZoomIdx] = useState(2) // default: index 2 = 36px
  const dayWidth = ZOOM_LEVELS[zoomIdx]

  const TL = {
    bg:          dark ? '#111827' : '#ffffff',
    stripe:      dark ? '#1a2130' : '#fafafa',
    border:      dark ? '#1f2937' : '#f3f4f6',
    monthLine:   dark ? '#1f2937' : '#f9fafb',
    todayLine:   dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    todayDot:    dark ? '#f3f4f6' : '#111111',
    todayDotTxt: dark ? '#111111' : '#ffffff',
    dayText:     dark ? '#4b5563' : '#9ca3af',
    monthText:   dark ? '#6b7280' : '#6b7280',
    dividerLine: dark ? '#1f2937' : '#f3f4f6',
    hotelBg:     dark ? '#1e2433' : '#fafaf9',
    hotelBorder: dark ? '#374151' : '#d6d3d1',
    hotelText:   dark ? '#9ca3af' : '#57534e',
    hotelSub:    dark ? '#6b7280' : '#78716c',
    btnBg:       dark ? '#1f2937' : '#ffffff',
    btnBorder:   dark ? '#374151' : undefined,
  }

  const scrollRef = useRef(null)
  const dragState = useRef(null)  // { id, mode, startX, origArrival, origDeparture }
  const [dragId, setDragId] = useState(null)
  const [dragMode, setDragMode] = useState(null) // 'move' | 'resize-left' | 'resize-right'
  const [hoverId, setHoverId] = useState(null)
  const [hoverHotelId, setHoverHotelId] = useState(null)
  const [hoverTransportId, setHoverTransportId] = useState(null)

  const { startDate, endDate } = computeRange(destinations, hotels, transports)
  const totalDays = differenceInDays(endDate, startDate) + 1
  const totalWidth = totalDays * dayWidth
  const today = startOfDay(new Date())
  const todayOffset = differenceInDays(today, startDate)

  const activityMap = useMemo(() => groupActivities(activities), [activities])

  // Scroll to show today on mount
  const scrollToToday = () => {
    if (scrollRef.current && todayOffset > 0) {
      const center = todayOffset * dayWidth - scrollRef.current.offsetWidth / 2
      scrollRef.current.scrollLeft = Math.max(0, center)
    }
  }

  // Intentionally runs once on mount only — dayWidth/todayOffset change on zoom
  // but we don't want to re-scroll when the user is actively navigating
  useEffect(() => { scrollToToday() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const dateToX = (date) => differenceInDays(startOfDay(new Date(date)), startDate) * dayWidth

  // --- Drag & resize handlers ---
  const startDrag = (e, dest, mode) => {
    e.preventDefault()
    e.stopPropagation()
    dragState.current = {
      id: dest.id,
      mode,
      startX: e.clientX,
      origArrival: startOfDay(new Date(dest.arrival)),
      origDeparture: startOfDay(new Date(dest.departure)),
      hasMoved: false,
    }
    setDragId(dest.id)
    setDragMode(mode)
    document.body.style.cursor = mode === 'move' ? 'grabbing' : 'ew-resize'
    document.body.classList.add('dragging')
  }

  const handleMouseMove = useCallback((e) => {
    if (!dragState.current) return
    if (Math.abs(e.clientX - dragState.current.startX) > 3) {
      dragState.current.hasMoved = true
    }
    const { id, mode, startX, origArrival, origDeparture } = dragState.current
    const deltaDays = Math.round((e.clientX - startX) / dayWidth)
    const others = destinations.filter((d) => d.id !== id)

    if (mode === 'move') {
      if (deltaDays === 0) return
      const newArrival = addDays(origArrival, deltaDays)
      const newDeparture = addDays(origDeparture, deltaDays)
      const hasOverlap = others.some((d) => {
        const dA = startOfDay(new Date(d.arrival))
        const dD = startOfDay(new Date(d.departure))
        return newArrival < dD && newDeparture > dA
      })
      if (!hasOverlap) {
        onUpdateDest(id, { arrival: newArrival.toISOString(), departure: newDeparture.toISOString() })
      }
    } else if (mode === 'resize-left') {
      const newArrival = addDays(origArrival, deltaDays)
      if (newArrival > origDeparture) return
      const hasOverlap = others.some((d) => {
        const dA = startOfDay(new Date(d.arrival))
        const dD = startOfDay(new Date(d.departure))
        return newArrival < dD && origDeparture > dA
      })
      if (!hasOverlap) {
        onUpdateDest(id, { arrival: newArrival.toISOString() })
      }
    } else if (mode === 'resize-right') {
      const newDeparture = addDays(origDeparture, deltaDays)
      if (newDeparture < origArrival) return
      const hasOverlap = others.some((d) => {
        const dA = startOfDay(new Date(d.arrival))
        const dD = startOfDay(new Date(d.departure))
        return origArrival < dD && newDeparture > dA
      })
      if (!hasOverlap) {
        onUpdateDest(id, { departure: newDeparture.toISOString() })
      }
    }
  }, [destinations, onUpdateDest])

  // A mouseup with hasMoved=false and mode='move' means the user clicked without
  // dragging — treat it as a selection rather than a completed drag.
  const handleMouseUp = useCallback(() => {
    if (dragState.current && !dragState.current.hasMoved && dragState.current.mode === 'move') {
      const dest = destinations.find((d) => d.id === dragState.current.id)
      if (dest && onClickDest) onClickDest(dest)
    }
    dragState.current = null
    setDragId(null)
    setDragMode(null)
    document.body.style.cursor = ''
    document.body.classList.remove('dragging')
  }, [destinations, onClickDest])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const months = eachMonthOfInterval({ start: startDate, end: endDate })

  // Compute total canvas height for absolute positioning
  const destTotalH = destinations.length * (ROW_H + ROW_GAP)
  const hotelTotalH = hotels.length > 0 ? HOTEL_GAP + HOTEL_H : 0
  const transportTotalH = transports.length > 0 ? TRANSPORT_GAP + TRANSPORT_H : 0
  const canvasH = HEADER_H + destTotalH + hotelTotalH + transportTotalH + 8

  return (
    <div>
      {/* Zoom controls */}
      <div className="flex items-center gap-1 mb-2 justify-end">
        <button
          onClick={scrollToToday}
          className="text-xs px-2.5 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >Today</button>
        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5" />
        <button
          onClick={() => setZoomIdx(i => Math.max(0, i - 1))}
          disabled={zoomIdx === 0}
          className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-30"
        >−</button>
        <button
          onClick={() => setZoomIdx(i => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
          disabled={zoomIdx === ZOOM_LEVELS.length - 1}
          className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-30"
        >+</button>
      </div>

      <div ref={scrollRef} className="overflow-x-auto timeline-scroll rounded-lg" style={{ border: `1px solid ${TL.border}`, background: TL.bg }}>
        <div style={{ width: Math.max(totalWidth, '100%'), minWidth: '100%', position: 'relative', height: canvasH, background: TL.bg }}>

          {/* ── HEADER ── */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_H, borderBottom: `1px solid ${TL.border}`, background: TL.bg }}>
            {/* Month labels */}
            <div style={{ height: 22, position: 'relative' }}>
              {months.map((month, i) => {
                const monthStart = month < startDate ? startDate : month
                const x = differenceInDays(monthStart, startDate) * dayWidth
                const nextMonth = months[i + 1]
                const monthEnd = nextMonth ? addDays(nextMonth, -1) : endDate
                const monthEndC = monthEnd > endDate ? endDate : monthEnd
                const w = (differenceInDays(monthEndC, monthStart) + 1) * dayWidth
                return (
                  <div key={i} style={{
                    position: 'absolute', left: x, width: w, height: 22,
                    display: 'flex', alignItems: 'center', paddingLeft: 6,
                    borderLeft: i > 0 ? `1px solid ${TL.border}` : 'none',
                  }}>
                    <span style={{ fontSize: 10, color: TL.monthText, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {format(month, 'MMM yyyy')}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Day numbers */}
            <div style={{ height: 30, display: 'flex', alignItems: 'center' }}>
              {Array.from({ length: totalDays }, (_, i) => {
                const day = addDays(startDate, i)
                const isToday = isSameDay(day, today)
                const isBoundary = day.getDate() === 1 && i > 0
                return (
                  <div key={i} style={{
                    width: dayWidth, flexShrink: 0, height: 30,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderLeft: isBoundary ? `1px solid ${TL.border}` : 'none',
                  }}>
                    {isToday ? (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: TL.todayDot, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 10, color: TL.todayDotTxt, fontWeight: 500 }}>{format(day, 'd')}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 10, color: TL.dayText }}>{format(day, 'd')}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── VERTICAL GUIDES ── */}
          {/* Today line */}
          {todayOffset >= 0 && todayOffset <= totalDays && (
            <div style={{
              position: 'absolute', left: todayOffset * dayWidth + dayWidth / 2,
              top: HEADER_H, bottom: 0, width: 1,
              background: TL.todayLine, pointerEvents: 'none', zIndex: 0,
            }} />
          )}
          {/* Month boundary lines */}
          {months.slice(1).map((m, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: differenceInDays(m, startDate) * dayWidth,
              top: HEADER_H, bottom: 0, width: 1,
              background: TL.monthLine, pointerEvents: 'none',
            }} />
          ))}

          {/* ── DESTINATION ROWS ── */}
          {destinations.map((dest, idx) => {
            const rowTop = HEADER_H + idx * (ROW_H + ROW_GAP) + 8
            const blockX = dateToX(dest.arrival)
            const duration = differenceInDays(startOfDay(new Date(dest.departure)), startOfDay(new Date(dest.arrival)))
            const blockW = Math.max(duration * dayWidth, 60)
            const isActive = dragId === dest.id
            const isMoving = isActive && dragMode === 'move'
            const isResizing = isActive && (dragMode === 'resize-left' || dragMode === 'resize-right')
            const isHovering = hoverId === dest.id
            const isVacation = dest.type === 'vacation'
            const blockBg = isVacation ? '#f0f9ff' : '#f5f3ff'
            const blockBorder = isVacation ? '#bae6fd' : '#ddd6fe'
            const handleBar = isVacation ? '#93c5fd' : '#c4b5fd'
            const textColor = isVacation ? '#0369a1' : '#6d28d9'

            // Activities for this destination, grouped by date
            const destActivities = activityMap[dest.id] || {}

            // Cursor for the main block body (exclude handles)
            const blockCursor = isMoving ? 'grabbing' : isResizing ? 'ew-resize' : 'grab'

            const HANDLE_W = 8

            return (
              <div key={dest.id} style={{ position: 'absolute', left: 0, right: 0, top: rowTop, height: ROW_H }}>
                {/* Stripe */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: idx % 2 === 1 ? TL.stripe : 'transparent',
                  borderRadius: 4,
                }} />

                {/* Live date tooltip while resizing */}
                {isActive && dragMode === 'resize-left' && (
                  <div style={{
                    position: 'absolute',
                    left: blockX - 18,
                    top: 4 - 26,
                    background: '#111', color: '#fff',
                    borderRadius: 5, padding: '3px 7px',
                    fontSize: 10, fontWeight: 500,
                    whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 20,
                  }}>
                    {format(new Date(dest.arrival), 'MMM d')}
                  </div>
                )}
                {isActive && dragMode === 'resize-right' && (
                  <div style={{
                    position: 'absolute',
                    left: blockX + blockW - 18,
                    top: 4 - 26,
                    background: '#111', color: '#fff',
                    borderRadius: 5, padding: '3px 7px',
                    fontSize: 10, fontWeight: 500,
                    whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 20,
                  }}>
                    {format(new Date(dest.departure), 'MMM d')}
                  </div>
                )}

                {/* Destination block */}
                <div
                  style={{
                    position: 'absolute', left: blockX, top: 4, height: DEST_H, width: blockW,
                    background: blockBg, border: `1px solid ${blockBorder}`, borderRadius: 8,
                    display: 'flex', alignItems: 'center', gap: 8,
                    paddingLeft: HANDLE_W + 8, paddingRight: isHovering && !isActive ? 72 : HANDLE_W + 8,
                    cursor: blockCursor,
                    userSelect: 'none',
                    boxShadow: isActive ? '0 4px 14px rgba(0,0,0,0.12)' : isHovering ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: isActive ? 'none' : 'box-shadow 0.15s',
                    zIndex: isActive ? 10 : 2,
                    overflow: 'hidden',
                  }}
                  onMouseDown={(e) => startDrag(e, dest, 'move')}
                  onMouseEnter={() => setHoverId(dest.id)}
                  onMouseLeave={() => setHoverId(null)}
                >
                  {/* ── Left resize handle ── */}
                  <div
                    onMouseDown={(e) => startDrag(e, dest, 'resize-left')}
                    style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: HANDLE_W,
                      cursor: 'ew-resize',
                      borderRadius: '7px 0 0 7px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 4,
                    }}
                  >
                    <div style={{
                      width: 2, height: 14, borderRadius: 1,
                      background: handleBar,
                      opacity: (isHovering || isActive) ? 0.8 : 0,
                      transition: 'opacity 0.15s',
                    }} />
                  </div>

                  {/* ── Block content ── */}
                  <Flag code={dest.countryCode} country={dest.country} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {dest.city}
                  </span>
                  {blockW > 130 && (
                    <span style={{ fontSize: 11, color: textColor, opacity: 0.6, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {format(new Date(dest.arrival), 'MMM d')}–{format(new Date(dest.departure), 'MMM d')}
                    </span>
                  )}

                  {/* ── Edit / delete buttons on hover ── */}
                  {isHovering && !isActive && (
                    <div style={{ position: 'absolute', right: HANDLE_W + 4, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 3 }}>
                      <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onEditDest(dest) }}
                        style={{ fontSize: 11, color: textColor, padding: '3px 6px', borderRadius: 4, border: `1px solid ${blockBorder}`, background: TL.btnBg, cursor: 'pointer' }}
                      >Edit</button>
                      <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onDeleteDest(dest.id) }}
                        style={{ fontSize: 12, color: '#f87171', padding: '2px 6px', borderRadius: 4, border: '1px solid #fecaca', background: TL.btnBg, cursor: 'pointer', lineHeight: 1.4 }}
                      >✕</button>
                    </div>
                  )}

                  {/* ── Right resize handle ── */}
                  <div
                    onMouseDown={(e) => startDrag(e, dest, 'resize-right')}
                    style={{
                      position: 'absolute', right: 0, top: 0, bottom: 0, width: HANDLE_W,
                      cursor: 'ew-resize',
                      borderRadius: '0 7px 7px 0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 4,
                    }}
                  >
                    <div style={{
                      width: 2, height: 14, borderRadius: 1,
                      background: handleBar,
                      opacity: (isHovering || isActive) ? 0.8 : 0,
                      transition: 'opacity 0.15s',
                    }} />
                  </div>
                </div>

                {/* Activity pins row (below the block) */}
                <div style={{ position: 'absolute', left: 0, right: 0, top: 4 + DEST_H, height: ACTIVITY_H }}>
                  {Object.entries(destActivities).map(([dateKey, dayActivities]) => {
                    const dayDate = new Date(dateKey)
                    const baseX = dateToX(dayDate)
                    const count = dayActivities.length
                    // Spread pins: center them around the day
                    const PIN_SIZE = 24
                    const SPACING = 28
                    const totalPinsW = count * SPACING - (SPACING - PIN_SIZE)
                    const startPinX = baseX + dayWidth / 2 - totalPinsW / 2

                    return dayActivities.map((act, ai) => (
                      <div key={act.id} style={{ position: 'absolute', left: startPinX + ai * SPACING, top: 0, height: ACTIVITY_H }}>
                        <ActivityPin
                          activity={act}
                          x={0}
                          onEdit={onEditActivity}
                          onDelete={onDeleteActivity}
                          onSelect={onClickActivity}
                        />
                      </div>
                    ))
                  })}
                </div>
              </div>
            )
          })}

          {/* ── HOTEL LANE ── */}
          {hotels.length > 0 && (() => {
            const hotelTop = HEADER_H + destinations.length * (ROW_H + ROW_GAP) + 8 + HOTEL_GAP

            return (
              <>
                {/* Thin divider with label */}
                <div style={{
                  position: 'absolute', left: 0, right: 0,
                  top: hotelTop - HOTEL_GAP / 2 - 9,
                  display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 4,
                  pointerEvents: 'none',
                }}>
                  <BedIcon size={11} color="#d1d5db" />
                  <span style={{ fontSize: 10, color: '#d1d5db', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
                    Hotels
                  </span>
                  <div style={{ flex: 1, height: 1, background: TL.dividerLine }} />
                </div>

                {hotels.map((hotel) => {
                  const hX = dateToX(hotel.checkIn)
                  const hDuration = differenceInDays(startOfDay(new Date(hotel.checkOut)), startOfDay(new Date(hotel.checkIn)))
                  const hW = Math.max(hDuration * dayWidth, 70)
                  const isHovering = hoverHotelId === hotel.id

                  return (
                    <div
                      key={hotel.id}
                      style={{
                        position: 'absolute', left: hX, top: hotelTop, height: HOTEL_H, width: hW,
                        background: TL.hotelBg, border: `1px solid ${TL.hotelBorder}`, borderRadius: 8,
                        display: 'flex', alignItems: 'center', gap: 7,
                        paddingLeft: 10, paddingRight: isHovering ? 68 : 10,
                        cursor: 'pointer', zIndex: 2,
                        boxShadow: isHovering ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                        transition: 'box-shadow 0.15s',
                      }}
                      onClick={() => onClickHotel?.(hotel)}
                      onMouseEnter={() => setHoverHotelId(hotel.id)}
                      onMouseLeave={() => setHoverHotelId(null)}
                    >
                      <BedIcon size={13} color="#a8a29e" />
                      <span style={{ fontSize: 12, fontWeight: 500, color: TL.hotelText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {hotel.name}
                      </span>
                      {hW > 130 && (
                        <span style={{ fontSize: 11, color: TL.hotelSub, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {format(new Date(hotel.checkIn), 'MMM d')}–{format(new Date(hotel.checkOut), 'MMM d')}
                        </span>
                      )}
                      {isHovering && (
                        <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 3 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); onEditHotel(hotel) }}
                            style={{ fontSize: 11, color: TL.hotelText, padding: '3px 6px', borderRadius: 4, border: `1px solid ${TL.hotelBorder}`, background: TL.btnBg, cursor: 'pointer' }}
                          >Edit</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteHotel(hotel.id) }}
                            style={{ fontSize: 12, color: '#f87171', padding: '2px 6px', borderRadius: 4, border: '1px solid #fecaca', background: TL.btnBg, cursor: 'pointer', lineHeight: 1.4 }}
                          >✕</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )
          })()}

          {/* ── TRANSPORT LANE ── */}
          {transports.length > 0 && (() => {
            const transportTop = HEADER_H + destTotalH + hotelTotalH + 8 + TRANSPORT_GAP

            return (
              <>
                <div style={{
                  position: 'absolute', left: 0, right: 0,
                  top: transportTop - TRANSPORT_GAP / 2 - 9,
                  display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 4,
                  pointerEvents: 'none',
                }}>
                  <TransportIcon type="flight" size={11} color="#d1d5db" />
                  <span style={{ fontSize: 10, color: '#d1d5db', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
                    Transport
                  </span>
                  <div style={{ flex: 1, height: 1, background: TL.dividerLine }} />
                </div>

                {transports.map((transport) => {
                  const tX = dateToX(transport.departureDate)
                  const tDuration = Math.max(
                    differenceInDays(startOfDay(new Date(transport.arrivalDate)), startOfDay(new Date(transport.departureDate))),
                    0
                  )
                  const tW = Math.max(tDuration * dayWidth, dayWidth * 1.5 + 40)
                  const cfg = TRANSPORT_CONFIG[transport.type]
                  const isHovering = hoverTransportId === transport.id

                  return (
                    <div
                      key={transport.id}
                      style={{
                        position: 'absolute', left: tX, top: transportTop, height: TRANSPORT_H, width: tW,
                        background: cfg.lightBg, border: `1px solid ${cfg.lightBorder}`, borderRadius: 8,
                        display: 'flex', alignItems: 'center', gap: 7,
                        paddingLeft: 10, paddingRight: isHovering ? 68 : 10,
                        cursor: 'pointer', zIndex: 2,
                        boxShadow: isHovering ? `0 2px 8px ${cfg.color}22` : 'none',
                        transition: 'box-shadow 0.15s',
                      }}
                      onClick={() => onClickTransport?.(transport)}
                      onMouseEnter={() => setHoverTransportId(transport.id)}
                      onMouseLeave={() => setHoverTransportId(null)}
                    >
                      <TransportIcon type={transport.type} size={13} color={cfg.color} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: cfg.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {transport.fromCity} → {transport.toCity}
                      </span>
                      {tW > 160 && transport.carrier && (
                        <span style={{ fontSize: 11, color: cfg.color, opacity: 0.6, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {transport.carrier}
                        </span>
                      )}
                      {isHovering && (
                        <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 3 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); onEditTransport?.(transport) }}
                            style={{ fontSize: 11, color: cfg.color, padding: '3px 6px', borderRadius: 4, border: `1px solid ${cfg.lightBorder}`, background: TL.btnBg, cursor: 'pointer' }}
                          >Edit</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteTransport?.(transport.id) }}
                            style={{ fontSize: 12, color: '#f87171', padding: '2px 6px', borderRadius: 4, border: '1px solid #fecaca', background: TL.btnBg, cursor: 'pointer', lineHeight: 1.4 }}
                          >✕</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )
          })()}

        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5">
        <div className="flex items-center gap-1.5">
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f0f9ff', border: '1px solid #bae6fd' }} />
          <span className="text-xs text-gray-500">Vacation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f5f3ff', border: '1px solid #ddd6fe' }} />
          <span className="text-xs text-gray-500">Business</span>
        </div>
        <div className="w-px h-3 bg-gray-200" />
        {Object.entries(ACTIVITY_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color }} />
            <span className="text-xs text-gray-500">{cfg.label}</span>
          </div>
        ))}
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">Drag to move · drag edges to resize</span>
      </div>
    </div>
  )
}
