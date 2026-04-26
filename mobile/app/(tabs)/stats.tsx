import { useState, useMemo } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTrips } from '../../src/hooks/useTrips'
import {
  getAvailableYears,
  yearGeographicStats,
  yearDistanceKm,
  getFunComparisons,
  getAchievementBadges,
  getTravelPersonality,
} from '../../src/utils/travelStats'

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '📍'
  return [...countryCode.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('')
}

const TIER_COLOR: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#a8a9ad',
  gold: '#ffd700',
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets()
  const { trips } = useTrips()

  const availableYears = useMemo(() => getAvailableYears(trips), [trips])
  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] ?? new Date().getFullYear())
  const [compIdx, setCompIdx] = useState(0)

  const geo = useMemo(() => yearGeographicStats(trips, selectedYear), [trips, selectedYear])
  const distResult = useMemo(() => yearDistanceKm(trips, selectedYear), [trips, selectedYear])
  const km = Math.round(distResult.km)

  const comparisons = useMemo(() => getFunComparisons(km), [km])
  const badges = useMemo(
    () =>
      getAchievementBadges({
        km,
        nightsAway: geo.nightsAway,
        destinationCount: geo.destinationCount,
        continents: geo.continents,
        countryCodes: geo.countryCodes,
      }),
    [km, geo]
  )
  const personality = useMemo(() => getTravelPersonality(geo, distResult), [geo, distResult])
  const earnedBadges = badges.filter((b) => b.earned)

  const hasData = geo.destinationCount > 0

  if (trips.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950 px-8">
        <Text style={{ fontSize: 48 }} className="mb-3">📊</Text>
        <Text className="text-base text-gray-500 dark:text-gray-400 text-center">
          Add destinations to see your travel stats
        </Text>
      </View>
    )
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-950"
      contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
    >
      {/* ── Year picker ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, marginBottom: 20 }}
      >
        {availableYears.map((y) => (
          <Pressable
            key={y}
            onPress={() => { setSelectedYear(y); setCompIdx(0) }}
            className={`px-4 py-2 rounded-full border ${
              y === selectedYear
                ? 'bg-sky-500 border-sky-500'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
            }`}
          >
            <Text className={`text-sm font-semibold ${y === selectedYear ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
              {y}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {!hasData ? (
        <View className="items-center py-16">
          <Text className="text-4xl mb-3">✈️</Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 text-center">
            No trips in {selectedYear}
          </Text>
        </View>
      ) : (
        <>
          {/* ── Stat cards ── */}
          <View className="flex-row flex-wrap gap-3 mb-4">
            {[
              { label: 'km traveled', value: km > 0 ? km.toLocaleString() : '—', emoji: '✈️' },
              { label: 'nights away', value: geo.nightsAway, emoji: '🌙' },
              { label: 'countries', value: geo.countryCodes.length, emoji: '🌍' },
              { label: 'destinations', value: geo.destinationCount, emoji: '📍' },
            ].map(({ label, value, emoji }) => (
              <View
                key={label}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 items-center justify-center"
                style={{ width: '47%' }}
              >
                <Text style={{ fontSize: 22 }} className="mb-1">{emoji}</Text>
                <Text className="text-2xl font-bold text-sky-500">{value}</Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">{label}</Text>
              </View>
            ))}
          </View>

          {/* ── Travel personality ── */}
          {personality && (
            <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Your travel personality
              </Text>
              <View className="flex-row items-center gap-3">
                <Text style={{ fontSize: 28 }}>{personality.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text className="text-base font-semibold text-gray-900 dark:text-white">
                    {personality.label}
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {personality.description}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Fun comparison carousel ── */}
          {comparisons.length > 0 && (
            <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Fun comparison
              </Text>
              <View className="items-center py-2">
                <Text style={{ fontSize: 32 }} className="mb-2">{comparisons[compIdx]?.emoji}</Text>
                <Text className="text-sm text-gray-700 dark:text-gray-300 text-center leading-5">
                  {comparisons[compIdx]?.text}
                </Text>
              </View>
              {comparisons.length > 1 && (
                <View className="flex-row justify-between items-center mt-3">
                  <Pressable
                    onPress={() => setCompIdx((i) => (i - 1 + comparisons.length) % comparisons.length)}
                    className="w-11 h-11 items-center justify-center"
                  >
                    <Text className="text-sky-500 text-xl">‹</Text>
                  </Pressable>
                  <View className="flex-row gap-1.5">
                    {comparisons.map((_, i) => (
                      <View
                        key={i}
                        className={`h-1.5 rounded-full ${i === compIdx ? 'bg-sky-500 w-4' : 'bg-gray-200 dark:bg-gray-700 w-1.5'}`}
                      />
                    ))}
                  </View>
                  <Pressable
                    onPress={() => setCompIdx((i) => (i + 1) % comparisons.length)}
                    className="w-11 h-11 items-center justify-center"
                  >
                    <Text className="text-sky-500 text-xl">›</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* ── Achievements ── */}
          {earnedBadges.length > 0 && (
            <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Achievements
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {badges.map((badge) => (
                  <View
                    key={badge.id}
                    className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                      badge.earned
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-40'
                    }`}
                  >
                    <Text style={{ fontSize: 13 }}>{badge.emoji}</Text>
                    <Text
                      className={`text-xs font-medium ${badge.earned ? 'text-amber-700 dark:text-amber-400' : 'text-gray-500'}`}
                    >
                      {badge.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Countries ── */}
          {geo.countryCodes.length > 0 && (
            <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Countries in {selectedYear}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {geo.countryCodes.map((cc, i) => (
                  <View
                    key={cc}
                    className="flex-row items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full"
                  >
                    <Text className="text-sm">{getFlagEmoji(cc)}</Text>
                    <Text className="text-xs text-gray-700 dark:text-gray-300">{geo.countries[i]}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Nights breakdown ── */}
          {(geo.vacationNights > 0 || geo.businessNights > 0) && (
            <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Nights breakdown
              </Text>
              {geo.vacationNights > 0 && (
                <View className="flex-row justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                  <Text className="text-sm text-gray-700 dark:text-gray-300">🏖 Vacation</Text>
                  <Text className="text-sm font-medium text-sky-500">{geo.vacationNights} nights</Text>
                </View>
              )}
              {geo.businessNights > 0 && (
                <View className="flex-row justify-between py-2">
                  <Text className="text-sm text-gray-700 dark:text-gray-300">💼 Business</Text>
                  <Text className="text-sm font-medium text-violet-500">{geo.businessNights} nights</Text>
                </View>
              )}
            </View>
          )}

          {/* ── Distance note ── */}
          {distResult.approximateCount > 0 && km > 0 && (
            <Text className="text-xs text-gray-400 dark:text-gray-600 text-center mb-2">
              * Distance is approximate for {distResult.approximateCount} destination(s) without exact coordinates.
            </Text>
          )}
        </>
      )}
    </ScrollView>
  )
}
