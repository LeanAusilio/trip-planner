export const ACTIVITY_CONFIG = {
  restaurant: { label: 'Restaurant', color: '#f97316', lightBg: '#fff7ed', lightBorder: '#fed7aa' },
  attraction: { label: 'Attraction', color: '#0ea5e9', lightBg: '#f0f9ff', lightBorder: '#bae6fd' },
  shopping:   { label: 'Shopping',   color: '#a855f7', lightBg: '#faf5ff', lightBorder: '#e9d5ff' },
  medical:    { label: 'Medical',    color: '#ef4444', lightBg: '#fef2f2', lightBorder: '#fecaca' },
}

/** SVG icon for an activity type. Defaults to white (for colored pins). */
export function ActivityIcon({ type, size = 14, color = 'white' }) {
  const s = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  }

  if (type === 'restaurant') return (
    // Fork (left) + knife (right)
    <svg {...s} strokeWidth="2">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" />
      <path d="M7 11v9" />
      <path d="M15 2v4a3 3 0 006 0V2" />
      <path d="M18 11v9" />
    </svg>
  )

  if (type === 'attraction') return (
    // Camera
    <svg {...s} strokeWidth="2">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )

  if (type === 'shopping') return (
    // Shopping bag
    <svg {...s} strokeWidth="2">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )

  if (type === 'medical') return (
    // Cross
    <svg {...s} strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )

  return null
}

/** Bed icon for hotels */
export function BedIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v13M21 7v13" />
      <path d="M3 13h18" />
      <path d="M3 20h18" />
      <path d="M3 7a2 2 0 012-2h4a2 2 0 012 2" />
      <path d="M13 7a2 2 0 012-2h4a2 2 0 012 2" />
    </svg>
  )
}

/** Pencil / edit icon */
export function EditIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}
