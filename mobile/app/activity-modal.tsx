import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTrips } from '../src/hooks/useTrips'
import type { Activity } from '../src/types/trip'

type ActivityType = 'restaurant' | 'attraction' | 'shopping' | 'medical'

const TYPES: { value: ActivityType; label: string; emoji: string }[] = [
  { value: 'restaurant', label: 'Restaurant', emoji: '🍴' },
  { value: 'attraction', label: 'Attraction', emoji: '🏛' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍' },
  { value: 'medical', label: 'Medical', emoji: '🏥' },
]

export default function ActivityModalScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams()
  const editing: Activity | null = params.editing ? JSON.parse(params.editing as string) : null
  const presetDestId = params.destinationId as string | undefined

  const { activeTrip, addActivity, updateActivity } = useTrips()
  const destinations = activeTrip?.destinations || []

  const [actType, setActType] = useState<ActivityType>(editing?.type || 'attraction')
  const [name, setName] = useState(editing?.name || '')
  const [date, setDate] = useState(editing?.date?.slice(0, 10) || '')
  const [destinationId, setDestinationId] = useState(
    editing?.destinationId || presetDestId || destinations[0]?.id || ''
  )
  const [address, setAddress] = useState(editing?.address || '')
  const [notes, setNotes] = useState(editing?.notes || '')
  const [phone, setPhone] = useState(editing?.phone || '')
  const [website, setWebsite] = useState(editing?.website || '')
  const [error, setError] = useState('')

  const handleSave = () => {
    if (!name.trim()) { setError('Please enter a name'); return }
    if (!date) { setError('Please enter a date (YYYY-MM-DD)'); return }
    if (!destinationId) { setError('Please select a destination'); return }

    const actData: Omit<Activity, 'id'> = {
      type: actType,
      name: name.trim(),
      date,
      destinationId,
      ...(address.trim() && { address: address.trim() }),
      ...(notes.trim() && { notes: notes.trim() }),
      ...(phone.trim() && { phone: phone.trim() }),
      ...(website.trim() && { website: website.trim() }),
    }

    if (editing) {
      updateActivity(editing.id, actData)
    } else {
      addActivity(actData)
    }
    router.back()
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white dark:bg-gray-950"
      style={{ paddingBottom: insets.bottom }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800">
        <Pressable onPress={() => router.back()} className="w-11 h-11 items-center justify-center -ml-2">
          <Text className="text-sky-500 text-base font-medium">Cancel</Text>
        </Pressable>
        <Text className="text-base font-semibold text-gray-900 dark:text-white">
          {editing ? 'Edit Activity' : 'Add Activity'}
        </Text>
        <Pressable onPress={handleSave} className="w-11 h-11 items-center justify-center -mr-2">
          <Text className="text-sky-500 text-base font-semibold">Save</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
        {/* Type */}
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Type
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-1">
          {TYPES.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => setActType(t.value)}
              className={`px-4 py-2.5 rounded-xl border ${
                actType === t.value
                  ? 'bg-sky-500 border-sky-500'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <Text className={`text-sm font-medium ${actType === t.value ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                {t.emoji} {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Name */}
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-5 mb-2">
          Name
        </Text>
        <TextInput
          value={name}
          onChangeText={(t) => { setName(t); setError('') }}
          placeholder={actType === 'restaurant' ? 'e.g. Jules Verne' : actType === 'attraction' ? 'e.g. Eiffel Tower' : actType === 'shopping' ? 'e.g. Le Bon Marché' : 'e.g. Dr. Smith appointment'}
          placeholderTextColor="#9ca3af"
          className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white"
        />

        {/* Date */}
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-5 mb-2">
          Date
        </Text>
        <TextInput
          value={date}
          onChangeText={(t) => { setDate(t); setError('') }}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9ca3af"
          className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />

        {/* Destination */}
        {destinations.length > 1 && (
          <>
            <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-5 mb-2">
              Destination
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {destinations.map((d) => (
                <Pressable
                  key={d.id}
                  onPress={() => setDestinationId(d.id)}
                  className={`px-3 py-2 rounded-xl border ${
                    destinationId === d.id
                      ? 'bg-sky-500 border-sky-500'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Text className={`text-sm font-medium ${destinationId === d.id ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                    {d.city}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* Address */}
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-5 mb-2">
          Address (optional)
        </Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="e.g. 5 Avenue Anatole France"
          placeholderTextColor="#9ca3af"
          className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white"
        />

        {/* Type-specific fields */}
        {(actType === 'restaurant' || actType === 'medical') && (
          <>
            <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-5 mb-2">
              Phone (optional)
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. +33 1 45 55 61 44"
              placeholderTextColor="#9ca3af"
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white"
              keyboardType="phone-pad"
            />
          </>
        )}

        {(actType === 'attraction' || actType === 'shopping') && (
          <>
            <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-5 mb-2">
              Website (optional)
            </Text>
            <TextInput
              value={website}
              onChangeText={setWebsite}
              placeholder="e.g. https://www.toureiffel.paris"
              placeholderTextColor="#9ca3af"
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white"
              keyboardType="url"
              autoCapitalize="none"
            />
          </>
        )}

        {/* Notes */}
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-5 mb-2">
          Notes (optional)
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Any notes…"
          placeholderTextColor="#9ca3af"
          className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {error ? <Text className="text-red-500 text-sm mt-4">{error}</Text> : null}

        <Pressable
          onPress={handleSave}
          className="bg-sky-500 rounded-2xl py-4 items-center mt-6 mb-4"
        >
          <Text className="text-white font-semibold text-base">
            {editing ? 'Save changes' : 'Add activity'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
