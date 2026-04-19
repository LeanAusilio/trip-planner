import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SummaryDashboard from '../SummaryDashboard'

vi.mock('../CitySearch', () => ({
  Flag: ({ code }) => <span data-testid={`flag-${code}`}>{code}</span>,
}))

const makeDest = (overrides = {}) => ({
  id: 'd1',
  city: 'Paris',
  country: 'France',
  countryCode: 'FR',
  arrival: '2025-06-01T00:00:00.000Z',
  departure: '2025-06-08T00:00:00.000Z',
  type: 'vacation',
  budget: 200,
  ...overrides,
})

const makeHotel = (overrides = {}) => ({
  id: 'h1',
  name: 'Hotel Test',
  checkIn: '2025-06-01T00:00:00.000Z',
  checkOut: '2025-06-08T00:00:00.000Z',
  budget: 700,
  ...overrides,
})

const makeActivity = (overrides = {}) => ({
  id: 'a1',
  destinationId: 'd1',
  type: 'restaurant',
  name: 'Nice dinner',
  date: '2025-06-03',
  budget: 100,
  ...overrides,
})

const makeTransport = (overrides = {}) => ({
  id: 't1',
  type: 'flight',
  fromCity: 'NYC',
  toCity: 'Paris',
  departureDate: '2025-06-01',
  arrivalDate: '2025-06-01',
  budget: 400,
  ...overrides,
})

const defaultProps = {
  destinations: [makeDest()],
  hotels: [makeHotel()],
  activities: [makeActivity()],
  transports: [],
  currency: 'USD',
  onCurrencyChange: vi.fn(),
}

describe('SummaryDashboard', () => {
  beforeEach(() => {
    defaultProps.onCurrencyChange.mockReset()
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ rates: {} }),
    })
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders nothing when no budget data exists', () => {
    const { container } = render(
      <SummaryDashboard
        destinations={[makeDest({ budget: undefined })]}
        hotels={[]}
        activities={[]}
        transports={[]}
        currency="USD"
        onCurrencyChange={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when destinations array is empty', () => {
    const { container } = render(
      <SummaryDashboard
        destinations={[]}
        hotels={[makeHotel()]}
        activities={[]}
        transports={[]}
        currency="USD"
        onCurrencyChange={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders Budget Summary heading', () => {
    render(<SummaryDashboard {...defaultProps} />)
    expect(screen.getByText('Budget Summary')).toBeInTheDocument()
  })

  it('shows grand total (dest + hotel + activity)', () => {
    render(<SummaryDashboard {...defaultProps} />)
    // 200 + 700 + 100 = 1000; appears in grand total heading and per-dest card
    expect(screen.getAllByText('$1,000.00').length).toBeGreaterThanOrEqual(1)
  })

  it('shows per-night cost', () => {
    render(<SummaryDashboard {...defaultProps} />)
    // 7 nights, total 1000 → $142.86/night — appears in both cards
    expect(screen.getAllByText(/142\.86/).length).toBeGreaterThanOrEqual(1)
  })

  it('shows transport in separate section', () => {
    const props = { ...defaultProps, transports: [makeTransport()] }
    render(<SummaryDashboard {...props} />)
    expect(screen.getByText('All transport')).toBeInTheDocument()
    // grand total = 200 + 700 + 100 + 400 = 1400
    expect(screen.getByText('$1,400.00')).toBeInTheDocument()
  })

  it('shows destination city in per-destination breakdown', () => {
    render(<SummaryDashboard {...defaultProps} />)
    expect(screen.getByText('Paris')).toBeInTheDocument()
  })

  it('shows category breakdown bars when category totals > 0', () => {
    render(<SummaryDashboard {...defaultProps} />)
    expect(screen.getByText('Hotels')).toBeInTheDocument()
    expect(screen.getByText('Activities')).toBeInTheDocument()
    expect(screen.getByText('Destinations')).toBeInTheDocument()
  })

  it('renders currency selectors', () => {
    render(<SummaryDashboard {...defaultProps} />)
    expect(screen.getByText('Entered in')).toBeInTheDocument()
    expect(screen.getByText('Show as')).toBeInTheDocument()
  })

  it('calls onCurrencyChange when base currency changes', () => {
    render(<SummaryDashboard {...defaultProps} />)
    const [baseCurrencySelect] = screen.getAllByRole('combobox')
    fireEvent.change(baseCurrencySelect, { target: { value: 'EUR' } })
    expect(defaultProps.onCurrencyChange).toHaveBeenCalledWith('EUR')
  })

  it('fetches exchange rate when display currency differs from base', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ rates: { EUR: 0.93 } }),
    })

    render(<SummaryDashboard {...defaultProps} />)
    const selects = screen.getAllByRole('combobox')
    // Change display currency (second select)
    fireEvent.change(selects[1], { target: { value: 'EUR' } })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('frankfurter.app/latest?from=USD&to=EUR')
      )
    })
  })

  it('shows exchange rate info when display differs from base', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ rates: { EUR: 0.93 } }),
    })

    render(<SummaryDashboard {...defaultProps} />)
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[1], { target: { value: 'EUR' } })

    await waitFor(() => {
      expect(screen.getByText(/1 USD = 0\.9300 EUR/)).toBeInTheDocument()
    })
  })

  it('converts amounts using fetched rate', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ rates: { EUR: 0.5 } }),
    })

    render(<SummaryDashboard {...defaultProps} />)
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[1], { target: { value: 'EUR' } })

    await waitFor(() => {
      // grand total 1000 * 0.5 = 500, displayed as €500.00
      expect(screen.getAllByText('€500.00').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('does not fetch when display currency equals base currency', () => {
    global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ rates: {} }) })
    render(<SummaryDashboard {...defaultProps} />)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('handles fetch failure gracefully (rate stays 1)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network'))
    render(<SummaryDashboard {...defaultProps} />)
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[1], { target: { value: 'EUR' } })

    await waitFor(() => {
      // After failure, rate defaults to 1; displayCurrency is EUR so symbol changes but value stays same
      expect(screen.getAllByText('€1,000.00').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows nights count for destination', () => {
    render(<SummaryDashboard {...defaultProps} />)
    expect(screen.getAllByText(/7 night/).length).toBeGreaterThanOrEqual(1)
  })

  it('handles multiple destinations correctly', () => {
    const dest2 = makeDest({
      id: 'd2',
      city: 'London',
      country: 'UK',
      countryCode: 'GB',
      arrival: '2025-07-01T00:00:00.000Z',
      departure: '2025-07-06T00:00:00.000Z',
      budget: 300,
    })
    const props = { ...defaultProps, destinations: [makeDest(), dest2] }
    render(<SummaryDashboard {...props} />)
    expect(screen.getByText('Paris')).toBeInTheDocument()
    expect(screen.getByText('London')).toBeInTheDocument()
    // total: 200 + 700 + 100 + 300 = 1300
    expect(screen.getByText('$1,300.00')).toBeInTheDocument()
  })
})
