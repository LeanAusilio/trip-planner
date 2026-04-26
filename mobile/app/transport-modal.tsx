import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTrips } from '../src/hooks/useTrips'
import DatePickerField from '../src/components/DatePickerField'
import type { Transport } from '../src/types/trip'

type TransportType = 'flight' | 'train' | 'bus' | 'car' | 'ferry' | 'other'

const TYPES: { value: TransportType; label: string; emoji: string }[] = [
  { value: 'flight', label: 'Flight', emoji: '✈️' },
  { value: 'train', label: 'Train', emoji: '🚄' },
  { value: 'bus', label: 'Bus', emoji: '🚌' },
  { value: 'car', label: 'Car', emoji: '🚗' },
  { value: 'ferry', label: 'Ferry', emoji: '⛴️' },
  { value: 'other', label: 'Other', emoji: '🧳' },
]

export default function TransportModalScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams()
  const editing: Transport | null = params.editing ? JSON.parse(params.editing as string) : null

  const { addTransport, updateTransport } = useTrips()

  const [transType, setTransType] = useState<TransportType>(editing?.type || 'flight')
  const [fromCity, setFromCity] = useState(editing?.fromCity || '')
  const [toCity, setToCity] = useState(editing?.toCity || '')
  const [departureDate, setDepartureDate] = useState(editing?.departureDate?.slice(0, 10) || '')
  const [arrivalDate, setArrivalDate] = useState(editing?.arrivalDate?.slice(0, 10) || '')
  const [carrier, setCarrier] = useState(editing?.carrier || '')
  const [flightNumber, setFlightNumber] = useState(editing?.flightNumber || '')
  const [error, setError] = useState('')

  const handleSave = () => {
    if (!fromCity.trim()) { setError('Please enter departure city'); return }
    if (!toCity.trim()) { setError('Please enter arrival city'); return }
    if (!departureDate) { setError('Please enter departure date (YYYY-MM-DD)'); return }
    if (!arrivalDate) { setError('Please enter arrival date (YYYY-MM-DD)'); return }
    if (departureDate > arrivalDate) { setError('Arrival must be on or after departure'); return }

    const transportData: Omit<Transport, 'id'> = {
      type: transType,
      fromCity: fromCity.trim(),
      toCity: toCity.trim(),
      departureDate,
      arrivalDate,
      ...(carrier.trim() && { carrier: carrier.trim() }),
      ...(flightNumber.trim() && { flightNumber: flightNumber.trim() }),
    }

    if (editing) {
      updateTransport(editing.id, transportData)
    } else {
      addTransport(transportData)
    }
    router.back()
  }

  const carrierLabel =
    transType === 'flight' ? 'Airline' :
    transType === 'train' ? 'Train operator' :
    transType === 'bus' ? 'Bus company' :
    transType === 'ferry' ? 'Ferry operator' : 'Carrier'

  const refLabel =
    transType === 'flight' ? 'Flight number' : 'Booking reference'

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
          {editing ? 'Edit Transport' : 'Add Transport'}
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
              onPress={() => setTransType(t.value)}
              className={`px-4 py-2.5 rounded-xl border ${
                transType === t.value
                  ? 'bg-sky-500 border-sky-500'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <Text className={`text-sm font-medium ${transType === t.value ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                {t.emoji} {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* From / To */}
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-5 mb-2">
          From
        </Text>
        <TextInput
          value={fromCity}
          onChangeText={(t) => { setFromCity(t); setError('') }}
          placeholder="e.g. Paris"
          placeholderTextColor="#9ca3af"
          className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white"
        />

        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-5 mb-2">
          To
        </Text>
        <TextInput
          value={toCity}
          onChangeText={(t) => { setToCity(t); setError('') }}
          placeholder="e.g. Rome"
          placeholderTextColor="#9ca3af"
          className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white"
        />

        {/* Dates */}
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-5 mb-2">
          Departure date
        </Text>
        <DatePickerField
          value={departureDate}
          onChange={(d) => { setDepartureDate(d); setError('') }}
          placeholder="Select departure date"
          maxDate={arrivalDate || undefined}
        />

        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-5 mb-2">
          Arrival date
        </Text>
        <DatePickerField
          value={arrivalDate}
          onChange={(d) => { setArrivalDate(d); setError('') }}
          placeholder="Select arrival date"
          minDate={departureDate || undefined}
        />

        {/* Carrier */}
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-5 mb-2">
          {carrierLabel} (optional)
        </Text>
        <TextInput
          value={carrier}
          onChangeText={setCarrier}
          placeholder={transType === 'flight' ? 'e.g. Air France' : 'e.g. Trenitalia'}
          placeholderTextColor="#9ca3af"
          className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white"
        />

        {/* Flight/booking number */}
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-5 mb-2">
          {refLabel} (optional)
        </Text>
        <TextInput
          value={flightNumber}
          onChangeText={setFlightNumber}
          placeholder={transType === 'flight' ? 'e.g. AF1234' : 'e.g. 8XKP3Y'}
          placeholderTextColor="#9ca3af"
          className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white"
          autoCapitalize="characters"
        />

        {error ? <Text className="text-red-500 text-sm mt-4">{error}</Text> : null}

        <Pressable
          onPress={handleSave}
          className="bg-sky-500 rounded-2xl py-4 items-center mt-6 mb-4"
        >
          <Text className="text-white font-semibold text-base">
            {editing ? 'Save changes' : 'Add transport'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
