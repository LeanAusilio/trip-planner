import { useState } from 'react'
import { View, Text, ScrollView, Pressable, useColorScheme, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTrips } from '../../src/hooks/useTrips'
import ItineraryList from '../../src/components/ItineraryList'
import DetailCard from '../../src/components/DetailCard'
import type { Destination, Hotel, Activity, Transport } from '../../src/types/trip'

type SelectedItem =
  | { kind: 'destination'; data: Destination; activities: Activity[]; hotels: Hotel[] }
  | { kind: 'hotel'; data: Hotel }
  | { kind: 'activity'; data: Activity }
  | { kind: 'transport'; data: Transport }
  | null

export default function TripScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()

  const {
    trips, activeTripId, setActiveTripId, activeTrip, loaded,
    loadDemoData,
  } = useTrips()

  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null)

  const destinations = activeTrip?.destinations || []
  const hotels = activeTrip?.hotels || []
  const activities = activeTrip?.activities || []
  const transports = activeTrip?.transports || []

  if (!loaded) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950" style={{ paddingTop: insets.top }}>

      {/* ── Header ── */}
      <View className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-4 pt-2 pb-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sky-500 font-bold text-xl">Wayfar</Text>
          <Text
            className="text-gray-900 dark:text-white font-semibold text-sm flex-1 text-center mx-4"
            numberOfLines={1}
          >
            {activeTrip?.name || 'My Trip'}
          </Text>
          <Pressable
            onPress={() => router.push('/destination-modal')}
            className="w-9 h-9 bg-sky-500 rounded-full items-center justify-center"
          >
            <Text className="text-white text-2xl font-light" style={{ lineHeight: 28 }}>+</Text>
          </Pressable>
        </View>

        {trips.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-2"
            contentContainerStyle={{ gap: 8 }}
          >
            {trips.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setActiveTripId(t.id)}
                className={`px-3 py-1 rounded-full border ${
                  t.id === activeTripId
                    ? 'bg-sky-500 border-sky-500'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <Text className={`text-xs font-medium ${t.id === activeTripId ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                  {t.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {/* ── Content ── */}
      {destinations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ fontSize: 48 }} className="mb-4">✈️</Text>
          <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No trips yet</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
            Add your first destination to start planning
          </Text>
          <Pressable
            onPress={() => router.push('/destination-modal')}
            className="bg-sky-500 px-8 py-3.5 rounded-full mb-3"
          >
            <Text className="text-white font-semibold text-base">Add destination</Text>
          </Pressable>
          <Pressable onPress={loadDemoData}>
            <Text className="text-sky-500 text-sm">Load demo trip</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }}
        >
          <ItineraryList
            destinations={destinations}
            activities={activities}
            hotels={hotels}
            transports={transports}
            onClickDest={(dest) =>
              setSelectedItem({
                kind: 'destination',
                data: dest,
                activities: activities.filter((a) => a.destinationId === dest.id),
                hotels: hotels.filter(
                  (h) =>
                    new Date(h.checkIn) >= new Date(dest.arrival) &&
                    new Date(h.checkOut) <= new Date(dest.departure)
                ),
              })
            }
            onClickHotel={(hotel) => setSelectedItem({ kind: 'hotel', data: hotel })}
            onClickActivity={(act) => setSelectedItem({ kind: 'activity', data: act })}
            onClickTransport={(t) => setSelectedItem({ kind: 'transport', data: t })}
          />
        </ScrollView>
      )}

      <DetailCard
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onEdit={() => {
          setSelectedItem(null)
          if (selectedItem?.kind === 'destination') {
            router.push({ pathname: '/destination-modal', params: { editing: JSON.stringify(selectedItem.data) } })
          }
        }}
      />
    </View>
  )
}
