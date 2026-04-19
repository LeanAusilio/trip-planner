import { uuid } from './uuid'
import { addDays, format } from 'date-fns'

// Creates a realistic demo trip with dates relative to today
export function createDemoTrip() {
  const d = (offset) => format(addDays(new Date(), offset), 'yyyy-MM-dd')

  const parisId    = uuid()
  const romeId     = uuid()
  const barcelonaId = uuid()
  const lisbonId   = uuid()

  return {
    name: 'Europe Demo',
    destinations: [
      { id: parisId,     city: 'Paris',     country: 'France',   countryCode: 'FR', arrival: d(14), departure: d(19), type: 'vacation' },
      { id: romeId,      city: 'Rome',      country: 'Italy',    countryCode: 'IT', arrival: d(19), departure: d(24), type: 'vacation' },
      { id: barcelonaId, city: 'Barcelona', country: 'Spain',    countryCode: 'ES', arrival: d(24), departure: d(29), type: 'vacation' },
      { id: lisbonId,    city: 'Lisbon',    country: 'Portugal', countryCode: 'PT', arrival: d(29), departure: d(34), type: 'vacation' },
    ],
    hotels: [
      { id: uuid(), name: 'Hôtel Le Marais',       checkIn: d(14), checkOut: d(19) },
      { id: uuid(), name: 'Hotel Colosseo',         checkIn: d(19), checkOut: d(24) },
      { id: uuid(), name: 'Hotel Arts Barcelona',   checkIn: d(24), checkOut: d(29) },
      { id: uuid(), name: 'Bairro Alto Hotel',      checkIn: d(29), checkOut: d(34) },
    ],
    activities: [
      { id: uuid(), destinationId: parisId,     type: 'attraction', name: 'Eiffel Tower',           date: d(15) },
      { id: uuid(), destinationId: parisId,     type: 'restaurant', name: 'Dinner at Le Jules Verne', date: d(16) },
      { id: uuid(), destinationId: parisId,     type: 'shopping',   name: 'Champs-Élysées',          date: d(17) },

      { id: uuid(), destinationId: romeId,      type: 'attraction', name: 'Colosseum & Roman Forum', date: d(20) },
      { id: uuid(), destinationId: romeId,      type: 'attraction', name: 'Vatican Museums',          date: d(21) },
      { id: uuid(), destinationId: romeId,      type: 'restaurant', name: 'Osteria del Pegno',        date: d(22) },

      { id: uuid(), destinationId: barcelonaId, type: 'attraction', name: 'Sagrada Família',          date: d(25) },
      { id: uuid(), destinationId: barcelonaId, type: 'shopping',   name: 'La Boqueria Market',       date: d(26) },
      { id: uuid(), destinationId: barcelonaId, type: 'restaurant', name: 'El Nacional',              date: d(27) },

      { id: uuid(), destinationId: lisbonId,    type: 'attraction', name: 'Alfama District Walk',     date: d(30) },
      { id: uuid(), destinationId: lisbonId,    type: 'restaurant', name: 'Pastéis de Belém',         date: d(31) },
      { id: uuid(), destinationId: lisbonId,    type: 'attraction', name: 'Sintra Day Trip',          date: d(32) },
    ],
    transports: [],
    packingList: [],
    currency: 'EUR',
  }
}
