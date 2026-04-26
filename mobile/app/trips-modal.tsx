import { useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTrips } from '../src/hooks/useTrips'

export default function TripsModalScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { trips, activeTripId, setActiveTripId, addTrip, deleteTrip, renameTrip } = useTrips()

  const [newTripName, setNewTripName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const handleAdd = () => {
    const name = newTripName.trim()
    if (!name) return
    addTrip(name)
    setNewTripName('')
    router.back()
  }

  const handleStartRename = (id: string, current: string) => {
    setRenamingId(id)
    setRenameValue(current)
  }

  const handleRename = (id: string) => {
    const name = renameValue.trim()
    if (name) renameTrip(id, name)
    setRenamingId(null)
  }

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete trip', `Remove "${name}" and all its data?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTrip(id)
          if (activeTripId === id) router.back()
        },
      },
    ])
  }

  return (
    <View className="flex-1 bg-white dark:bg-gray-950" style={{ paddingBottom: insets.bottom }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800">
        <Pressable onPress={() => router.back()} className="w-11 h-11 items-center justify-center -ml-2">
          <Text className="text-sky-500 text-base font-medium">Done</Text>
        </Pressable>
        <Text className="text-base font-semibold text-gray-900 dark:text-white">My Trips</Text>
        <View className="w-11" />
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* New trip */}
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          New trip
        </Text>
        <View className="flex-row gap-2 mb-6">
          <TextInput
            value={newTripName}
            onChangeText={setNewTripName}
            onSubmitEditing={handleAdd}
            placeholder="e.g. Japan Spring 2027"
            placeholderTextColor="#9ca3af"
            returnKeyType="done"
            className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white"
          />
          <Pressable
            onPress={handleAdd}
            className="bg-sky-500 rounded-xl px-4 items-center justify-center"
          >
            <Text className="text-white font-semibold text-sm">Add</Text>
          </Pressable>
        </View>

        {/* Existing trips */}
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Existing trips
        </Text>
        {trips.map((trip) => (
          <View
            key={trip.id}
            className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl mb-2 overflow-hidden"
          >
            {renamingId === trip.id ? (
              <View className="flex-row items-center px-3 py-2 gap-2">
                <TextInput
                  value={renameValue}
                  onChangeText={setRenameValue}
                  onSubmitEditing={() => handleRename(trip.id)}
                  autoFocus
                  returnKeyType="done"
                  className="flex-1 text-sm text-gray-900 dark:text-white"
                />
                <Pressable onPress={() => handleRename(trip.id)} className="px-3 py-2">
                  <Text className="text-sky-500 text-sm font-semibold">Save</Text>
                </Pressable>
                <Pressable onPress={() => setRenamingId(null)} className="px-2 py-2">
                  <Text className="text-gray-400 text-sm">Cancel</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => { setActiveTripId(trip.id); router.back() }}
                className="flex-row items-center px-4 py-3.5"
              >
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-900 dark:text-white">{trip.name}</Text>
                  <Text className="text-xs text-gray-400 mt-0.5">
                    {trip.destinations.length} destination{trip.destinations.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                {activeTripId === trip.id && (
                  <View className="w-2 h-2 rounded-full bg-sky-500 mr-3" />
                )}
                <Pressable
                  onPress={() => handleStartRename(trip.id, trip.name)}
                  className="w-9 h-9 items-center justify-center"
                  hitSlop={8}
                >
                  <Text className="text-gray-400 text-base">✏️</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(trip.id, trip.name)}
                  className="w-9 h-9 items-center justify-center"
                  hitSlop={8}
                >
                  <Text className="text-gray-400 text-base">🗑️</Text>
                </Pressable>
              </Pressable>
            )}
          </View>
        ))}

        {trips.length === 0 && (
          <Text className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
            No trips yet — add one above
          </Text>
        )}
      </ScrollView>
    </View>
  )
}
