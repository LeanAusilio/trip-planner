import { format, differenceInDays, startOfDay } from 'date-fns'
import { Flag } from './CitySearch'
import { ACTIVITY_CONFIG, ActivityIcon, BedIcon, TransportIcon, TRANSPORT_CONFIG } from './Icons'

export default function ItineraryList({
  destinations = [],
  activities = [],
  hotels = [],
  transports = [],
  onClickDest,
  onClickHotel,
  onClickActivity,
  onClickTransport,
  // edit/delete/drag callbacks accepted but unused (read-only on mobile)
}) {
  const sorted = [...destinations].sort((a, b) => (a.arrival < b.arrival ? -1 : 1))

  if (sorted.length === 0) return null

  return (
    <div className="sm:hidden space-y-3 px-1 pb-2">
      {sorted.map((dest) => {
        const nights = differenceInDays(
          startOfDay(new Date(dest.departure)),
          startOfDay(new Date(dest.arrival))
        )
        const destHotels = hotels.filter(
          (h) => h.destinationId === dest.id ||
            (new Date(h.checkIn) >= new Date(dest.arrival) &&
             new Date(h.checkOut) <= new Date(dest.departure))
        )
        const destActivities = activities
          .filter((a) => a.destinationId === dest.id)
          .sort((a, b) => (a.date < b.date ? -1 : 1))
        const destTransports = transports.filter(
          (t) => t.destinationId === dest.id ||
            (t.departureDate >= dest.arrival && t.departureDate <= dest.departure)
        )

        const hasDetails = destHotels.length > 0 || destActivities.length > 0 || destTransports.length > 0
        const accentColor = dest.type === 'business' ? '#a78bfa' : '#38bdf8'

        return (
          <div
            key={dest.id}
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden"
          >
            {/* Accent bar */}
            <div className="h-1" style={{ background: accentColor }} />

            {/* Destination header — tappable */}
            <button
              onClick={() => onClickDest?.(dest)}
              className="w-full text-left px-4 py-3 flex items-center gap-3 active:opacity-70 transition-opacity"
            >
              <Flag code={dest.countryCode} country={dest.country} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{dest.city}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{dest.country}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {format(new Date(dest.arrival), 'MMM d')}–{format(new Date(dest.departure), 'MMM d')}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {nights} night{nights !== 1 ? 's' : ''}
                </p>
              </div>
            </button>

            {hasDetails && (
              <div className="border-t border-gray-100 dark:border-gray-800">

                {/* Hotels */}
                {destHotels.map((hotel) => (
                  <button
                    key={hotel.id}
                    onClick={() => onClickHotel?.(hotel)}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 active:opacity-70 transition-opacity border-b border-gray-50 dark:border-gray-800/60 last:border-b-0"
                  >
                    <BedIcon size={13} color="#9ca3af" />
                    <span className="flex-1 text-xs text-gray-600 dark:text-gray-300 truncate">{hotel.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {format(new Date(hotel.checkIn), 'MMM d')}–{format(new Date(hotel.checkOut), 'MMM d')}
                    </span>
                  </button>
                ))}

                {/* Transports */}
                {destTransports.map((t) => {
                  const cfg = TRANSPORT_CONFIG[t.type] ?? TRANSPORT_CONFIG.flight
                  return (
                    <button
                      key={t.id}
                      onClick={() => onClickTransport?.(t)}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 active:opacity-70 transition-opacity border-b border-gray-50 dark:border-gray-800/60 last:border-b-0"
                    >
                      <TransportIcon type={t.type} size={13} color="#9ca3af" />
                      <span className="flex-1 text-xs text-gray-600 dark:text-gray-300 truncate">
                        {t.fromCity} → {t.toCity}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {format(new Date(t.departureDate), 'MMM d')}
                      </span>
                    </button>
                  )
                })}

                {/* Activity pills */}
                {destActivities.length > 0 && (
                  <div className="px-4 py-2.5 flex flex-wrap gap-1.5">
                    {destActivities.map((act) => {
                      const cfg = ACTIVITY_CONFIG[act.type] ?? ACTIVITY_CONFIG.attraction
                      return (
                        <button
                          key={act.id}
                          onClick={(e) => { e.stopPropagation(); onClickActivity?.(act) }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium active:opacity-70 transition-opacity"
                          style={{
                            background: cfg.lightBg,
                            border: `1px solid ${cfg.lightBorder}`,
                            color: cfg.color,
                          }}
                        >
                          <ActivityIcon type={act.type} size={10} color={cfg.color} />
                          {act.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
