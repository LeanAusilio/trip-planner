import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Flag } from './CitySearch'
import {
  yearDistanceKm,
  yearGeographicStats,
  yearNightsAway,
  getAvailableYears,
  getFunComparisons,
  getAchievementBadges,
  getTravelPersonality,
  multiYearKm,
  topCities,
  topCountries,
} from '../utils/travelStats'
import { publishStats, getPercentile } from '../lib/communityStats'

const TIER_COLORS = {
  bronze: { bg: '#fef3c7', text: '#92400e', ring: '#f59e0b' },
  silver: { bg: '#f1f5f9', text: '#475569', ring: '#94a3b8' },
  gold:   { bg: '#fefce8', text: '#713f12', ring: '#eab308' },
}

function StatCard({ value, label, sub }) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 p-4 flex flex-col gap-1">
      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 leading-none">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  )
}

function SparklineChart({ data, dark }) {
  if (data.length < 2) return null
  const max = Math.max(...data.map((d) => d.km), 1)
  const W = 100, H = 28
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - (d.km / max) * H
    return `${x},${y}`
  })
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 28 }}>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={dark ? '#60a5fa' : '#3b82f6'}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * W
        const y = H - (d.km / max) * H
        return <circle key={d.year} cx={x} cy={y} r={2} fill={dark ? '#60a5fa' : '#3b82f6'} />
      })}
    </svg>
  )
}

export default function TravelStats({ trips, user, dark, onClose }) {
  const currentYear = new Date().getFullYear()
  const availableYears = useMemo(() => getAvailableYears(trips), [trips])
  const [selectedYear, setSelectedYear] = useState(() => availableYears[0] ?? currentYear)
  const [compIdx, setCompIdx] = useState(0)
  const [percentileData, setPercentileData] = useState(null)
  const [loadingPercentile, setLoadingPercentile] = useState(false)
  const [published, setPublished] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [showAllComparisons, setShowAllComparisons] = useState(false)
  const [showTopCities, setShowTopCities] = useState(false)

  const distResult = useMemo(() => yearDistanceKm(trips, selectedYear), [trips, selectedYear])
  const geo = useMemo(() => yearGeographicStats(trips, selectedYear), [trips, selectedYear])
  const nights = useMemo(() => yearNightsAway(trips, selectedYear), [trips, selectedYear])
  const comparisons = useMemo(() => getFunComparisons(distResult.km), [distResult.km])
  const badges = useMemo(() => getAchievementBadges({
    km: distResult.km,
    nightsAway: nights.total,
    countryCodes: geo.countryCodes,
    continents: geo.continents,
    destinationCount: geo.destinationCount,
  }), [distResult.km, nights.total, geo])
  const personality = useMemo(() => getTravelPersonality(geo, distResult), [geo, distResult])

  const sparkYears = useMemo(() => {
    const last4 = [...new Set([...availableYears, currentYear])].sort((a, b) => a - b).slice(-4)
    return multiYearKm(trips, last4)
  }, [trips, availableYears, currentYear])

  const cities = useMemo(() => topCities(trips, 3), [trips])
  const countries = useMemo(() => topCountries(trips, 3), [trips])

  const featuredComparison = comparisons[compIdx] ?? null

  useEffect(() => {
    if (!user || !supabase || distResult.km === 0) return
    setLoadingPercentile(true)
    getPercentile(distResult.km, selectedYear)
      .then(setPercentileData)
      .catch(() => setPercentileData(null))
      .finally(() => setLoadingPercentile(false))
  }, [user, distResult.km, selectedYear])

  async function handlePublish() {
    if (!user || publishing) return
    setPublishing(true)
    try {
      await publishStats(user.id, selectedYear, {
        km: distResult.km,
        nightsAway: nights.total,
        countryCodes: geo.countryCodes,
        continents: geo.continents,
        destinationCount: geo.destinationCount,
      })
      setPublished(true)
      const updated = await getPercentile(distResult.km, selectedYear)
      setPercentileData(updated)
    } catch {
      // silent — community publish is optional
    } finally {
      setPublishing(false)
    }
  }

  const kmFormatted = Math.round(distResult.km).toLocaleString('en-US')
  const prevYear = sparkYears.find((d) => d.year === selectedYear - 1)
  const yoy = prevYear && prevYear.km > 0
    ? Math.round(((distResult.km - prevYear.km) / prevYear.km) * 100)
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40" onClick={onClose} />
      <div className="relative h-full w-full max-w-md bg-white dark:bg-gray-950 shadow-2xl overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-950 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Travel Stats</h2>
            <div className="flex gap-1">
              {availableYears.slice(0, 5).map((y) => (
                <button
                  key={y}
                  onClick={() => { setSelectedYear(y); setCompIdx(0); setPercentileData(null); setPublished(false) }}
                  className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${
                    y === selectedYear
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 px-5 py-5 space-y-6">

          {/* Personality badge */}
          {personality && (
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-800">
              <span className="text-xl">{personality.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{personality.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{personality.description}</p>
              </div>
            </div>
          )}

          {/* Big stat cards */}
          {geo.destinationCount === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No trips in {selectedYear} yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  value={`${kmFormatted} km`}
                  label="traveled"
                  sub={yoy != null ? `${yoy >= 0 ? '+' : ''}${yoy}% vs ${selectedYear - 1}` : null}
                />
                <StatCard
                  value={nights.total}
                  label="nights away"
                  sub={nights.vacation > 0 && nights.business > 0
                    ? `${nights.vacation} vacation · ${nights.business} business`
                    : null}
                />
                <StatCard
                  value={geo.countryCodes.length}
                  label={`countr${geo.countryCodes.length !== 1 ? 'ies' : 'y'}`}
                  sub={geo.continents.length > 0 ? `${geo.continents.length} continent${geo.continents.length !== 1 ? 's' : ''}` : null}
                />
              </div>

              {/* Secondary stats */}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {geo.tripCount} trip{geo.tripCount !== 1 ? 's' : ''} · {geo.destinationCount} destination{geo.destinationCount !== 1 ? 's' : ''}
                {distResult.approximateCount > 0 && (
                  <span className="ml-2 text-amber-500">· {distResult.approximateCount} leg{distResult.approximateCount !== 1 ? 's' : ''} approximate</span>
                )}
              </p>

              {/* Sparkline */}
              {sparkYears.length > 1 && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Year-over-year distance</p>
                  <SparklineChart data={sparkYears} dark={dark} />
                  <div className="flex justify-between mt-1">
                    {sparkYears.map((d) => (
                      <span key={d.year} className={`text-xs ${d.year === selectedYear ? 'text-blue-500 font-medium' : 'text-gray-400 dark:text-gray-600'}`}>
                        {d.year}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Fun comparison */}
              {featuredComparison && (
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider font-medium">Distance comparison</p>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{featuredComparison.emoji}</span>
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed flex-1">{featuredComparison.text}</p>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-400 dark:bg-blue-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, featuredComparison.ratio >= 1 ? 100 : featuredComparison.ratio * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <button
                      onClick={() => setCompIdx((i) => (i - 1 + comparisons.length) % comparisons.length)}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      ◄
                    </button>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{compIdx + 1} / {comparisons.length}</span>
                    <button
                      onClick={() => setCompIdx((i) => (i + 1) % comparisons.length)}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      ►
                    </button>
                  </div>
                </div>
              )}

              {/* Achievement badges */}
              {badges.some((b) => b.earned) && (
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">Achievements</p>
                  <div className="grid grid-cols-3 gap-2">
                    {badges.map((badge) => {
                      const tier = TIER_COLORS[badge.tier]
                      return (
                        <div
                          key={badge.id}
                          title={badge.description}
                          className={`rounded-xl p-3 flex flex-col items-center gap-1.5 border transition-opacity ${
                            badge.earned ? 'opacity-100' : 'opacity-25'
                          }`}
                          style={badge.earned
                            ? { background: tier.bg, borderColor: tier.ring, color: tier.text }
                            : { background: '#f9fafb', borderColor: '#e5e7eb' }
                          }
                        >
                          <span className="text-xl">{badge.emoji}</span>
                          <span className="text-xs font-medium text-center leading-tight">{badge.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Community percentile */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 p-4">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">Community</p>
                {!user ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to compare yourself with the Wayfar community.</p>
                ) : !supabase ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Community stats require a Supabase connection.</p>
                ) : loadingPercentile ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>
                ) : percentileData ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      You're in the top{' '}
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        {100 - percentileData.percentile}%
                      </span>{' '}
                      of Wayfar travelers for {selectedYear}
                    </p>
                    <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-400 dark:bg-blue-500"
                        style={{ width: `${percentileData.percentile}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                      <span>{Math.round(distResult.km).toLocaleString('en-US')} km you</span>
                      <span>avg {percentileData.avgKm.toLocaleString('en-US')} km</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Based on {percentileData.sampleSize.toLocaleString('en-US')} travelers</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Share your anonymised stats to see how you rank against the community.</p>
                    <button
                      onClick={handlePublish}
                      disabled={publishing || published}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                    >
                      {publishing ? 'Publishing…' : published ? 'Stats shared ✓' : 'Publish my stats'}
                    </button>
                    <p className="text-xs text-gray-400 dark:text-gray-500">No personal data is shared — only your total km, nights, and country count.</p>
                  </div>
                )}
              </div>

              {/* Countries visited */}
              {geo.countryCodes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Countries in {selectedYear}</p>
                  <div className="flex flex-wrap gap-2">
                    {geo.countryCodes.map((cc, i) => (
                      <div key={cc} className="flex items-center gap-1.5">
                        <Flag code={cc} country={geo.countries[i]} />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{geo.countries[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top cities / countries (all-time) */}
              {cities.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowTopCities((v) => !v)}
                    className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    All-time favourites <span>{showTopCities ? '▲' : '▼'}</span>
                  </button>
                  {showTopCities && (
                    <div className="space-y-1">
                      {cities.map((c) => (
                        <div key={`${c.city}|${c.countryCode}`} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <Flag code={c.countryCode} country={c.country} />
                          <span className="font-medium">{c.city}</span>
                          <span className="text-gray-400 dark:text-gray-500">·</span>
                          <span>{c.visits} trip{c.visits !== 1 ? 's' : ''}</span>
                          <span className="text-gray-400 dark:text-gray-500">·</span>
                          <span>{c.nights} night{c.nights !== 1 ? 's' : ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
