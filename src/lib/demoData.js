import { uuid } from './uuid'
import { addDays, format } from 'date-fns'

export function createDemoTrips() {
  const d = (offset) => format(addDays(new Date(), offset), 'yyyy-MM-dd')

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
      { id: parisId,     city: 'Paris',     country: 'France',      countryCode: 'FR', lat: 48.8566,  lng:   2.3522, arrival: d(14), departure: d(19), type: 'vacation' },
      { id: romeId,      city: 'Rome',      country: 'Italy',       countryCode: 'IT', lat: 41.9028,  lng:  12.4964, arrival: d(19), departure: d(24), type: 'vacation' },
      { id: barcelonaId, city: 'Barcelona', country: 'Spain',       countryCode: 'ES', lat: 41.3851,  lng:   2.1734, arrival: d(24), departure: d(29), type: 'vacation' },
      { id: lisbonId,    city: 'Lisbon',    country: 'Portugal',    countryCode: 'PT', lat: 38.7169,  lng:  -9.1395, arrival: d(29), departure: d(34), type: 'vacation' },
    ],
    hotels: [
      { id: uuid(), name: 'Hôtel Le Marais',       checkIn: d(14), checkOut: d(19) },
      { id: uuid(), name: 'Hotel Colosseo',         checkIn: d(19), checkOut: d(24) },
      { id: uuid(), name: 'Hotel Arts Barcelona',   checkIn: d(24), checkOut: d(29) },
      { id: uuid(), name: 'Bairro Alto Hotel',      checkIn: d(29), checkOut: d(34) },
    ],
    activities: [
      { id: uuid(), destinationId: parisId,     type: 'attraction', name: 'Eiffel Tower',             date: d(15) },
      { id: uuid(), destinationId: parisId,     type: 'restaurant', name: 'Dinner at Le Jules Verne',  date: d(16) },
      { id: uuid(), destinationId: parisId,     type: 'shopping',   name: 'Champs-Élysées',            date: d(17) },
      { id: uuid(), destinationId: romeId,      type: 'attraction', name: 'Colosseum & Roman Forum',   date: d(20) },
      { id: uuid(), destinationId: romeId,      type: 'attraction', name: 'Vatican Museums',            date: d(21) },
      { id: uuid(), destinationId: romeId,      type: 'restaurant', name: 'Osteria del Pegno',          date: d(22) },
      { id: uuid(), destinationId: barcelonaId, type: 'attraction', name: 'Sagrada Família',            date: d(25) },
      { id: uuid(), destinationId: barcelonaId, type: 'shopping',   name: 'La Boqueria Market',         date: d(26) },
      { id: uuid(), destinationId: barcelonaId, type: 'restaurant', name: 'El Nacional',                date: d(27) },
      { id: uuid(), destinationId: lisbonId,    type: 'attraction', name: 'Alfama District Walk',       date: d(30) },
      { id: uuid(), destinationId: lisbonId,    type: 'restaurant', name: 'Pastéis de Belém',           date: d(31) },
      { id: uuid(), destinationId: lisbonId,    type: 'attraction', name: 'Sintra Day Trip',            date: d(32) },
    ],
    transports: [],
    packingList: [],
    currency: 'EUR',
  }

  // Past-year Asia trip — gives the Travel Stats sparkline and year-over-year data
  const asiaTrip = {
    name: 'Asia 2025',
    destinations: [
      { id: tokyoId,   city: 'Tokyo',   country: 'Japan',        countryCode: 'JP', lat:  35.6762, lng: 139.6503, arrival: '2025-03-20', departure: '2025-03-26', type: 'vacation' },
      { id: seoulId,   city: 'Seoul',   country: 'South Korea',  countryCode: 'KR', lat:  37.5665, lng: 126.9780, arrival: '2025-03-26', departure: '2025-03-31', type: 'vacation' },
      { id: bangkokId, city: 'Bangkok', country: 'Thailand',     countryCode: 'TH', lat:  13.7563, lng: 100.5018, arrival: '2025-04-01', departure: '2025-04-07', type: 'vacation' },
      { id: baliId,    city: 'Bali',    country: 'Indonesia',    countryCode: 'ID', lat:  -8.3405, lng: 115.0920, arrival: '2025-04-07', departure: '2025-04-14', type: 'vacation' },
    ],
    hotels: [
      { id: uuid(), name: 'Park Hyatt Tokyo',          checkIn: '2025-03-20', checkOut: '2025-03-26' },
      { id: uuid(), name: 'Lotte Hotel Seoul',          checkIn: '2025-03-26', checkOut: '2025-03-31' },
      { id: uuid(), name: 'Mandarin Oriental Bangkok',  checkIn: '2025-04-01', checkOut: '2025-04-07' },
      { id: uuid(), name: 'COMO Uma Canggu',            checkIn: '2025-04-07', checkOut: '2025-04-14' },
    ],
    activities: [
      { id: uuid(), destinationId: tokyoId,   type: 'attraction', name: 'Shinjuku Gyoen Cherry Blossoms', date: '2025-03-21' },
      { id: uuid(), destinationId: tokyoId,   type: 'restaurant', name: 'Sukiyabashi Jiro',                date: '2025-03-22' },
      { id: uuid(), destinationId: tokyoId,   type: 'shopping',   name: 'Akihabara Electronics District',  date: '2025-03-24' },
      { id: uuid(), destinationId: seoulId,   type: 'attraction', name: 'Gyeongbokgung Palace',            date: '2025-03-27' },
      { id: uuid(), destinationId: seoulId,   type: 'restaurant', name: 'Gwangjang Market Street Food',    date: '2025-03-28' },
      { id: uuid(), destinationId: bangkokId, type: 'attraction', name: 'Wat Phra Kaew & Grand Palace',    date: '2025-04-02' },
      { id: uuid(), destinationId: bangkokId, type: 'restaurant', name: 'Nahm Restaurant',                 date: '2025-04-04' },
      { id: uuid(), destinationId: baliId,    type: 'attraction', name: 'Tegalalang Rice Terraces',        date: '2025-04-08' },
      { id: uuid(), destinationId: baliId,    type: 'restaurant', name: 'Locavore Restaurant',             date: '2025-04-10' },
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
