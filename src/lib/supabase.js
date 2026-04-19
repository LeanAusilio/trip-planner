import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Exported as null when env vars are absent — app still loads, collaboration just unavailable
export const supabase = url && key ? createClient(url, key) : null
