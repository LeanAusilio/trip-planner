import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTrips } from '../src/hooks/useTrips'
import CitySearch from '../src/components/CitySearch'
import DatePickerField from '../src/components/DatePickerField'
import type { Destination } from '../src/types/trip'

export default function DestinationModalScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams()
  const editing: Destination | null = params.editing ? JSON.parse(params.editing as string) : null

  const { activeTrip, addDestination, updateDestination } = useTrips()

  // Smart default: pre-fill arrival from last destination's departure
  const lastDeparture = !editing && activeTrip?.destinations?.length
    ? [...activeTrip.destinations].sort((a, b) => a.departure < b.departure ? 1 : -1)[0].departure.slice(0, 10)
    : ''

  const [city, setCity] = useState<any>(editing ? {
    city: editing.city, country: editing.country,
    countryCode: editing.countryCode, lat: editing.lat, lng: editing.lng
  } : null)
  const [arrival, setArrival] = useState(editing?.arrival?.slice(0, 10) || lastDeparture)
  const [departure, setDeparture] = useState(editing?.departure?.slice(0, 10) || '')
  const [type, setType] = useState<'vacation' | 'business'>(editing?.type || 'vacation')
  const [error, setError] = useState('')

  const handleSave = () => {
    if (!city) { setError('Please select a city'); return }
    if (!arrival) { setError('Please select an arrival date'); return }
    if (!departure) { setError('Please select a departure date'); return }
    if (arrival >= departure) { setError('Departure must be after arrival'); return }

    const destData = {
      city: city.city,
      country: city.country,
      countryCode: city.countryCode,
      lat: city.lat ?? null,
      lng: city.lng ?? null,
      arrival,
      departure,
      type,
    }

    if (editing) {
      updateDestination(editing.id, destData)
    } else {
      addDestination(destData)
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
          {editing ? 'Edit Destination' : 'Add Destination'}
        </Text>
        <Pressable onPress={handleSave} className="w-11 h-11 items-center justify-center -mr-2">
          <Text className="text-sky-500 text-base font-semibold">Save</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
        {/* City search */}
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          City
        </Text>
        <CitySearch
          value={city}
          onChange={(c) => { setCity(c); setError('') }}
          placeholder="Search city…"
        />

        {/* Arrival */}
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-5 mb-2">
          Arrival date
        </Text>
        <DatePickerField
          value={arrival}
          onChange={(d) => { setArrival(d); setError('') }}
          placeholder="Select arrival date"
          maxDate={departure || undefined}
        />

        {/* Departure */}
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-5 mb-2">
          Departure date
        </Text>
        <DatePickerField
          value={departure}
          onChange={(d) => { setDeparture(d); setError('') }}
          placeholder="Select departure date"
          minDate={arrival || undefined}
        />

        {/* Type toggle */}
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-5 mb-2">
          Trip type
        </Text>
        <View className="flex-row gap-3">
          {(['vacation', 'business'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              className={`flex-1 py-3 rounded-xl items-center border ${
                type === t
                  ? t === 'vacation'
                    ? 'bg-sky-500 border-sky-500'
                    : 'bg-violet-500 border-violet-500'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <Text className={`text-sm font-medium capitalize ${type === t ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                {t === 'vacation' ? '🏖 Vacation' : '💼 Business'}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text className="text-red-500 text-sm mt-4">{error}</Text> : null}

        <Pressable
          onPress={handleSave}
          className="bg-sky-500 rounded-2xl py-4 items-center mt-6 mb-4"
        >
          <Text className="text-white font-semibold text-base">
            {editing ? 'Save changes' : 'Add destination'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
