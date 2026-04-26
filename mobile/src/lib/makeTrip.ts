import { uuid } from '../utils/uuid'
import type { Trip } from '../types/trip'

export function makeTrip(name: string, overrides: Partial<Trip> = {}): Trip {
  return {
    id: uuid(),
    name,
    destinations: [],
    hotels: [],
    activities: [],
    transports: [],
    packingList: [],
    currency: 'USD',
    documents: [],
    ...overrides,
  }
}
