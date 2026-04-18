import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function MapView({ destinations, dark }) {
  const [open, setOpen] = useState(true)

  const mapped = destinations
    .filter((d) => d.lat != null && d.lng != null)
    .sort((a, b) => new Date(a.arrival) - new Date(b.arrival))

  if (mapped.length === 0) return null

  const positions = mapped.map((d) => [d.lat, d.lng])

  // Compute center
  const avgLat = positions.reduce((s, [lat]) => s + lat, 0) / positions.length
  const avgLng = positions.reduce((s, [, lng]) => s + lng, 0) / positions.length

  const tileUrl = dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  return (
    <section className="mb-8">
      <div
        className="flex items-center justify-between mb-3 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <h2 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <span>🗺</span> Route Map
          <span className="normal-case text-gray-500 dark:text-gray-400 font-normal tracking-normal">
            {mapped.length} destination{mapped.length !== 1 ? 's' : ''}
          </span>
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800" style={{ height: 320 }}>
          <MapContainer
            center={[avgLat, avgLng]}
            zoom={mapped.length === 1 ? 8 : 3}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              url={tileUrl}
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />

            {/* Route line */}
            {positions.length > 1 && (
              <Polyline
                positions={positions}
                pathOptions={{ color: dark ? '#88c0e0' : '#7ab0d4', weight: 1.5, dashArray: '6 4', opacity: 0.7 }}
              />
            )}

            {/* Destination markers */}
            {mapped.map((dest, i) => (
              <CircleMarker
                key={dest.id}
                center={[dest.lat, dest.lng]}
                radius={i === 0 || i === mapped.length - 1 ? 7 : 5}
                pathOptions={{
                  fillColor: dest.type === 'vacation' ? '#0ea5e9' : '#8b5cf6',
                  fillOpacity: 0.85,
                  color: dark ? '#1f2937' : '#ffffff',
                  weight: 2,
                }}
              >
                <Tooltip permanent={mapped.length <= 6} direction="top" offset={[0, -8]}>
                  <span style={{ fontSize: 11, fontWeight: 500 }}>{dest.city}</span>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}
    </section>
  )
}
