import { useState } from 'react'
import { downloadICS, buildGoogleEvents, openPrintWindow } from '../utils/export'
import { ACTIVITY_CONFIG, ActivityIcon, BedIcon } from './Icons'
import { Flag } from './CitySearch'

const TABS = [
  { id: 'ical',   label: 'iCal / .ics' },
  { id: 'google', label: 'Google Calendar' },
  { id: 'pdf',    label: 'PDF' },
]

export default function ExportModal({ destinations, hotels, activities, onClose }) {
  const [tab, setTab] = useState('ical')
  const [icsDownloaded, setIcsDownloaded] = useState(false)

  const { destEvents, hotelEvents, activityEvents } = buildGoogleEvents(destinations, hotels, activities)
  const totalEvents = destEvents.length + hotelEvents.length + activityEvents.length

  const handleICS = () => {
    downloadICS(destinations, hotels, activities)
    setIcsDownloaded(true)
  }

  const handlePDF = () => {
    openPrintWindow(destinations, hotels, activities)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.08)' }}
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-md mx-4"
        style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm font-medium text-gray-900">Export</h2>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0 px-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`text-xs py-3 mr-5 border-b-2 transition-colors font-medium ${
                tab === t.id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── iCal tab ── */}
          {tab === 'ical' && (
            <div>
              <p className="text-xs text-gray-500 mb-1">
                Download a <code className="bg-gray-50 px-1 rounded text-gray-600">.ics</code> file
                with all your destinations, hotels, and activities as all-day calendar events.
              </p>
              <p className="text-xs text-gray-400 mb-5">
                Compatible with Apple Calendar, Google Calendar, Outlook, and any CalDAV app.
              </p>

              {/* Summary */}
              <div className="border border-gray-100 rounded-lg p-4 mb-5 space-y-2">
                <EventSummaryRow count={destinations.length} label="destinations" />
                <EventSummaryRow count={hotels.length} label="hotels" />
                <EventSummaryRow count={activities.length} label="activities" />
              </div>

              <button
                onClick={handleICS}
                className="w-full py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                {icsDownloaded ? '✓ Downloaded' : '↓ Download trips.ics'}
              </button>

              {icsDownloaded && (
                <p className="text-center text-xs text-gray-400 mt-3">
                  Open the file to import into your calendar app.
                </p>
              )}
            </div>
          )}

          {/* ── Google Calendar tab ── */}
          {tab === 'google' && (
            <div>
              <p className="text-xs text-gray-500 mb-1">
                Open each event directly in Google Calendar to add it to your calendar.
              </p>
              <p className="text-xs text-gray-400 mb-4">
                {totalEvents} event{totalEvents !== 1 ? 's' : ''} total — click each to add individually.
              </p>

              {destEvents.length > 0 && (
                <GCalSection
                  title="Destinations"
                  events={destEvents}
                  renderLeft={(e) => <Flag code={e.countryCode} country={e.label} />}
                />
              )}
              {hotelEvents.length > 0 && (
                <GCalSection
                  title="Hotels"
                  events={hotelEvents}
                  renderLeft={() => <BedIcon size={14} color="#a8a29e" />}
                />
              )}
              {activityEvents.length > 0 && (
                <GCalSection
                  title="Activities"
                  events={activityEvents}
                  renderLeft={(e) => {
                    const cfg = ACTIVITY_CONFIG[e.actType]
                    return (
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: cfg?.color ?? '#9ca3af',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <ActivityIcon type={e.actType} size={11} />
                      </div>
                    )
                  }}
                />
              )}

              {totalEvents === 0 && (
                <p className="text-xs text-gray-300 text-center py-8">No events to export.</p>
              )}
            </div>
          )}

          {/* ── PDF tab ── */}
          {tab === 'pdf' && (
            <div>
              <p className="text-xs text-gray-500 mb-1">
                Opens a clean, printable itinerary in a new window.
              </p>
              <p className="text-xs text-gray-400 mb-5">
                Use your browser's <strong>Print → Save as PDF</strong> option to export as a PDF file.
              </p>

              {/* Preview sketch */}
              <div className="border border-gray-100 rounded-lg p-4 mb-5 bg-gray-50">
                <div style={{ transform: 'scale(0.85)', transformOrigin: 'top left', width: '118%' }}>
                  <div className="text-sm font-medium text-gray-700 mb-0.5">Trip Itinerary</div>
                  <div className="text-xs text-gray-300 mb-3">Exported today</div>
                  {destinations.slice(0, 2).map((d) => (
                    <div key={d.id} className="flex items-center justify-between py-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Flag code={d.countryCode} country={d.country} />
                        <span className="text-xs text-gray-700">{d.city}</span>
                      </div>
                      <span className="text-xs text-gray-400 text-right">
                        {new Date(d.arrival).toLocaleDateString('en', { month: 'short', day: 'numeric' })} –{' '}
                        {new Date(d.departure).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                  {destinations.length > 2 && (
                    <div className="text-xs text-gray-300 pt-1.5 border-t border-gray-100">
                      + {destinations.length - 2} more destination{destinations.length - 2 !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handlePDF}
                className="w-full py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Open print view
              </button>
              <p className="text-center text-xs text-gray-300 mt-2">
                A new window will open — use Cmd+P (Mac) or Ctrl+P to save as PDF
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EventSummaryRow({ count, label }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-medium ${count > 0 ? 'text-gray-700' : 'text-gray-300'}`}>
        {count}
      </span>
    </div>
  )
}

function GCalSection({ title, events, renderLeft }) {
  return (
    <div className="mb-4">
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">{title}</div>
      <div className="border border-gray-100 rounded-lg overflow-hidden">
        {events.map((ev, i) => (
          <div
            key={ev.id}
            className={`flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors ${
              i < events.length - 1 ? 'border-b border-gray-50' : ''
            }`}
          >
            <div className="flex-shrink-0">{renderLeft(ev)}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-700 truncate">{ev.label}</div>
              <div className="text-xs text-gray-400 truncate">{ev.sub}</div>
            </div>
            <a
              href={ev.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-2.5 py-1 rounded flex-shrink-0 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              + Add
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
