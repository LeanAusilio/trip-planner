import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DetailCard from '../DetailCard'

// ── Fixtures ────────────────────────────────────────────────────────────────

const destination = {
  id: 'dest-1',
  city: 'Paris',
  country: 'France',
  countryCode: 'FR',
  type: 'vacation',
  arrival: '2025-06-01T00:00:00.000Z',
  departure: '2025-06-10T00:00:00.000Z',
}

const destinationWithFlight = {
  ...destination,
  airline: 'Air France',
  flightNumber: 'AF123',
  departureTime: '08:30',
  arrivalTime: '10:45',
  notes: 'Window seat requested',
}

const hotel = {
  id: 'hotel-1',
  name: 'Hotel Ritz',
  checkIn: '2025-06-01T00:00:00.000Z',
  checkOut: '2025-06-05T00:00:00.000Z',
  address: '15 Place Vendôme, Paris',
  confirmationNumber: 'HTL-99991',
  bookingUrl: 'https://ritz.example.com',
}

const activity = {
  id: 'act-1',
  destinationId: 'dest-1',
  type: 'restaurant',
  name: 'Le Jules Verne',
  date: '2025-06-03T00:00:00.000Z',
  address: 'Champ de Mars, Paris',
  phone: '+33 1 45 55 61 44',
  reservationRef: 'RES-4021',
}

const medicalActivity = {
  id: 'act-2',
  destinationId: 'dest-1',
  type: 'medical',
  name: 'Check-up',
  date: '2025-06-04T00:00:00.000Z',
  address: '10 Rue de la Santé, Paris',
  doctorName: 'Dr. Dupont',
  time: '14:30',
  phone: '+33 1 11 22 33 44',
  notes: 'Bring insurance card',
}

const attractionActivity = {
  id: 'act-3',
  destinationId: 'dest-1',
  type: 'attraction',
  name: 'Eiffel Tower',
  date: '2025-06-05T00:00:00.000Z',
  address: 'Champ de Mars, 5 Av. Anatole France',
  website: 'https://www.toureiffel.paris',
  openingHours: '09:00–23:00',
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('DetailCard', () => {
  it('renders nothing when item is null', () => {
    const { container } = render(<DetailCard item={null} onClose={vi.fn()} onEdit={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  describe('destination card', () => {
    it('shows city name and country', () => {
      render(
        <DetailCard
          item={{ kind: 'destination', data: destination, activities: [], hotels: [] }}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />
      )
      expect(screen.getByText('Paris')).toBeInTheDocument()
      expect(screen.getByText('France')).toBeInTheDocument()
    })

    it('shows formatted dates and night count', () => {
      render(
        <DetailCard
          item={{ kind: 'destination', data: destination, activities: [], hotels: [] }}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />
      )
      expect(screen.getByText(/9 nights/)).toBeInTheDocument()
    })

    it('shows type badge', () => {
      render(
        <DetailCard
          item={{ kind: 'destination', data: destination, activities: [], hotels: [] }}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />
      )
      expect(screen.getByText('vacation')).toBeInTheDocument()
    })

    it('shows flight details when provided', () => {
      render(
        <DetailCard
          item={{ kind: 'destination', data: destinationWithFlight, activities: [], hotels: [] }}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />
      )
      expect(screen.getByText('Air France')).toBeInTheDocument()
      expect(screen.getByText('AF123')).toBeInTheDocument()
      expect(screen.getByText('08:30')).toBeInTheDocument()
      expect(screen.getByText('10:45')).toBeInTheDocument()
    })

    it('hides flight section when no flight info', () => {
      render(
        <DetailCard
          item={{ kind: 'destination', data: destination, activities: [], hotels: [] }}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />
      )
      expect(screen.queryByText('Flight')).not.toBeInTheDocument()
    })

    it('shows notes when provided', () => {
      render(
        <DetailCard
          item={{ kind: 'destination', data: destinationWithFlight, activities: [], hotels: [] }}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />
      )
      expect(screen.getByText('Window seat requested')).toBeInTheDocument()
    })

    it('shows related hotels', () => {
      render(
        <DetailCard
          item={{ kind: 'destination', data: destination, activities: [], hotels: [hotel] }}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />
      )
      expect(screen.getByText('Hotel Ritz')).toBeInTheDocument()
      expect(screen.getByText('15 Place Vendôme, Paris')).toBeInTheDocument()
    })

    it('shows related activities', () => {
      render(
        <DetailCard
          item={{ kind: 'destination', data: destination, activities: [activity], hotels: [] }}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />
      )
      expect(screen.getByText('Le Jules Verne')).toBeInTheDocument()
    })
  })

  describe('hotel card', () => {
    it('shows hotel name and night count', () => {
      render(
        <DetailCard item={{ kind: 'hotel', data: hotel }} onClose={vi.fn()} onEdit={vi.fn()} />
      )
      expect(screen.getByText('Hotel Ritz')).toBeInTheDocument()
      expect(screen.getByText(/4 nights/)).toBeInTheDocument()
    })

    it('shows address and confirmation number', () => {
      render(
        <DetailCard item={{ kind: 'hotel', data: hotel }} onClose={vi.fn()} onEdit={vi.fn()} />
      )
      expect(screen.getByText('15 Place Vendôme, Paris')).toBeInTheDocument()
      expect(screen.getByText('HTL-99991')).toBeInTheDocument()
    })

    it('shows booking link', () => {
      render(
        <DetailCard item={{ kind: 'hotel', data: hotel }} onClose={vi.fn()} onEdit={vi.fn()} />
      )
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'https://ritz.example.com')
    })

    it('hides Details section when no optional fields set', () => {
      const bare = { id: 'h2', name: 'Budget Inn', checkIn: '2025-06-01T00:00:00.000Z', checkOut: '2025-06-03T00:00:00.000Z' }
      render(
        <DetailCard item={{ kind: 'hotel', data: bare }} onClose={vi.fn()} onEdit={vi.fn()} />
      )
      expect(screen.queryByText('Details')).not.toBeInTheDocument()
    })
  })

  describe('activity card', () => {
    it('shows activity name and type label', () => {
      render(
        <DetailCard
          item={{ kind: 'activity', data: activity, destination }}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />
      )
      expect(screen.getByText('Le Jules Verne')).toBeInTheDocument()
      expect(screen.getByText(/Restaurant/)).toBeInTheDocument()
    })

    it('shows restaurant-specific fields', () => {
      render(
        <DetailCard
          item={{ kind: 'activity', data: activity, destination }}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />
      )
      expect(screen.getByText('Champ de Mars, Paris')).toBeInTheDocument()
      expect(screen.getByText('+33 1 45 55 61 44')).toBeInTheDocument()
      expect(screen.getByText('RES-4021')).toBeInTheDocument()
    })

    it('shows medical-specific fields', () => {
      render(
        <DetailCard
          item={{ kind: 'activity', data: medicalActivity, destination }}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />
      )
      expect(screen.getByText('Dr. Dupont')).toBeInTheDocument()
      expect(screen.getByText('14:30')).toBeInTheDocument()
      expect(screen.getByText('Bring insurance card')).toBeInTheDocument()
    })

    it('shows attraction-specific fields', () => {
      render(
        <DetailCard
          item={{ kind: 'activity', data: attractionActivity, destination }}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />
      )
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'https://www.toureiffel.paris')
      expect(screen.getByText('09:00–23:00')).toBeInTheDocument()
    })

    it('shows destination city in subtitle', () => {
      render(
        <DetailCard
          item={{ kind: 'activity', data: activity, destination }}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />
      )
      expect(screen.getAllByText(/Paris/).length).toBeGreaterThan(0)
    })
  })

  describe('interactions', () => {
    it('calls onClose when × button is clicked', () => {
      const onClose = vi.fn()
      render(
        <DetailCard
          item={{ kind: 'hotel', data: hotel }}
          onClose={onClose}
          onEdit={vi.fn()}
        />
      )
      fireEvent.click(screen.getByTestId('detail-card-close'))
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('calls onClose when backdrop is clicked', () => {
      const onClose = vi.fn()
      render(
        <DetailCard
          item={{ kind: 'hotel', data: hotel }}
          onClose={onClose}
          onEdit={vi.fn()}
        />
      )
      fireEvent.click(screen.getByTestId('detail-card-backdrop'))
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('calls onEdit when Edit button is clicked', () => {
      const onEdit = vi.fn()
      render(
        <DetailCard
          item={{ kind: 'hotel', data: hotel }}
          onClose={vi.fn()}
          onEdit={onEdit}
        />
      )
      fireEvent.click(screen.getByTestId('detail-card-edit'))
      expect(onEdit).toHaveBeenCalledOnce()
    })

    it('shows correct header label for each kind', () => {
      const { rerender } = render(
        <DetailCard
          item={{ kind: 'destination', data: destination, activities: [], hotels: [] }}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />
      )
      expect(screen.getByText('Destination')).toBeInTheDocument()

      rerender(
        <DetailCard
          item={{ kind: 'hotel', data: hotel }}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />
      )
      expect(screen.getByText('Hotel')).toBeInTheDocument()

      rerender(
        <DetailCard
          item={{ kind: 'activity', data: activity, destination }}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />
      )
      expect(screen.getByText('Activity')).toBeInTheDocument()
    })
  })
})
