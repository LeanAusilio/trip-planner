import { useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { loadTrips, saveTrip, deleteCloudTrip } from '../lib/cloudTrips'
import { CLOUD_SYNC_DEBOUNCE_MS } from '../lib/constants'

export function useCloudSync({ userId, trips, setTrips, setActiveTripId }) {
  // Snapshot of local trips taken at the moment a user first signs in,
  // used to migrate them to the cloud if the cloud is empty.
  const localSnapshotRef = useRef(null)

  useEffect(() => {
    if (!userId || !supabase) return
    if (localSnapshotRef.current === null) localSnapshotRef.current = trips

    loadTrips(userId)
      .then((cloudTrips) => {
        if (cloudTrips.length > 0) {
          setTrips(cloudTrips)
          setActiveTripId((prev) => cloudTrips.find((t) => t.id === prev)?.id ?? cloudTrips[0].id)
        } else {
          localSnapshotRef.current.forEach((t) =>
            saveTrip(userId, t).catch((err) => console.error('[Wayfar] cloud migration failed', err))
          )
        }
      })
      .catch((err) => console.error('[Wayfar] loadTrips failed', err))
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!userId || !supabase) return
    const timer = setTimeout(() => {
      trips.forEach((t) =>
        saveTrip(userId, t).catch((err) => console.error('[Wayfar] saveTrip failed', err))
      )
    }, CLOUD_SYNC_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [trips, userId])

  const deleteFromCloud = (tripId) => {
    if (!userId || !supabase) return
    deleteCloudTrip(tripId).catch((err) => console.error('[Wayfar] deleteCloudTrip failed', err))
  }

  return { deleteFromCloud }
}
