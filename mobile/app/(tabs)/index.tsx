import { useState } from 'react'
import { View, Text, ScrollView, Pressable, useColorScheme, ActivityIndicator, Modal, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTrips } from '../../src/hooks/useTrips'
import ItineraryList from '../../src/components/ItineraryList'
import DetailCard from '../../src/components/DetailCard'
import { shareToWhatsApp, exportTripAsICS, printTrip } from '../../src/utils/share'
import type { Destination, Hotel, Activity, Transport } from '../../src/types/trip'

type SelectedItem =
  | { kind: 'destination'; data: Destination; activities: Activity[]; hotels: Hotel[] }
  | { kind: 'hotel'; data: Hotel }
  | { kind: 'activity'; data: Activity }
  | { kind: 'transport'; data: Transport }
  | null

const ADD_OPTIONS = [
  { label: '📍 Destination', route: '/destination-modal' as const },
  { label: '🏨 Hotel', route: '/hotel-modal' as const },
  { label: '🎯 Activity', route: '/activity-modal' as const },
  { label: '✈️ Transport', route: '/transport-modal' as const },
] as const

export default function TripScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const {
    trips, activeTripId, setActiveTripId, activeTrip, loaded,
    loadDemoData,
    deleteDestination, deleteHotel, deleteActivity, deleteTransport,
  } = useTrips()

  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

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

  const handleEdit = () => {
    const item = selectedItem
    setSelectedItem(null)
    if (!item) return
    if (item.kind === 'destination') {
      router.push({ pathname: '/destination-modal', params: { editing: JSON.stringify(item.data) } })
    } else if (item.kind === 'hotel') {
      router.push({ pathname: '/hotel-modal', params: { editing: JSON.stringify(item.data) } })
    } else if (item.kind === 'activity') {
      router.push({ pathname: '/activity-modal', params: { editing: JSON.stringify(item.data) } })
    } else if (item.kind === 'transport') {
      router.push({ pathname: '/transport-modal', params: { editing: JSON.stringify(item.data) } })
    }
  }

  const handleDelete = () => {
    const item = selectedItem
    if (!item) return
    const label =
      item.kind === 'destination' ? item.data.city :
      item.kind === 'hotel' ? item.data.name :
      item.kind === 'activity' ? item.data.name :
      `${item.data.fromCity} → ${item.data.toCity}`

    Alert.alert(
      'Delete',
      `Remove "${label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setSelectedItem(null)
            if (item.kind === 'destination') deleteDestination(item.data.id)
            else if (item.kind === 'hotel') deleteHotel(item.data.id)
            else if (item.kind === 'activity') deleteActivity(item.data.id)
            else if (item.kind === 'transport') deleteTransport(item.data.id)
          },
        },
      ]
    )
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950" style={{ paddingTop: insets.top }}>

      {/* ── Header ── */}
      <View className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-4 pt-2 pb-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sky-500 font-bold text-xl">Wayfar</Text>
          <Text
            className="text-gray-900 dark:text-white font-semibold text-sm flex-1 text-center mx-2"
            numberOfLines={1}
          >
            {activeTrip?.name || 'My Trip'}
          </Text>
          <View className="flex-row gap-2">
            {activeTrip && activeTrip.destinations.length > 0 && (
              <Pressable
                onPress={() => setShowShareMenu(true)}
                className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center"
              >
                <Text style={{ fontSize: 16 }}>↑</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setShowAddMenu(true)}
              className="w-9 h-9 bg-sky-500 rounded-full items-center justify-center"
            >
              <Text className="text-white text-2xl font-light" style={{ lineHeight: 28 }}>+</Text>
            </Pressable>
          </View>
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

      {/* ── Detail Card ── */}
      <DetailCard
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* ── Add Menu ── */}
      <Modal
        visible={showAddMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddMenu(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setShowAddMenu(false)}
        >
          <Pressable
            className="bg-white dark:bg-gray-900 rounded-t-3xl px-4 pt-4"
            style={{ paddingBottom: insets.bottom + 16 }}
            onPress={() => {}}
          >
            {/* Handle */}
            <View className="items-center mb-4">
              <View className="w-8 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </View>

            <Text className="text-base font-semibold text-gray-900 dark:text-white mb-4 px-2">
              What would you like to add?
            </Text>

            {ADD_OPTIONS.map((opt) => (
              <Pressable
                key={opt.route}
                onPress={() => {
                  setShowAddMenu(false)
                  router.push(opt.route)
                }}
                className="flex-row items-center py-4 px-2 border-b border-gray-50 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800 rounded-xl"
              >
                <Text className="text-base text-gray-900 dark:text-white">{opt.label}</Text>
              </Pressable>
            ))}

            <Pressable
              onPress={() => setShowAddMenu(false)}
              className="mt-3 py-3 items-center"
            >
              <Text className="text-sky-500 font-medium">Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Share Menu ── */}
      <Modal
        visible={showShareMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShareMenu(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setShowShareMenu(false)}
        >
          <Pressable
            className="bg-white dark:bg-gray-900 rounded-t-3xl px-4 pt-4"
            style={{ paddingBottom: insets.bottom + 16 }}
            onPress={() => {}}
          >
            <View className="items-center mb-4">
              <View className="w-8 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </View>
            <Text className="text-base font-semibold text-gray-900 dark:text-white mb-4 px-2">
              Share & Export
            </Text>
            {[
              { label: '💬 Share via WhatsApp', action: () => activeTrip && shareToWhatsApp(activeTrip) },
              { label: '📅 Export to Calendar (.ics)', action: () => activeTrip && exportTripAsICS(activeTrip) },
              { label: '🖨️ Print / Save as PDF', action: () => activeTrip && printTrip(activeTrip) },
            ].map((opt) => (
              <Pressable
                key={opt.label}
                onPress={() => { setShowShareMenu(false); opt.action() }}
                className="flex-row items-center py-4 px-2 border-b border-gray-50 dark:border-gray-800"
              >
                <Text className="text-base text-gray-900 dark:text-white">{opt.label}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setShowShareMenu(false)}
              className="mt-3 py-3 items-center"
            >
              <Text className="text-sky-500 font-medium">Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}
