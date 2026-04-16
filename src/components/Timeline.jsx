import { useRef, useState, useCallback, useEffect } from 'react'
import {
  format, addDays, differenceInDays, startOfDay,
  isSameDay, eachMonthOfInterval,
} from 'date-fns'
import { Flag } from './CitySearch'
import { ACTIVITY_CONFIG, ActivityIcon, BedIcon } from './Icons'

const DAY_WIDTH      = 36   // px per day
const DEST_H         = 44   // height of destination block
const ACTIVITY_H     = 28   // activity pin row below block
const ROW_H          = 4 + DEST_H + ACTIVITY_H  // 76px total per destination row
const ROW_GAP        = 4
const HOTEL_H        = 38
const HOTEL_GAP      = 12   // gap before hotel lane
const HEADER_H       = 52

function computeRange(destinations, hotels) {
  const today = startOfDay(new Date())
  const all = [
    ...destinations.map((d) => ({ s: new Date(d.arrival), e: new Date(d.departure) })),
    ...hotels.map((h) => ({ s: new Date(h.checkIn), e: new Date(h.checkOut) })),
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
function ActivityPin({ activity, x, onEdit, onDelete, onSelect }) {
  const [hovered, setHovered] = useState(false)
  const cfg = ACTIVITY_CONFIG[activity.type]
  const PIN_SIZE = 24

  return (
    <div
      style={{
        position: 'absolute',
        left: x + DAY_WIDTH / 2 - PIN_SIZE / 2,
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
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >Edit</button>
          <button
            onClick={() => onDelete(activity.id)}
            style={{
              fontSize: 10, background: 'white', border: '1px solid #fecaca',
              borderRadius: 4, padding: '2px 5px', cursor: 'pointer', color: '#f87171',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >✕</button>
        </div>
      )}
    </div>
  )
}

export default function Timeline({
  destinations, activities, hotels,
  onUpdateDest, onEditDest, onDeleteDest,
  onEditActivity, onDeleteActivity,
  onEditHotel, onDeleteHotel,
  onClickDest, onClickHotel, onClickActivity,
}) {
  const scrollRef = useRef(null)
  const dragState = useRef(null)  // { id, mode, startX, origArrival, origDeparture }
  const [dragId, setDragId] = useState(null)
  const [dragMode, setDragMode] = useState(null) // 'move' | 'resize-left' | 'resize-right'
  const [hoverId, setHoverId] = useState(null)
  const [hoverHotelId, setHoverHotelId] = useState(null)

  const { startDate, endDate } = computeRange(destinations, hotels)
  const totalDays = differenceInDays(endDate, startDate) + 1
  const totalWidth = totalDays * DAY_WIDTH
  const today = startOfDay(new Date())
  const todayOffset = differenceInDays(today, startDate)

  const activityMap = groupActivities(activities)

  // Scroll to show today on mount
  useEffect(() => {
    if (scrollRef.current && todayOffset > 0) {
      const center = todayOffset * DAY_WIDTH - scrollRef.current.offsetWidth / 2
      scrollRef.current.scrollLeft = Math.max(0, center)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const dateToX = (date) => differenceInDays(startOfDay(new Date(date)), startDate) * DAY_WIDTH

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
    const deltaDays = Math.round((e.clientX - startX) / DAY_WIDTH)
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
      // Must remain at least 1 day before departure
      if (newArrival >= origDeparture) return
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
      // Must remain at least 1 day after arrival
      if (newDeparture <= origArrival) return
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
  const canvasH = HEADER_H + destTotalH + hotelTotalH + 8

  return (
    <div>
      <div ref={scrollRef} className="overflow-x-auto timeline-scroll rounded-lg border border-gray-100">
        <div style={{ width: Math.max(totalWidth, '100%'), minWidth: '100%', position: 'relative', height: canvasH }}>

          {/* ── HEADER ── */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_H, borderBottom: '1px solid #f3f4f6' }}>
            {/* Month labels */}
            <div style={{ height: 22, position: 'relative' }}>
              {months.map((month, i) => {
                const monthStart = month < startDate ? startDate : month
                const x = differenceInDays(monthStart, startDate) * DAY_WIDTH
                const nextMonth = months[i + 1]
                const monthEnd = nextMonth ? addDays(nextMonth, -1) : endDate
                const monthEndC = monthEnd > endDate ? endDate : monthEnd
                const w = (differenceInDays(monthEndC, monthStart) + 1) * DAY_WIDTH
                return (
                  <div key={i} style={{
                    position: 'absolute', left: x, width: w, height: 22,
                    display: 'flex', alignItems: 'center', paddingLeft: 6,
                    borderLeft: i > 0 ? '1px solid #f3f4f6' : 'none',
                  }}>
                    <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                    width: DAY_WIDTH, flexShrink: 0, height: 30,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderLeft: isBoundary ? '1px solid #f3f4f6' : 'none',
                  }}>
                    {isToday ? (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 10, color: '#fff', fontWeight: 500 }}>{format(day, 'd')}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 10, color: '#d1d5db' }}>{format(day, 'd')}</span>
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
              position: 'absolute', left: todayOffset * DAY_WIDTH + DAY_WIDTH / 2,
              top: HEADER_H, bottom: 0, width: 1,
              background: 'rgba(0,0,0,0.07)', pointerEvents: 'none', zIndex: 0,
            }} />
          )}
          {/* Month boundary lines */}
          {months.slice(1).map((m, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: differenceInDays(m, startDate) * DAY_WIDTH,
              top: HEADER_H, bottom: 0, width: 1,
              background: '#f9fafb', pointerEvents: 'none',
            }} />
          ))}

          {/* ── DESTINATION ROWS ── */}
          {destinations.map((dest, idx) => {
            const rowTop = HEADER_H + idx * (ROW_H + ROW_GAP) + 8
            const blockX = dateToX(dest.arrival)
            const duration = differenceInDays(startOfDay(new Date(dest.departure)), startOfDay(new Date(dest.arrival)))
            const blockW = Math.max(duration * DAY_WIDTH, 60)
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
                  background: idx % 2 === 1 ? '#fafafa' : 'transparent',
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
                        style={{ fontSize: 11, color: textColor, padding: '3px 6px', borderRadius: 4, border: `1px solid ${blockBorder}`, background: 'white', cursor: 'pointer' }}
                      >Edit</button>
                      <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onDeleteDest(dest.id) }}
                        style={{ fontSize: 12, color: '#f87171', padding: '2px 6px', borderRadius: 4, border: '1px solid #fecaca', background: 'white', cursor: 'pointer', lineHeight: 1.4 }}
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
                    const startPinX = baseX + DAY_WIDTH / 2 - totalPinsW / 2

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
                  <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
                </div>

                {hotels.map((hotel) => {
                  const hX = dateToX(hotel.checkIn)
                  const hDuration = differenceInDays(startOfDay(new Date(hotel.checkOut)), startOfDay(new Date(hotel.checkIn)))
                  const hW = Math.max(hDuration * DAY_WIDTH, 70)
                  const isHovering = hoverHotelId === hotel.id

                  return (
                    <div
                      key={hotel.id}
                      style={{
                        position: 'absolute', left: hX, top: hotelTop, height: HOTEL_H, width: hW,
                        background: '#fafaf9', border: '1px solid #d6d3d1', borderRadius: 8,
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
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#78716c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {hotel.name}
                      </span>
                      {hW > 130 && (
                        <span style={{ fontSize: 11, color: '#a8a29e', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {format(new Date(hotel.checkIn), 'MMM d')}–{format(new Date(hotel.checkOut), 'MMM d')}
                        </span>
                      )}
                      {isHovering && (
                        <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 3 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); onEditHotel(hotel) }}
                            style={{ fontSize: 11, color: '#78716c', padding: '3px 6px', borderRadius: 4, border: '1px solid #d6d3d1', background: 'white', cursor: 'pointer' }}
                          >Edit</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteHotel(hotel.id) }}
                            style={{ fontSize: 12, color: '#f87171', padding: '2px 6px', borderRadius: 4, border: '1px solid #fecaca', background: 'white', cursor: 'pointer', lineHeight: 1.4 }}
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
          <span className="text-xs text-gray-400">Vacation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f5f3ff', border: '1px solid #ddd6fe' }} />
          <span className="text-xs text-gray-400">Business</span>
        </div>
        <div className="w-px h-3 bg-gray-200" />
        {Object.entries(ACTIVITY_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color }} />
            <span className="text-xs text-gray-400">{cfg.label}</span>
          </div>
        ))}
        <span className="text-xs text-gray-300 ml-auto">Drag to move · drag edges to resize</span>
      </div>
    </div>
  )
}
