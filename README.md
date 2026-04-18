# Wayfar

A minimalist trip planner — organize destinations, hotels, transport, activities, budgets, and packing lists across multiple trips, all in your browser with no account required.

**Live app:** https://trip-planner-leanausilio.vercel.app

---

## Features

- **Timeline** — drag-to-move and drag-to-resize destination blocks; zoom in/out; jump to today
- **Multi-trip** — up to 3 trips in a slide-out sidebar; rename and switch between trips instantly
- **Destinations** — city search via OpenStreetMap Nominatim; vacation or business type; same-day and overlapping stays supported
- **Hotels** — check-in/out dates with overlap protection per trip
- **Transport** — flight, train, bus, ferry, and car legs with carrier, booking ref, and schedule
- **Activities** — restaurant, attraction, shopping, and medical; pinned to destination rows on the timeline
- **Budget tracking** — optional cost fields on every entity; live total in the header; summary dashboard with per-destination breakdown and category bars
- **Packing list** — per-trip checklist with check/uncheck, delete, and clear-checked
- **Weather forecast** — 5-day forecast for upcoming destinations using Open-Meteo (no API key needed)
- **Route map** — interactive Leaflet map with destination markers and dashed route polyline
- **Dark mode** — toggle in the header; respects system preference on first load
- **Export** — ICS calendar, Google Calendar links, and print/PDF
- **No backend** — all data lives in `localStorage`; nothing leaves your browser

---

## Tech stack

| Layer | Library |
|---|---|
| UI | React 18 |
| Bundler | Vite |
| Styling | Tailwind CSS |
| Date math | date-fns |
| Map | Leaflet + react-leaflet |
| Weather API | [Open-Meteo](https://open-meteo.com) (free, no auth) |
| City search | [Nominatim](https://nominatim.openstreetmap.org) (free, no auth) |
| Tests | Vitest + @testing-library/react |
| Hosting | Vercel |

---

## Getting started

```bash
# Install dependencies
npm install

# Start dev server at http://localhost:5173
npm run dev

# Run tests
npm test

# Production build
npm run build
```

No environment variables or API keys are required.

---

## Project structure

```
src/
├── App.jsx                  # Root: all state, trip management, layout
├── index.css                # Global styles + dark mode form input overrides
└── components/
    ├── Timeline.jsx         # Drag-and-drop timeline (absolute positioning, no DOM virtualization)
    ├── TripSidebar.jsx      # Slide-out panel for switching/creating/renaming trips
    ├── DetailCard.jsx       # Slide-over panel showing full details for a selected item
    ├── AddDestinationModal.jsx
    ├── HotelModal.jsx
    ├── ActivityModal.jsx
    ├── TransportModal.jsx
    ├── PackingList.jsx      # Per-trip packing checklist
    ├── WeatherWidget.jsx    # Upcoming destination forecasts via Open-Meteo
    ├── MapView.jsx          # Leaflet route map
    ├── SummaryDashboard.jsx # Budget breakdown with bar charts
    ├── ExportModal.jsx      # ICS / Google Calendar / print export
    ├── CitySearch.jsx       # Debounced Nominatim autocomplete, returns lat/lng
    └── Icons.jsx            # Inline SVG icons + ACTIVITY_CONFIG / TRANSPORT_CONFIG
```

---

## Data model

All state lives in `App.jsx` and is persisted to `localStorage` under key `trip-planner-v3`.

```js
{
  activeTripId: string,
  trips: [
    {
      id: string,
      name: string,
      createdAt: ISO string,
      destinations: [{ id, city, country, countryCode, lat?, lng?, arrival, departure, type, budget?, ...flightFields }],
      hotels:       [{ id, name, checkIn, checkOut, budget?, address?, confirmationNumber?, bookingUrl? }],
      activities:   [{ id, destinationId, type, name, date, budget?, address?, ...typeSpecificFields }],
      transports:   [{ id, type, fromCity, toCity, departureDate, arrivalDate, budget?, carrier?, bookingRef? }],
      packingList:  [{ id, text, checked }]
    }
  ]
}
```

Dates are ISO 8601 strings. IDs use `crypto.randomUUID()`. Arrays are sorted by date on every mutation.

**Storage versioning:** the schema was `trip-planner-v1` (flat array), then `trip-planner-v2` (flat object), now `trip-planner-v3` (trips array). `loadState()` in `App.jsx` migrates older formats automatically.

---

## Key architecture notes

**Timeline** uses absolute positioning and a `useRef`-tracked drag state (`dragState.current`) for performance — no React state is touched during a drag, only on mouseup. Click vs drag is disambiguated by a 3px movement threshold (`hasMoved`).

**Zoom** is controlled by `zoomIdx` (index into `ZOOM_LEVELS = [18, 24, 36, 48, 64]` px/day). All layout calculations use `dayWidth = ZOOM_LEVELS[zoomIdx]` rather than a constant.

**Weather and map** require destinations to have `lat`/`lng`. These are stored automatically when a city is picked via the search; existing destinations without coordinates are silently skipped.

**Overlap validation** uses strict inequalities (`arr < dDep && dep > dArr`) so destinations can share a boundary day — useful for same-day transit stops.

---

## Deployment

The app is deployed to Vercel and auto-deploys on every push to `main`. No configuration is needed — Vercel auto-detects Vite.

To deploy your own fork:
1. Push to a GitHub repo
2. Import the repo at [vercel.com](https://vercel.com)
3. Click Deploy — no build settings to change
