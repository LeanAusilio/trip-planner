import React from 'react'
import { View, Text, Pressable, Image, ScrollView } from 'react-native'
import { format, differenceInDays, startOfDay } from 'date-fns'
import { ACTIVITY_CONFIG, ActivityIcon, BedIcon, TransportIcon, TRANSPORT_CONFIG } from './Icons'
import type { Destination, Activity, Hotel, Transport } from '../types/trip'

// ── Flag ───────────────────────────────────────────────────────────────────

function Flag({ code, country }: { code?: string; country?: string }) {
  if (!code) return null
  return (
    <Image
      source={{ uri: `https://flagcdn.com/40x30/${code.toLowerCase()}.png` }}
      style={{ width: 20, height: 15, borderRadius: 2 }}
      accessibilityLabel={country}
    />
  )
}

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  destinations?: Destination[]
  activities?: Activity[]
  hotels?: Hotel[]
  transports?: Transport[]
  onClickDest?: (dest: Destination) => void
  onClickHotel?: (hotel: Hotel) => void
  onClickActivity?: (activity: Activity) => void
  onClickTransport?: (transport: Transport) => void
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ItineraryList({
  destinations = [],
  activities = [],
  hotels = [],
  transports = [],
  onClickDest,
  onClickHotel,
  onClickActivity,
  onClickTransport,
}: Props) {
  const sorted = [...destinations].sort((a, b) => (a.arrival < b.arrival ? -1 : 1))

  if (sorted.length === 0) return null

  return (
    <ScrollView
      contentContainerStyle={{ gap: 12, paddingHorizontal: 4, paddingBottom: 8 }}
      showsVerticalScrollIndicator={false}
    >
      {sorted.map((dest) => {
        const nights = differenceInDays(
          startOfDay(new Date(dest.departure)),
          startOfDay(new Date(dest.arrival))
        )
        const destHotels = hotels.filter(
          (h) =>
            h.destinationId === dest.id ||
            (new Date(h.checkIn) >= new Date(dest.arrival) &&
              new Date(h.checkOut) <= new Date(dest.departure))
        )
        const destActivities = activities
          .filter((a) => a.destinationId === dest.id)
          .sort((a, b) => (a.date < b.date ? -1 : 1))
        const destTransports = transports.filter(
          (t) =>
            t.destinationId === dest.id ||
            (t.departureDate >= dest.arrival && t.departureDate <= dest.departure)
        )

        const hasDetails =
          destHotels.length > 0 || destActivities.length > 0 || destTransports.length > 0
        const accentColor = dest.type === 'business' ? '#a78bfa' : '#38bdf8'

        return (
          <View
            key={dest.id}
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#f3f4f6',
              backgroundColor: '#ffffff',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
              overflow: 'hidden',
            }}
          >
            {/* Accent bar */}
            <View style={{ height: 4, backgroundColor: accentColor }} />

            {/* Destination header — tappable */}
            <Pressable
              onPress={() => onClickDest?.(dest)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
              })}
            >
              <Flag code={dest.countryCode} country={dest.country} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{ fontWeight: '600', fontSize: 14, color: '#111827' }}
                >
                  {dest.city}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}
                >
                  {dest.country}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>
                  {format(new Date(dest.arrival), 'MMM d')}–{format(new Date(dest.departure), 'MMM d')}
                </Text>
                <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>
                  {nights} night{nights !== 1 ? 's' : ''}
                </Text>
              </View>
            </Pressable>

            {hasDetails && (
              <View style={{ borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                {/* Hotels */}
                {destHotels.map((hotel) => (
                  <Pressable
                    key={hotel.id}
                    onPress={() => onClickHotel?.(hotel)}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.7 : 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: '#f9fafb',
                    })}
                  >
                    <BedIcon size={13} color="#9ca3af" />
                    <Text
                      numberOfLines={1}
                      style={{ flex: 1, fontSize: 12, color: '#4b5563' }}
                    >
                      {hotel.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>
                      {format(new Date(hotel.checkIn), 'MMM d')}–{format(new Date(hotel.checkOut), 'MMM d')}
                    </Text>
                  </Pressable>
                ))}

                {/* Transports */}
                {destTransports.map((t) => {
                  const cfg = TRANSPORT_CONFIG[t.type] ?? TRANSPORT_CONFIG['flight']
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => onClickTransport?.(t)}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.7 : 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: '#f9fafb',
                      })}
                    >
                      <TransportIcon type={t.type} size={13} color="#9ca3af" />
                      <Text
                        numberOfLines={1}
                        style={{ flex: 1, fontSize: 12, color: '#4b5563' }}
                      >
                        {t.fromCity} → {t.toCity}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>
                        {format(new Date(t.departureDate), 'MMM d')}
                      </Text>
                    </Pressable>
                  )
                })}

                {/* Activity pills */}
                {destActivities.length > 0 && (
                  <View
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 6,
                    }}
                  >
                    {destActivities.map((act) => {
                      const cfg = ACTIVITY_CONFIG[act.type] ?? ACTIVITY_CONFIG['attraction']
                      return (
                        <Pressable
                          key={act.id}
                          onPress={() => onClickActivity?.(act)}
                          style={({ pressed }) => ({
                            opacity: pressed ? 0.7 : 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 999,
                            backgroundColor: cfg.lightBg,
                            borderWidth: 1,
                            borderColor: cfg.lightBorder,
                          })}
                        >
                          <ActivityIcon type={act.type} size={10} color={cfg.color} />
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '500',
                              color: cfg.color,
                            }}
                          >
                            {act.name}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                )}
              </View>
            )}
          </View>
        )
      })}
    </ScrollView>
  )
}
