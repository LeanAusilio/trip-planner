import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { uuid } from '../lib/uuid'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode() {
  return Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
}

function debounce(fn, ms) {
  let timer
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms) }
}

export function useCollaboration({ tripData, onRemoteUpdate }) {
  const clientId = useRef(uuid()).current
  const [tripCode, setTripCode]     = useState(null)
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle'|'syncing'|'synced'|'error'
  // Prevents a remote-triggered update from bouncing back as an outgoing write
  const skipNextSync = useRef(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const doSync = useCallback(
    debounce(async (code, data) => {
      if (!supabase) return
      setSyncStatus('syncing')
      const { error } = await supabase
        .from('collab_trips')
        .update({ data: { ...data, _wid: clientId }, updated_at: new Date().toISOString() })
        .eq('code', code)
      setSyncStatus(error ? 'error' : 'synced')
    }, 600),
    [clientId]
  )

  // Push local changes → Supabase (skipped when triggered by a remote update)
  useEffect(() => {
    if (!tripCode) return
    if (skipNextSync.current) { skipNextSync.current = false; return }
    doSync(tripCode, tripData)
  }, [tripData, tripCode, doSync])

  // Subscribe to remote changes
  useEffect(() => {
    if (!tripCode || !supabase) return
    const channel = supabase
      .channel(`collab:${tripCode}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'collab_trips', filter: `code=eq.${tripCode}` },
        (payload) => {
          const { _wid, ...data } = payload.new.data
          if (_wid === clientId) return // our own write echoed back
          skipNextSync.current = true
          onRemoteUpdate(data)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tripCode, clientId, onRemoteUpdate])

  const startSharing = async () => {
    if (!supabase) throw new Error('Collaboration unavailable — Supabase not configured')
    const code = generateCode()
    const { error } = await supabase
      .from('collab_trips')
      .insert({ code, data: { ...tripData, _wid: clientId } })
    if (error) throw new Error(error.message)
    setTripCode(code)
    setSyncStatus('synced')
    return code
  }

  const joinTrip = async (code) => {
    if (!supabase) throw new Error('Collaboration unavailable — Supabase not configured')
    const upper = code.toUpperCase().trim()
    const { data: row, error } = await supabase
      .from('collab_trips')
      .select('data')
      .eq('code', upper)
      .single()
    if (error) throw new Error('Trip not found — check the code and try again')
    const { _wid: _ignored, ...data } = row.data
    skipNextSync.current = true
    onRemoteUpdate(data)
    setTripCode(upper)
    setSyncStatus('synced')
  }

  const stopSharing = () => { setTripCode(null); setSyncStatus('idle') }

  return { tripCode, syncStatus, isCollaborating: !!tripCode, startSharing, joinTrip, stopSharing }
}
