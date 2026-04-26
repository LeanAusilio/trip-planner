import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTrips } from '../src/hooks/useTrips'
import type { Hotel } from '../src/types/trip'

export default function HotelModalScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams()
  const editing: Hotel | null = params.editing ? JSON.parse(params.editing as string) : null

  const { addHotel, updateHotel } = useTrips()

  const [name, setName] = useState(editing?.name || '')
  const [checkIn, setCheckIn] = useState(editing?.checkIn?.slice(0, 10) || '')
  const [checkOut, setCheckOut] = useState(editing?.checkOut?.slice(0, 10) || '')
  const [address, setAddress] = useState(editing?.address || '')
  const [confirmationNumber, setConfirmationNumber] = useState(editing?.confirmationNumber || '')
  const [error, setError] = useState('')

  const handleSave = () => {
    if (!name.trim()) { setError('Please enter a hotel name'); return }
    if (!checkIn) { setError('Please enter check-in date (YYYY-MM-DD)'); return }
    if (!checkOut) { setError('Please enter check-out date (YYYY-MM-DD)'); return }
    if (checkIn >= checkOut) { setError('Check-out must be after check-in'); return }

    const hotelData = {
      name: name.trim(),
      checkIn,
      checkOut,
      ...(address.trim() && { address: address.trim() }),
      ...(confirmationNumber.trim() && { confirmationNumber: confirmationNumber.trim() }),
    }

    if (editing) {
      updateHotel(editing.id, hotelData)
    } else {
      addHotel(hotelData)
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
          {editing ? 'Edit Hotel' : 'Add Hotel'}
        </Text>
        <Pressable onPress={handleSave} className="w-11 h-11 items-center justify-center -mr-2">
          <Text className="text-sky-500 text-base font-semibold">Save</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
        {/* Name */}
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Hotel name
        </Text>
        <TextInput
          value={name}
          onChangeText={(t) => { setName(t); setError('') }}
          placeholder="e.g. Le Marais Hotel"
          placeholderTextColor="#9ca3af"
          className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white"
        />

        {/* Check-in */}
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-5 mb-2">
          Check-in date
        </Text>
        <TextInput
          value={checkIn}
          onChangeText={(t) => { setCheckIn(t); setError('') }}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9ca3af"
          className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />

        {/* Check-out */}
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-5 mb-2">
          Check-out date
        </Text>
        <TextInput
          value={checkOut}
          onChangeText={(t) => { setCheckOut(t); setError('') }}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9ca3af"
          className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />

        {/* Address */}
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-5 mb-2">
          Address (optional)
        </Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="e.g. 5 Rue de la Paix, Paris"
          placeholderTextColor="#9ca3af"
          className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white"
        />

        {/* Confirmation number */}
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-5 mb-2">
          Confirmation number (optional)
        </Text>
        <TextInput
          value={confirmationNumber}
          onChangeText={setConfirmationNumber}
          placeholder="e.g. BK12345678"
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
            {editing ? 'Save changes' : 'Add hotel'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
