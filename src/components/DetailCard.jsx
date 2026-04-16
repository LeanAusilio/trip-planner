import { format, differenceInDays, startOfDay } from 'date-fns'
import { Flag } from './CitySearch'
import { ACTIVITY_CONFIG, ActivityIcon, BedIcon } from './Icons'

// ── Shared helpers ─────────────────────────────────────────────────────────

function Row({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-gray-700 mt-0.5">{value}</p>
    </div>
  )
}

function Link({ label, href }) {
  if (!href) return null
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-sky-600 hover:underline mt-0.5 block truncate"
      >
        {href}
      </a>
    </div>
  )
}

function Section({ title, children }) {
  const hasContent = Array.isArray(children)
    ? children.some(Boolean)
    : Boolean(children)
  if (!hasContent) return null
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}

// ── Destination card ────────────────────────────────────────────────────────

function DestinationCard({ dest, relatedActivities, relatedHotels }) {
  const nights = differenceInDays(
    startOfDay(new Date(dest.departure)),
    startOfDay(new Date(dest.arrival))
  )
  const isVacation = dest.type === 'vacation'

  const hasFlightInfo = dest.flightNumber || dest.airline || dest.departureTime || dest.arrivalTime

  return (
    <div className="space-y-5">
      {/* Title block */}
      <div className="flex items-center gap-3">
        <Flag code={dest.countryCode} country={dest.country} />
        <div>
          <h2 className="text-base font-semibold text-gray-900">{dest.city}</h2>
          <p className="text-xs text-gray-400">{dest.country}</p>
        </div>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full"
          style={{
            background: isVacation ? '#f0f9ff' : '#f5f3ff',
            color: isVacation ? '#0369a1' : '#6d28d9',
          }}
        >
          {dest.type}
        </span>
      </div>

      {/* Dates */}
      <Section title="Stay">
        <Row
          label="Dates"
          value={`${format(new Date(dest.arrival), 'MMM d, yyyy')} → ${format(new Date(dest.departure), 'MMM d, yyyy')}`}
        />
        <Row label="Duration" value={`${nights} night${nights !== 1 ? 's' : ''}`} />
      </Section>

      {/* Flight info */}
      {hasFlightInfo && (
        <Section title="Flight">
          <Row label="Airline" value={dest.airline} />
          <Row label="Flight number" value={dest.flightNumber} />
          <Row label="Departure time" value={dest.departureTime} />
          <Row label="Arrival time" value={dest.arrivalTime} />
        </Section>
      )}

      {/* Notes */}
      {dest.notes && <Section title="Notes"><Row label="" value={dest.notes} /></Section>}

      {/* Hotels overlapping this destination */}
      {relatedHotels.length > 0 && (
        <Section title="Hotels">
          {relatedHotels.map((h) => {
            const hotelNights = differenceInDays(
              startOfDay(new Date(h.checkOut)),
              startOfDay(new Date(h.checkIn))
            )
            return (
              <div key={h.id} className="flex items-start gap-2">
                <BedIcon size={13} color="#a8a29e" />
                <div>
                  <p className="text-sm text-gray-700 font-medium">{h.name}</p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(h.checkIn), 'MMM d')} – {format(new Date(h.checkOut), 'MMM d')} · {hotelNights}n
                  </p>
                  {h.address && <p className="text-xs text-gray-500 mt-0.5">{h.address}</p>}
                </div>
              </div>
            )
          })}
        </Section>
      )}

      {/* Activities */}
      {relatedActivities.length > 0 && (
        <Section title="Activities">
          {relatedActivities
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((act) => {
              const cfg = ACTIVITY_CONFIG[act.type]
              return (
                <div key={act.id} className="flex items-center gap-2">
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: cfg.color }}
                  >
                    <ActivityIcon type={act.type} size={11} color="white" />
                  </span>
                  <div className="min-w-0">
                    <span className="text-sm text-gray-700">{act.name}</span>
                    <span className="text-xs text-gray-400 ml-1.5">{format(new Date(act.date), 'MMM d')}</span>
                    {act.address && <p className="text-xs text-gray-400 truncate">{act.address}</p>}
                  </div>
                </div>
              )
            })}
        </Section>
      )}
    </div>
  )
}

// ── Hotel card ──────────────────────────────────────────────────────────────

function HotelCard({ hotel }) {
  const nights = differenceInDays(
    startOfDay(new Date(hotel.checkOut)),
    startOfDay(new Date(hotel.checkIn))
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <BedIcon size={18} color="#a8a29e" />
        <div>
          <h2 className="text-base font-semibold text-gray-900">{hotel.name}</h2>
          <p className="text-xs text-gray-400">{nights} night{nights !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <Section title="Stay">
        <Row label="Check-in" value={format(new Date(hotel.checkIn), 'MMM d, yyyy')} />
        <Row label="Check-out" value={format(new Date(hotel.checkOut), 'MMM d, yyyy')} />
      </Section>

      {(hotel.address || hotel.confirmationNumber || hotel.bookingUrl) && (
        <Section title="Details">
          <Row label="Address" value={hotel.address} />
          <Row label="Confirmation" value={hotel.confirmationNumber} />
          <Link label="Booking link" href={hotel.bookingUrl} />
        </Section>
      )}
    </div>
  )
}

// ── Activity card ───────────────────────────────────────────────────────────

function ActivityCard({ activity, destination }) {
  const cfg = ACTIVITY_CONFIG[activity.type]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: cfg.color }}
        >
          <ActivityIcon type={activity.type} size={16} color="white" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{activity.name}</h2>
          <p className="text-xs text-gray-400">
            {cfg.label} · {format(new Date(activity.date), 'MMM d, yyyy')}
            {destination && ` · ${destination.city}`}
          </p>
        </div>
      </div>

      <Section title="Details">
        <Row label="Address" value={activity.address} />
        {activity.type === 'medical' && (
          <>
            <Row label="Doctor / provider" value={activity.doctorName} />
            <Row label="Appointment time" value={activity.time} />
            <Row label="Phone" value={activity.phone} />
          </>
        )}
        {activity.type === 'restaurant' && (
          <>
            <Row label="Phone" value={activity.phone} />
            <Row label="Reservation ref" value={activity.reservationRef} />
          </>
        )}
        {(activity.type === 'attraction' || activity.type === 'shopping') && (
          <>
            <Link label="Website" href={activity.website} />
            {activity.type === 'attraction' && (
              <Row label="Opening hours" value={activity.openingHours} />
            )}
          </>
        )}
        <Row label="Notes" value={activity.notes} />
      </Section>
    </div>
  )
}

// ── Main DetailCard ─────────────────────────────────────────────────────────

export default function DetailCard({ item, onClose, onEdit }) {
  if (!item) return null

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="detail-card-backdrop"
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.04)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        data-testid="detail-card-panel"
        className="fixed right-0 top-0 bottom-0 z-50 bg-white border-l border-gray-100 shadow-xl flex flex-col"
        style={{ width: 320 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            {item.kind === 'destination' ? 'Destination' : item.kind === 'hotel' ? 'Hotel' : 'Activity'}
          </span>
          <button
            data-testid="detail-card-close"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors rounded"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {item.kind === 'destination' && (
            <DestinationCard
              dest={item.data}
              relatedActivities={item.activities ?? []}
              relatedHotels={item.hotels ?? []}
            />
          )}
          {item.kind === 'hotel' && <HotelCard hotel={item.data} />}
          {item.kind === 'activity' && (
            <ActivityCard activity={item.data} destination={item.destination} />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            data-testid="detail-card-edit"
            onClick={onEdit}
            className="w-full text-sm bg-gray-900 text-white rounded-lg py-2.5 hover:bg-gray-700 transition-colors font-medium"
          >
            Edit
          </button>
        </div>
      </div>
    </>
  )
}
