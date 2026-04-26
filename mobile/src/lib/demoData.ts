import { uuid } from '../utils/uuid'
import { addDays, format } from 'date-fns'

export function createDemoTrips() {
  const d = (offset: number) => format(addDays(new Date(), offset), 'yyyy-MM-dd')

  const parisId     = uuid()
  const romeId      = uuid()
  const barcelonaId = uuid()
  const lisbonId    = uuid()

  const tokyoId   = uuid()
  const seoulId   = uuid()
  const bangkokId = uuid()
  const baliId    = uuid()

  const europeTrip = {
    name: 'Europe Demo',
    destinations: [
      { id: parisId,     city: 'Paris',     country: 'France',      countryCode: 'FR', lat: 48.8566,  lng:   2.3522, arrival: d(14), departure: d(19), type: 'vacation' as const },
      { id: romeId,      city: 'Rome',      country: 'Italy',       countryCode: 'IT', lat: 41.9028,  lng:  12.4964, arrival: d(19), departure: d(24), type: 'vacation' as const },
      { id: barcelonaId, city: 'Barcelona', country: 'Spain',       countryCode: 'ES', lat: 41.3851,  lng:   2.1734, arrival: d(24), departure: d(29), type: 'vacation' as const },
      { id: lisbonId,    city: 'Lisbon',    country: 'Portugal',    countryCode: 'PT', lat: 38.7169,  lng:  -9.1395, arrival: d(29), departure: d(34), type: 'vacation' as const },
    ],
    hotels: [
      { id: uuid(), name: 'Hôtel Le Marais',       checkIn: d(14), checkOut: d(19) },
      { id: uuid(), name: 'Hotel Colosseo',         checkIn: d(19), checkOut: d(24) },
      { id: uuid(), name: 'Hotel Arts Barcelona',   checkIn: d(24), checkOut: d(29) },
      { id: uuid(), name: 'Bairro Alto Hotel',      checkIn: d(29), checkOut: d(34) },
    ],
    activities: [
      { id: uuid(), destinationId: parisId,     type: 'attraction' as const, name: 'Eiffel Tower',             date: d(15) },
      { id: uuid(), destinationId: parisId,     type: 'restaurant' as const, name: 'Dinner at Le Jules Verne',  date: d(16) },
      { id: uuid(), destinationId: parisId,     type: 'shopping'   as const, name: 'Champs-Élysées',            date: d(17) },
      { id: uuid(), destinationId: romeId,      type: 'attraction' as const, name: 'Colosseum & Roman Forum',   date: d(20) },
      { id: uuid(), destinationId: romeId,      type: 'attraction' as const, name: 'Vatican Museums',            date: d(21) },
      { id: uuid(), destinationId: romeId,      type: 'restaurant' as const, name: 'Osteria del Pegno',          date: d(22) },
      { id: uuid(), destinationId: barcelonaId, type: 'attraction' as const, name: 'Sagrada Família',            date: d(25) },
      { id: uuid(), destinationId: barcelonaId, type: 'shopping'   as const, name: 'La Boqueria Market',         date: d(26) },
      { id: uuid(), destinationId: barcelonaId, type: 'restaurant' as const, name: 'El Nacional',                date: d(27) },
      { id: uuid(), destinationId: lisbonId,    type: 'attraction' as const, name: 'Alfama District Walk',       date: d(30) },
      { id: uuid(), destinationId: lisbonId,    type: 'restaurant' as const, name: 'Pastéis de Belém',           date: d(31) },
      { id: uuid(), destinationId: lisbonId,    type: 'attraction' as const, name: 'Sintra Day Trip',            date: d(32) },
    ],
    transports: [],
    packingList: [],
    currency: 'EUR',
  }

  // Past-year Asia trip — gives the Travel Stats sparkline and year-over-year data
  const asiaTrip = {
    name: 'Asia 2025',
    destinations: [
      { id: tokyoId,   city: 'Tokyo',   country: 'Japan',        countryCode: 'JP', lat:  35.6762, lng: 139.6503, arrival: '2025-03-20', departure: '2025-03-26', type: 'vacation' as const },
      { id: seoulId,   city: 'Seoul',   country: 'South Korea',  countryCode: 'KR', lat:  37.5665, lng: 126.9780, arrival: '2025-03-26', departure: '2025-03-31', type: 'vacation' as const },
      { id: bangkokId, city: 'Bangkok', country: 'Thailand',     countryCode: 'TH', lat:  13.7563, lng: 100.5018, arrival: '2025-04-01', departure: '2025-04-07', type: 'vacation' as const },
      { id: baliId,    city: 'Bali',    country: 'Indonesia',    countryCode: 'ID', lat:  -8.3405, lng: 115.0920, arrival: '2025-04-07', departure: '2025-04-14', type: 'vacation' as const },
    ],
    hotels: [
      { id: uuid(), name: 'Park Hyatt Tokyo',          checkIn: '2025-03-20', checkOut: '2025-03-26' },
      { id: uuid(), name: 'Lotte Hotel Seoul',          checkIn: '2025-03-26', checkOut: '2025-03-31' },
      { id: uuid(), name: 'Mandarin Oriental Bangkok',  checkIn: '2025-04-01', checkOut: '2025-04-07' },
      { id: uuid(), name: 'COMO Uma Canggu',            checkIn: '2025-04-07', checkOut: '2025-04-14' },
    ],
    activities: [
      { id: uuid(), destinationId: tokyoId,   type: 'attraction' as const, name: 'Shinjuku Gyoen Cherry Blossoms', date: '2025-03-21' },
      { id: uuid(), destinationId: tokyoId,   type: 'restaurant' as const, name: 'Sukiyabashi Jiro',                date: '2025-03-22' },
      { id: uuid(), destinationId: tokyoId,   type: 'shopping'   as const, name: 'Akihabara Electronics District',  date: '2025-03-24' },
      { id: uuid(), destinationId: seoulId,   type: 'attraction' as const, name: 'Gyeongbokgung Palace',            date: '2025-03-27' },
      { id: uuid(), destinationId: seoulId,   type: 'restaurant' as const, name: 'Gwangjang Market Street Food',    date: '2025-03-28' },
      { id: uuid(), destinationId: bangkokId, type: 'attraction' as const, name: 'Wat Phra Kaew & Grand Palace',    date: '2025-04-02' },
      { id: uuid(), destinationId: bangkokId, type: 'restaurant' as const, name: 'Nahm Restaurant',                 date: '2025-04-04' },
      { id: uuid(), destinationId: baliId,    type: 'attraction' as const, name: 'Tegalalang Rice Terraces',        date: '2025-04-08' },
      { id: uuid(), destinationId: baliId,    type: 'restaurant' as const, name: 'Locavore Restaurant',             date: '2025-04-10' },
    ],
    transports: [],
    packingList: [],
    currency: 'USD',
  }

  return [europeTrip, asiaTrip]
}

// Single-trip export kept for any existing callers
export function createDemoTrip() {
  return createDemoTrips()[0]
}
