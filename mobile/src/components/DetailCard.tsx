import React from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Image,
} from 'react-native'
import { format, differenceInDays, startOfDay } from 'date-fns'
import { formatCurrency } from '../utils/formatUtils'
import { ACTIVITY_CONFIG, ActivityIcon, BedIcon, TRANSPORT_CONFIG, TransportIcon } from './Icons'
import type { Destination, Hotel, Activity, Transport } from '../types/trip'

// ── Types ──────────────────────────────────────────────────────────────────

export type SelectedItem =
  | { kind: 'destination'; data: Destination; activities: Activity[]; hotels: Hotel[] }
  | { kind: 'hotel'; data: Hotel }
  | { kind: 'activity'; data: Activity; destination?: Destination }
  | { kind: 'transport'; data: Transport }
  | null

interface Props {
  item: SelectedItem
  onClose: () => void
  onEdit?: () => void
}

// ── Shared helpers ─────────────────────────────────────────────────────────

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

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <View style={{ marginBottom: 10 }}>
      {label ? (
        <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{label}</Text>
      ) : null}
      <Text style={{ fontSize: 14, color: '#1f2937' }}>{value}</Text>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  // Guard: only render if there's something to show
  const kids = React.Children.toArray(children).filter(Boolean)
  if (kids.length === 0) return null
  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: '600',
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      <View>{children}</View>
    </View>
  )
}

// ── Destination card ────────────────────────────────────────────────────────

function DestinationCard({
  dest,
  relatedActivities,
  relatedHotels,
}: {
  dest: Destination
  relatedActivities: Activity[]
  relatedHotels: Hotel[]
}) {
  const nights = differenceInDays(
    startOfDay(new Date(dest.departure)),
    startOfDay(new Date(dest.arrival))
  )
  const isVacation = dest.type === 'vacation'
  const hasFlightInfo = dest.flightNumber || dest.airline

  return (
    <View style={{ gap: 0 }}>
      {/* Title block */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Flag code={dest.countryCode} country={dest.country} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>{dest.city}</Text>
          <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>{dest.country}</Text>
        </View>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 999,
            backgroundColor: isVacation ? '#f0f9ff' : '#f5f3ff',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: isVacation ? '#0369a1' : '#6d28d9',
              fontWeight: '500',
            }}
          >
            {dest.type}
          </Text>
        </View>
      </View>

      {/* Stay */}
      <Section title="Stay">
        <Row
          label="Dates"
          value={`${format(new Date(dest.arrival), 'MMM d, yyyy')} → ${format(new Date(dest.departure), 'MMM d, yyyy')}`}
        />
        <Row label="Duration" value={`${nights} night${nights !== 1 ? 's' : ''}`} />
      </Section>

      {/* Flight info */}
      {hasFlightInfo ? (
        <Section title="Flight">
          <Row label="Airline" value={dest.airline} />
          <Row label="Flight number" value={dest.flightNumber} />
        </Section>
      ) : null}

      {/* Budget */}
      {dest.budget != null ? (
        <Section title="Budget">
          <Row label="Allocated" value={`$${formatCurrency(dest.budget)}`} />
        </Section>
      ) : null}

      {/* Notes */}
      {dest.notes ? (
        <Section title="Notes">
          <Row label="" value={dest.notes} />
        </Section>
      ) : null}

      {/* Hotels */}
      {relatedHotels.length > 0 ? (
        <Section title="Hotels">
          {relatedHotels.map((h) => {
            const hotelNights = differenceInDays(
              startOfDay(new Date(h.checkOut)),
              startOfDay(new Date(h.checkIn))
            )
            return (
              <View
                key={h.id}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}
              >
                <BedIcon size={13} color="#a8a29e" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                    {h.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>
                    {format(new Date(h.checkIn), 'MMM d')} – {format(new Date(h.checkOut), 'MMM d')} · {hotelNights}n
                  </Text>
                  {h.address ? (
                    <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{h.address}</Text>
                  ) : null}
                </View>
              </View>
            )
          })}
        </Section>
      ) : null}

      {/* Activities */}
      {relatedActivities.length > 0 ? (
        <Section title="Activities">
          {[...relatedActivities]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((act) => {
              const cfg = ACTIVITY_CONFIG[act.type] ?? ACTIVITY_CONFIG['attraction']
              return (
                <View
                  key={act.id}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: cfg.color,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ActivityIcon type={act.type} size={11} color="white" />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 14, color: '#374151' }}>{act.name}</Text>
                      <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                        {format(new Date(act.date), 'MMM d')}
                      </Text>
                    </View>
                    {act.address ? (
                      <Text
                        numberOfLines={1}
                        style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}
                      >
                        {act.address}
                      </Text>
                    ) : null}
                  </View>
                </View>
              )
            })}
        </Section>
      ) : null}
    </View>
  )
}

// ── Hotel card ──────────────────────────────────────────────────────────────

function HotelCard({ hotel }: { hotel: Hotel }) {
  const nights = differenceInDays(
    startOfDay(new Date(hotel.checkOut)),
    startOfDay(new Date(hotel.checkIn))
  )

  return (
    <View>
      {/* Title */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <BedIcon size={18} color="#a8a29e" />
        <View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>{hotel.name}</Text>
          <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>
            {nights} night{nights !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <Section title="Stay">
        <Row label="Check-in" value={format(new Date(hotel.checkIn), 'MMM d, yyyy')} />
        <Row label="Check-out" value={format(new Date(hotel.checkOut), 'MMM d, yyyy')} />
      </Section>

      {hotel.address || hotel.confirmationNumber ? (
        <Section title="Details">
          <Row label="Address" value={hotel.address} />
          <Row label="Confirmation" value={hotel.confirmationNumber} />
        </Section>
      ) : null}

      {hotel.budget != null ? (
        <Section title="Budget">
          <Row label="Cost" value={`$${formatCurrency(hotel.budget)}`} />
        </Section>
      ) : null}
    </View>
  )
}

// ── Activity card ───────────────────────────────────────────────────────────

function ActivityCard({
  activity,
  destination,
}: {
  activity: Activity
  destination?: Destination
}) {
  const cfg = ACTIVITY_CONFIG[activity.type] ?? ACTIVITY_CONFIG['attraction']

  return (
    <View>
      {/* Title */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: cfg.color,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ActivityIcon type={activity.type} size={16} color="white" />
        </View>
        <View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>{activity.name}</Text>
          <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>
            {cfg.label} · {format(new Date(activity.date), 'MMM d, yyyy')}
            {destination ? ` · ${destination.city}` : ''}
          </Text>
        </View>
      </View>

      <Section title="Details">
        {(activity as any).budget != null ? (
          <Row label="Cost" value={`$${formatCurrency((activity as any).budget)}`} />
        ) : null}
        <Row label="Address" value={activity.address} />
        {activity.type === 'medical' ? (
          <>
            <Row label="Doctor / provider" value={(activity as any).doctorName} />
            <Row label="Appointment time" value={(activity as any).time} />
            <Row label="Phone" value={activity.phone} />
          </>
        ) : null}
        {activity.type === 'restaurant' ? (
          <>
            <Row label="Phone" value={activity.phone} />
            <Row label="Reservation ref" value={(activity as any).reservationRef} />
          </>
        ) : null}
        {activity.type === 'attraction' || activity.type === 'shopping' ? (
          <>
            <Row label="Website" value={activity.website} />
            {activity.type === 'attraction' ? (
              <Row label="Opening hours" value={(activity as any).openingHours} />
            ) : null}
          </>
        ) : null}
        <Row label="Notes" value={activity.notes} />
      </Section>
    </View>
  )
}

// ── Transport card ──────────────────────────────────────────────────────────

function TransportCard({ transport }: { transport: Transport }) {
  const cfg = TRANSPORT_CONFIG[transport.type] ?? TRANSPORT_CONFIG['flight']

  return (
    <View>
      {/* Title */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: cfg.color,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <TransportIcon type={transport.type} size={16} color="white" />
        </View>
        <View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
            {transport.fromCity} → {transport.toCity}
          </Text>
          <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>{cfg.label}</Text>
        </View>
      </View>

      <Section title="Schedule">
        <Row
          label="Departure"
          value={`${format(new Date(transport.departureDate), 'MMM d, yyyy')}${(transport as any).departureTime ? ` at ${(transport as any).departureTime}` : ''}`}
        />
        <Row
          label="Arrival"
          value={`${format(new Date(transport.arrivalDate), 'MMM d, yyyy')}${(transport as any).arrivalTime ? ` at ${(transport as any).arrivalTime}` : ''}`}
        />
      </Section>

      {transport.carrier || transport.flightNumber ? (
        <Section title="Details">
          <Row
            label={transport.type === 'flight' ? 'Airline' : transport.type === 'train' ? 'Train operator' : 'Carrier'}
            value={transport.carrier}
          />
          <Row
            label={transport.type === 'flight' ? 'Flight number' : 'Booking reference'}
            value={transport.flightNumber}
          />
        </Section>
      ) : null}

      {transport.budget != null ? (
        <Section title="Budget">
          <Row label="Cost" value={`$${formatCurrency(transport.budget)}`} />
        </Section>
      ) : null}
    </View>
  )
}

// ── Main DetailCard ─────────────────────────────────────────────────────────

export default function DetailCard({ item, onClose, onEdit }: Props) {
  return (
    <Modal
      visible={item !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        {/* Drag handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <View
            style={{
              width: 32,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#e5e7eb',
            }}
          />
        </View>

        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#f3f4f6',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            {item?.kind === 'destination'
              ? 'Destination'
              : item?.kind === 'hotel'
              ? 'Hotel'
              : item?.kind === 'transport'
              ? 'Transport'
              : 'Activity'}
          </Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: -8,
            })}
            accessibilityLabel="Close"
          >
            <Text style={{ fontSize: 18, color: '#9ca3af' }}>✕</Text>
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {item?.kind === 'destination' && (
            <DestinationCard
              dest={item.data}
              relatedActivities={item.activities ?? []}
              relatedHotels={item.hotels ?? []}
            />
          )}
          {item?.kind === 'hotel' && <HotelCard hotel={item.data} />}
          {item?.kind === 'transport' && <TransportCard transport={item.data} />}
          {item?.kind === 'activity' && (
            <ActivityCard activity={item.data} destination={item.destination} />
          )}
        </ScrollView>

        {/* Footer */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderTopColor: '#f3f4f6',
          }}
        >
          <Pressable
            onPress={onEdit}
            style={({ pressed }) => ({
              opacity: pressed ? 0.85 : 1,
              backgroundColor: '#0ea5e9',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
            })}
            accessibilityLabel="Edit"
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>Edit</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
