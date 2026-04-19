import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Temporary diagnostic — remove after confirming env vars are received
console.log('[supabase] url present:', !!url, '| key present:', !!key)
if (url) console.log('[supabase] url prefix:', url.slice(0, 30))

// Wrap in try-catch so an iOS compatibility error here doesn't crash the whole app
let supabase = null
try {
  if (url && key) supabase = createClient(url, key)
} catch (e) {
  console.error('[supabase] init failed — collaboration unavailable:', e)
}

export { supabase }
