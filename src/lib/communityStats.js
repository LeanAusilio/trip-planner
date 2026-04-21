import { supabase } from './supabase'

export async function publishStats(userId, year, stats) {
  if (!supabase) return
  const { error } = await supabase.from('community_stats').upsert(
    {
      user_id:         userId,
      year,
      km_traveled:     Math.round(stats.km),
      nights_away:     stats.nightsAway,
      country_count:   stats.countryCodes.length,
      continent_count: stats.continents.length,
      dest_count:      stats.destinationCount,
      published_at:    new Date().toISOString(),
    },
    { onConflict: 'user_id,year' }
  )
  if (error) throw error
}

export async function getPercentile(km, year) {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('get_travel_percentile', {
    p_km: Math.round(km),
    p_year: year,
  })
  if (error || !data) return null
  const { percentile, avg_km, median_km, sample_size, p75_km, p90_km } = data
  if (!sample_size || sample_size < 10) return null
  return {
    percentile: Math.round(percentile ?? 0),
    avgKm: Math.round(avg_km ?? 0),
    medianKm: Math.round(median_km ?? 0),
    sampleSize: sample_size,
    p75Km: Math.round(p75_km ?? 0),
    p90Km: Math.round(p90_km ?? 0),
  }
}

export async function getCommunityInsights(year) {
  const result = await getPercentile(0, year)
  if (!result) return null
  return { totalUsers: result.sampleSize, medianKm: result.medianKm, p75Km: result.p75Km, p90Km: result.p90Km }
}
