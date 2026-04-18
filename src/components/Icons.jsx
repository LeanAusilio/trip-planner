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

export const TRANSPORT_CONFIG = {
  flight: { label: 'Flight', color: '#3b82f6', lightBg: '#eff6ff', lightBorder: '#bfdbfe' },
  train:  { label: 'Train',  color: '#10b981', lightBg: '#f0fdf4', lightBorder: '#a7f3d0' },
  bus:    { label: 'Bus',    color: '#f59e0b', lightBg: '#fffbeb', lightBorder: '#fde68a' },
  ferry:  { label: 'Ferry',  color: '#06b6d4', lightBg: '#ecfeff', lightBorder: '#a5f3fc' },
  car:    { label: 'Car',    color: '#8b5cf6', lightBg: '#f5f3ff', lightBorder: '#ddd6fe' },
}

export function TransportIcon({ type, size = 14, color = 'white' }) {
  const s = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  }

  if (type === 'flight') return (
    <svg {...s} strokeWidth="1.8">
      <path d="M22 16.5l-9.5-9.5-1.5 3.5-7-2 2.5 2.5-2 4.5 3.5-1 1 3 3.5-3.5 1.5 3 3.5-1.5z" />
    </svg>
  )

  if (type === 'train') return (
    <svg {...s} strokeWidth="1.8">
      <rect x="4" y="3" width="16" height="13" rx="3" />
      <path d="M4 11h16" />
      <path d="M8 16l-2 3M16 16l2 3" />
      <path d="M9 7h6" />
    </svg>
  )

  if (type === 'bus') return (
    <svg {...s} strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 17v2M16 17v2" />
      <circle cx="8" cy="19" r="1" fill={color} stroke="none" />
      <circle cx="16" cy="19" r="1" fill={color} stroke="none" />
    </svg>
  )

  if (type === 'ferry') return (
    <svg {...s} strokeWidth="1.8">
      <path d="M2 18l4-9h12l4 9" />
      <path d="M6 9V5h12v4" />
      <path d="M2 18c2 2 5 2 8 0s6-2 8 0" />
    </svg>
  )

  if (type === 'car') return (
    <svg {...s} strokeWidth="1.8">
      <path d="M5 11l1.5-4.5h11L19 11" />
      <rect x="2" y="11" width="20" height="7" rx="2" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  )

  return null
}

/** Plane icon for destinations section header */
export function PlaneIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22l-4-9-9-4 20-7z" />
    </svg>
  )
}

/** Suitcase icon for packing list section header */
export function SuitcaseIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
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
