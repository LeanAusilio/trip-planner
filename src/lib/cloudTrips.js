import { supabase } from './supabase'

export async function loadTrips(userId) {
  const { data, error } = await supabase
    .from('trips')
    .select('id, name, data')
    .eq('user_id', userId)
    .order('data->createdAt')
  if (error) throw error
  return data.map(({ id, name, data: d }) => ({ ...d, id, name }))
}

export async function saveTrip(userId, trip) {
  const { id, name, ...data } = trip
  const { error } = await supabase
    .from('trips')
    .upsert({ id, user_id: userId, name, data, updated_at: new Date().toISOString() })
  if (error) throw error
}

export async function deleteCloudTrip(tripId) {
  const { error } = await supabase.from('trips').delete().eq('id', tripId)
  if (error) throw error
}
