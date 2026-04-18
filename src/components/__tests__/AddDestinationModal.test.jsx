import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddDestinationModal from '../AddDestinationModal'

// Stub CitySearch to avoid network calls in tests
vi.mock('../CitySearch', () => ({
  default: ({ onChange, value }) => (
    <div>
      <input
        data-testid="city-search"
        defaultValue={value?.city || ''}
        onChange={(e) => {
          if (e.target.value === 'Paris') {
            onChange({ city: 'Paris', country: 'France', countryCode: 'FR', lat: 48.85, lng: 2.35 })
          } else if (e.target.value === '') {
            onChange(null)
          }
        }}
      />
    </div>
  ),
  Flag: ({ code }) => <span data-testid="flag">{code}</span>,
}))

const defaultProps = {
  editing: null,
  destinations: [],
  onAdd: vi.fn(),
  onUpdate: vi.fn(),
  onClose: vi.fn(),
}

function renderModal(props = {}) {
  return render(<AddDestinationModal {...defaultProps} {...props} />)
}

async function fillCity(user, value = 'Paris') {
  const input = screen.getByTestId('city-search')
  await user.clear(input)
  await user.type(input, value)
}

async function fillDates(user, arrival = '2025-08-01', departure = '2025-08-07') {
  const [arrInput, depInput] = screen.getAllByDisplayValue('')
  fireEvent.change(arrInput, { target: { value: arrival } })
  fireEvent.change(depInput, { target: { value: departure } })
}

describe('AddDestinationModal', () => {
  let user
  beforeEach(() => {
    user = userEvent.setup()
    defaultProps.onAdd.mockReset()
    defaultProps.onUpdate.mockReset()
    defaultProps.onClose.mockReset()
  })

  it('renders the add form', () => {
    renderModal()
    expect(screen.getByRole('heading', { name: 'Add destination' })).toBeInTheDocument()
    expect(screen.getByTestId('city-search')).toBeInTheDocument()
  })

  it('renders the edit form when editing prop is provided', () => {
    const editing = {
      id: 'd1', city: 'Paris', country: 'France', countryCode: 'FR',
      arrival: '2025-08-01T00:00:00.000Z', departure: '2025-08-07T00:00:00.000Z',
      type: 'vacation',
    }
    renderModal({ editing })
    expect(screen.getByText('Edit destination')).toBeInTheDocument()
    expect(screen.getByText('Save changes')).toBeInTheDocument()
  })

  it('shows error when city is not selected', async () => {
    renderModal()
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => {
      expect(screen.getByText(/please select a city/i)).toBeInTheDocument()
    })
    expect(defaultProps.onAdd).not.toHaveBeenCalled()
  })

  it('shows error when arrival date is missing', async () => {
    renderModal()
    await fillCity(user)
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => {
      expect(screen.getByText(/please set an arrival date/i)).toBeInTheDocument()
    })
  })

  it('shows error when departure date is missing', async () => {
    renderModal()
    await fillCity(user)
    const [arrInput] = screen.getAllByDisplayValue('')
    fireEvent.change(arrInput, { target: { value: '2025-08-01' } })
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => {
      expect(screen.getByText(/please set a departure date/i)).toBeInTheDocument()
    })
  })

  it('shows error when departure is before arrival', async () => {
    renderModal()
    await fillCity(user)
    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2025-08-07' } })
    fireEvent.change(dateInputs[1], { target: { value: '2025-08-01' } })
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => {
      expect(screen.getByText(/departure cannot be before arrival/i)).toBeInTheDocument()
    })
  })

  it('shows overlap error when dates conflict with existing destination', async () => {
    const existing = {
      id: 'd0', city: 'Rome', country: 'Italy', countryCode: 'IT',
      arrival: '2025-08-05T00:00:00.000Z', departure: '2025-08-10T00:00:00.000Z',
      type: 'vacation',
    }
    renderModal({ destinations: [existing] })
    await fillCity(user)
    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2025-08-01' } })
    fireEvent.change(dateInputs[1], { target: { value: '2025-08-08' } })
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => {
      expect(screen.getByText(/overlap/i)).toBeInTheDocument()
    })
  })

  it('allows same-day boundaries (depart A, arrive B on same day)', async () => {
    const existing = {
      id: 'd0', city: 'Rome', country: 'Italy', countryCode: 'IT',
      arrival: '2025-08-01T00:00:00.000Z', departure: '2025-08-05T00:00:00.000Z',
      type: 'vacation',
    }
    renderModal({ destinations: [existing] })
    await fillCity(user)
    const dateInputs = document.querySelectorAll('input[type="date"]')
    // New destination starts exactly when existing ends — should be allowed
    fireEvent.change(dateInputs[0], { target: { value: '2025-08-05' } })
    fireEvent.change(dateInputs[1], { target: { value: '2025-08-10' } })
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => {
      expect(screen.queryByText(/overlap/i)).not.toBeInTheDocument()
    })
    expect(defaultProps.onAdd).toHaveBeenCalledTimes(1)
  })

  it('calls onAdd with correct data when form is valid', async () => {
    renderModal()
    await fillCity(user)
    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2025-08-01' } })
    fireEvent.change(dateInputs[1], { target: { value: '2025-08-07' } })
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => {
      expect(defaultProps.onAdd).toHaveBeenCalledTimes(1)
    })
    const arg = defaultProps.onAdd.mock.calls[0][0]
    expect(arg.city).toBe('Paris')
    expect(arg.country).toBe('France')
    expect(arg.countryCode).toBe('FR')
    expect(arg.type).toBe('vacation')
  })

  it('defaults to vacation type', () => {
    renderModal()
    const vacBtn = screen.getByText('Vacation')
    expect(vacBtn.closest('button')).toHaveClass('bg-sky-50')
  })

  it('switches to business type', async () => {
    renderModal()
    await user.click(screen.getByText('Business'))
    await fillCity(user)
    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2025-08-01' } })
    fireEvent.change(dateInputs[1], { target: { value: '2025-08-07' } })
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => {
      expect(defaultProps.onAdd).toHaveBeenCalledTimes(1)
    })
    expect(defaultProps.onAdd.mock.calls[0][0].type).toBe('business')
  })

  it('calls onClose when Cancel is clicked', async () => {
    renderModal()
    await user.click(screen.getByText('Cancel'))
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', async () => {
    const { container } = renderModal()
    const backdrop = container.firstChild
    await user.click(backdrop)
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when modal content is clicked', async () => {
    const { container } = renderModal()
    const inner = container.querySelector('[class*="bg-white"]')
    await user.click(inner)
    expect(defaultProps.onClose).not.toHaveBeenCalled()
  })

  it('includes budget in payload when provided', async () => {
    renderModal()
    await fillCity(user)
    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2025-08-01' } })
    fireEvent.change(dateInputs[1], { target: { value: '2025-08-07' } })
    const budgetInput = document.querySelector('input[type="number"]')
    fireEvent.change(budgetInput, { target: { value: '500' } })
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => {
      expect(defaultProps.onAdd).toHaveBeenCalledTimes(1)
    })
    expect(defaultProps.onAdd.mock.calls[0][0].budget).toBe(500)
  })

  it('omits budget from payload when empty', async () => {
    renderModal()
    await fillCity(user)
    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2025-08-01' } })
    fireEvent.change(dateInputs[1], { target: { value: '2025-08-07' } })
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => {
      expect(defaultProps.onAdd).toHaveBeenCalledTimes(1)
    })
    expect(defaultProps.onAdd.mock.calls[0][0]).not.toHaveProperty('budget')
  })

  it('calls onUpdate (not onAdd) when editing', async () => {
    const editing = {
      id: 'd1', city: 'Paris', country: 'France', countryCode: 'FR',
      arrival: '2025-08-01T00:00:00.000Z', departure: '2025-08-07T00:00:00.000Z',
      type: 'vacation',
    }
    renderModal({ editing })
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledTimes(1)
    })
    expect(defaultProps.onAdd).not.toHaveBeenCalled()
  })
})
