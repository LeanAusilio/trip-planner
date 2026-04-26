// ── Persistence ──────────────────────────────────────────────────────────────
export const STORAGE_KEY      = 'trip-planner-v3'
export const DARK_MODE_KEY    = 'trip-planner-dark'
export const GUEST_MODE_KEY   = 'wayfar-guest-mode'

// ── Cloud ────────────────────────────────────────────────────────────────────
export const STORAGE_BUCKET   = 'Trips-docs'
export const SIGNED_URL_TTL_S = 3600

// ── Trip limits ──────────────────────────────────────────────────────────────
export const TRIP_LIMIT_GUEST = 3
export const TRIP_LIMIT_AUTH  = 5
export const MAX_DOCUMENTS    = 5
export const MAX_DOCUMENT_MB  = 5

// ── Timing ───────────────────────────────────────────────────────────────────
export const CLOUD_SYNC_DEBOUNCE_MS  = 800
export const COLLAB_DEBOUNCE_MS      = 600
export const CITY_SEARCH_DEBOUNCE_MS = 380
export const WEATHER_CACHE_TTL_MS    = 10 * 60 * 1000

// ── Branding ─────────────────────────────────────────────────────────────────
export const APP_NAME = 'Wayfar'
export const APP_URL  = 'wayfar-eta.vercel.app'
