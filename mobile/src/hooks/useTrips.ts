import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { uuid } from '../utils/uuid'
import { makeTrip } from '../lib/makeTrip'
import { createDemoTrips } from '../lib/demoData'
import { STORAGE_KEY } from '../lib/constants'
import type { Trip, Destination, Hotel, Activity, Transport } from '../types/trip'

interface StoredState {
  trips: Trip[]
  activeTripId: string | null
}

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [activeTripId, setActiveTripId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Load from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed: StoredState = JSON.parse(data)
          if (parsed.trips?.length > 0) {
            setTrips(parsed.trips)
            setActiveTripId(parsed.activeTripId || parsed.trips[0]?.id || null)
          }
        } catch {}
      }
      setLoaded(true)
    })
  }, [])

  // Persist to AsyncStorage whenever state changes
  useEffect(() => {
    if (!loaded) return
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ trips, activeTripId }))
  }, [trips, activeTripId, loaded])

  const activeTrip = trips.find((t) => t.id === activeTripId) || trips[0] || null

  // Update a field on the active trip
  const updateActiveTrip = useCallback((updates: Partial<Trip>) => {
    setTrips((prev) => prev.map((t) => (t.id === activeTripId ? { ...t, ...updates } : t)))
  }, [activeTripId])

  // Destinations
  const addDestination = useCallback((dest: Omit<Destination, 'id'>) => {
    const newDest = { ...dest, id: uuid() }
    updateActiveTrip({
      destinations: [...(activeTrip?.destinations || []), newDest]
        .sort((a, b) => (a.arrival < b.arrival ? -1 : 1)),
    })
    return newDest
  }, [activeTrip, updateActiveTrip])

  const updateDestination = useCallback((id: string, updates: Partial<Destination>) => {
    if (!activeTrip) return
    updateActiveTrip({
      destinations: activeTrip.destinations
        .map((d) => (d.id === id ? { ...d, ...updates } : d))
        .sort((a, b) => (a.arrival < b.arrival ? -1 : 1)),
    })
  }, [activeTrip, updateActiveTrip])

  const deleteDestination = useCallback((id: string) => {
    if (!activeTrip) return
    updateActiveTrip({
      destinations: activeTrip.destinations.filter((d) => d.id !== id),
      activities: activeTrip.activities.filter((a) => a.destinationId !== id),
    })
  }, [activeTrip, updateActiveTrip])

  // Hotels
  const addHotel = useCallback((hotel: Omit<Hotel, 'id'>) => {
    const newHotel = { ...hotel, id: uuid() }
    updateActiveTrip({ hotels: [...(activeTrip?.hotels || []), newHotel] })
  }, [activeTrip, updateActiveTrip])

  const updateHotel = useCallback((id: string, updates: Partial<Hotel>) => {
    if (!activeTrip) return
    updateActiveTrip({ hotels: activeTrip.hotels.map((h) => (h.id === id ? { ...h, ...updates } : h)) })
  }, [activeTrip, updateActiveTrip])

  const deleteHotel = useCallback((id: string) => {
    if (!activeTrip) return
    updateActiveTrip({ hotels: activeTrip.hotels.filter((h) => h.id !== id) })
  }, [activeTrip, updateActiveTrip])

  // Activities
  const addActivity = useCallback((activity: Omit<Activity, 'id'>) => {
    const newAct = { ...activity, id: uuid() }
    updateActiveTrip({ activities: [...(activeTrip?.activities || []), newAct] })
  }, [activeTrip, updateActiveTrip])

  const updateActivity = useCallback((id: string, updates: Partial<Activity>) => {
    if (!activeTrip) return
    updateActiveTrip({ activities: activeTrip.activities.map((a) => (a.id === id ? { ...a, ...updates } : a)) })
  }, [activeTrip, updateActiveTrip])

  const deleteActivity = useCallback((id: string) => {
    if (!activeTrip) return
    updateActiveTrip({ activities: activeTrip.activities.filter((a) => a.id !== id) })
  }, [activeTrip, updateActiveTrip])

  // Transports
  const addTransport = useCallback((transport: Omit<Transport, 'id'>) => {
    const newT = { ...transport, id: uuid() }
    updateActiveTrip({ transports: [...(activeTrip?.transports || []), newT] })
  }, [activeTrip, updateActiveTrip])

  const updateTransport = useCallback((id: string, updates: Partial<Transport>) => {
    if (!activeTrip) return
    updateActiveTrip({ transports: activeTrip.transports.map((t) => (t.id === id ? { ...t, ...updates } : t)) })
  }, [activeTrip, updateActiveTrip])

  const deleteTransport = useCallback((id: string) => {
    if (!activeTrip) return
    updateActiveTrip({ transports: activeTrip.transports.filter((t) => t.id !== id) })
  }, [activeTrip, updateActiveTrip])

  // Trip management
  const addTrip = useCallback((name: string) => {
    const newTrip = makeTrip(name)
    setTrips((prev) => [...prev, newTrip])
    setActiveTripId(newTrip.id)
    return newTrip
  }, [])

  const deleteTrip = useCallback((id: string) => {
    setTrips((prev) => {
      const next = prev.filter((t) => t.id !== id)
      if (activeTripId === id) setActiveTripId(next[0]?.id || null)
      return next
    })
  }, [activeTripId])

  const renameTrip = useCallback((id: string, name: string) => {
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)))
  }, [])

  const loadDemoData = useCallback(() => {
    const demoTrips = createDemoTrips().map((t: any) => makeTrip(t.name, t))
    setTrips(demoTrips)
    setActiveTripId(demoTrips[0]?.id || null)
  }, [])

  return {
    trips, setTrips, activeTripId, setActiveTripId, activeTrip, loaded,
    addDestination, updateDestination, deleteDestination,
    addHotel, updateHotel, deleteHotel,
    addActivity, updateActivity, deleteActivity,
    addTransport, updateTransport, deleteTransport,
    addTrip, deleteTrip, renameTrip, updateActiveTrip, loadDemoData,
  }
}
