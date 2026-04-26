export interface Destination {
  id: string
  city: string
  country: string
  countryCode: string
  lat?: number | null
  lng?: number | null
  arrival: string   // ISO date string yyyy-MM-dd
  departure: string
  type: 'vacation' | 'business'
  budget?: number
  notes?: string
  airline?: string
  flightNumber?: string
}

export interface Hotel {
  id: string
  name: string
  checkIn: string
  checkOut: string
  address?: string
  confirmationNumber?: string
  budget?: number
  destinationId?: string
}

export interface Activity {
  id: string
  destinationId: string
  type: 'restaurant' | 'attraction' | 'shopping' | 'medical'
  name: string
  date: string
  address?: string
  notes?: string
  phone?: string
  website?: string
}

export interface Transport {
  id: string
  type: 'flight' | 'train' | 'bus' | 'car' | 'ferry' | 'other'
  fromCity: string
  toCity: string
  departureDate: string
  arrivalDate: string
  carrier?: string
  flightNumber?: string
  destinationId?: string
  budget?: number
}

export interface PackingItem {
  id: string
  label: string
  checked: boolean
  category?: string
}

export interface Trip {
  id: string
  name: string
  destinations: Destination[]
  hotels: Hotel[]
  activities: Activity[]
  transports: Transport[]
  packingList: PackingItem[]
  currency: string
  documents?: any[]
}
