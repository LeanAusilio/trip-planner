import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Wrap in try-catch so an iOS compatibility error here doesn't crash the whole app
let supabase = null
try {
  if (url && key) supabase = createClient(url, key)
} catch (e) {
  console.error('[supabase] init failed — collaboration unavailable:', e)
}

export { supabase }
