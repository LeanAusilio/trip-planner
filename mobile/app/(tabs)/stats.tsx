import { View, Text, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTrips } from '../../src/hooks/useTrips'
import { differenceInDays } from 'date-fns'

export default function StatsScreen() {
  const insets = useSafeAreaInsets()
  const { activeTrip, trips } = useTrips()
  const dests = activeTrip?.destinations || []

  const totalNights = dests.reduce(
    (s, d) => s + differenceInDays(new Date(d.departure), new Date(d.arrival)),
    0
  )
  const countries = [...new Set(dests.map((d) => d.country))]
  const totalTrips = trips.length
  const activities = activeTrip?.activities || []

  const statCards = [
    { label: 'Destinations', value: dests.length, emoji: '📍' },
    { label: 'Nights away', value: totalNights, emoji: '🌙' },
    { label: 'Countries', value: countries.length, emoji: '🌍' },
    { label: 'Activities', value: activities.length, emoji: '🎭' },
  ]

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-950"
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
    >
      {dests.length === 0 ? (
        <View className="flex-1 items-center justify-center py-24">
          <Text className="text-4xl mb-3">📊</Text>
          <Text className="text-base text-gray-500 text-center">
            Add destinations to see your travel stats
          </Text>
        </View>
      ) : (
        <>
          {/* Stat grid */}
          <View className="flex-row flex-wrap gap-3 mb-6">
            {statCards.map(({ label, value, emoji }) => (
              <View
                key={label}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 items-center"
                style={{ width: '47%' }}
              >
                <Text className="text-2xl mb-1">{emoji}</Text>
                <Text className="text-3xl font-bold text-sky-500">{value}</Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</Text>
              </View>
            ))}
          </View>

          {/* Countries visited */}
          {countries.length > 0 && (
            <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
              <Text className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Countries visited
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {countries.map((country) => {
                  const dest = dests.find((d) => d.country === country)
                  const code = dest?.countryCode?.toLowerCase()
                  return (
                    <View
                      key={country}
                      className="flex-row items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full"
                    >
                      <Text className="text-sm">{getFlagEmoji(dest?.countryCode || '')}</Text>
                      <Text className="text-xs text-gray-700 dark:text-gray-300">{country}</Text>
                    </View>
                  )
                })}
              </View>
            </View>
          )}

          {/* Trip breakdown */}
          {dests.length > 0 && (
            <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
              <Text className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Destinations
              </Text>
              {dests.map((dest) => {
                const nights = differenceInDays(new Date(dest.departure), new Date(dest.arrival))
                return (
                  <View
                    key={dest.id}
                    className="flex-row items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60 last:border-b-0"
                  >
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base">{getFlagEmoji(dest.countryCode)}</Text>
                      <Text className="text-sm text-gray-900 dark:text-white">{dest.city}</Text>
                    </View>
                    <Text className="text-xs text-gray-500">{nights}n</Text>
                  </View>
                )
              })}
            </View>
          )}
        </>
      )}
    </ScrollView>
  )
}

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '📍'
  return [...countryCode.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('')
}
