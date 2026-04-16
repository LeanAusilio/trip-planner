# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with hot reload
npm run build     # Production build to /dist
npm run preview   # Preview production build locally
```

No test runner is configured. No linter is configured.

## Architecture

Trip Planner is a React 18 single-page app (Vite + Tailwind) with no backend. All data persists to `localStorage` under key `trip-planner-v2`. There is no router.

### State Shape

All state lives in `App.jsx` and flows down via props/callbacks. Three entity arrays:

```js
destinations[]  // { id, city, country, countryCode, arrival, departure, type: "vacation"|"business" }
hotels[]        // { id, name, checkIn, checkOut }
activities[]    // { id, destinationId, type, name, date }
```

Dates are ISO 8601 strings. IDs use `crypto.randomUUID()`. Arrays are auto-sorted by date on every mutation. On first load, `App.jsx` migrates legacy `trip-planner-v1` data to v2 schema.

### Modal System

A single `modal` state object `{ type, editing, context }` drives all CRUD. `type` is one of: `"addDestination"`, `"editDestination"`, `"addActivity"`, `"editActivity"`, `"addHotel"`, `"editHotel"`, `"export"`. Each modal receives the full entity arrays plus `onAdd`/`onUpdate`/`onDelete` callbacks.

### Timeline (Timeline.jsx)

The timeline is **not** DOM/React component-based — it uses absolute positioning and `useRef`-tracked drag state for performance. Key constants: `DAY_WIDTH = 36px`, `HEADER_HEIGHT`, `DEST_HEIGHT`, `HOTEL_HEIGHT`. Drag interactions (move, resize-left, resize-right) are tracked via `dragState.current` and update parent state through callbacks. The component auto-scrolls to today on mount.

Activities render as small colored pins below their destination row. Overlap detection runs on every drag-end to prevent conflicting date ranges.

### City Search (CitySearch.jsx)

Queries the Nominatim OpenStreetMap API (no auth required). Results are debounced (300ms, minimum 2 chars) and deduplicated by city+country. Flag emojis come from `flagcdn.com`. This is the only external network dependency at runtime.

### Export (utils/export.js)

Three export modes:
- **ICS**: RFC 5545 calendar format with CRLF line folding; destinations, hotels, and activities become `VEVENT` entries
- **Google Calendar**: Generates per-item template URLs (opened in new tabs)
- **PDF/Print**: Opens a print window with styled HTML; uses `@media print` CSS with `color-adjust: exact`

### Activity Types (Icons.jsx)

`ACTIVITY_CONFIG` defines the four activity types with colors and SVG icons:
- `restaurant` → orange `#f97316`
- `attraction` → sky blue `#0ea5e9`
- `shopping` → purple `#a855f7`
- `medical` → red `#ef4444`

All SVG icons are defined inline in `Icons.jsx`.

## Key Conventions

- **Date math**: Always use `date-fns` (imported throughout). Be careful with timezone-naive ISO strings — the app treats all dates as local.
- **Validation**: Client-side only, inside modal components before invoking callbacks. Hotels and destinations check for overlapping date ranges before saving.
- **Storage versioning**: If adding breaking schema changes, bump the localStorage key (e.g. `trip-planner-v3`) and add a migration in `App.jsx`.
- **Styling**: Tailwind utility classes throughout. Vacation destinations use sky-blue tones (`#f0f9ff`), business destinations use purple tones (`#f5f3ff`).
