import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HotelModal from '../HotelModal'

const defaultProps = {
  editing: null,
  hotels: [],
  onSave: vi.fn(),
  onClose: vi.fn(),
}

function renderModal(props = {}) {
  return render(<HotelModal {...defaultProps} {...props} />)
}

async function fillForm(user, name = 'Grand Hotel', checkIn = '2025-08-01', checkOut = '2025-08-07') {
  const nameInput = screen.getByPlaceholderText('e.g. Hotel Ritz')
  await user.clear(nameInput)
  await user.type(nameInput, name)
  const dateInputs = document.querySelectorAll('input[type="date"]')
  fireEvent.change(dateInputs[0], { target: { value: checkIn } })
  fireEvent.change(dateInputs[1], { target: { value: checkOut } })
}

describe('HotelModal', () => {
  let user
  beforeEach(() => {
    user = userEvent.setup()
    defaultProps.onSave.mockReset()
    defaultProps.onClose.mockReset()
  })

  it('renders Add hotel form', () => {
    renderModal()
    expect(screen.getByRole('heading', { name: 'Add hotel' })).toBeInTheDocument()
  })

  it('renders Edit hotel form when editing', () => {
    const editing = { id: 'h1', name: 'Ritz', checkIn: '2025-08-01T00:00:00.000Z', checkOut: '2025-08-07T00:00:00.000Z' }
    renderModal({ editing })
    expect(screen.getByText('Edit hotel')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Ritz')).toBeInTheDocument()
  })

  it('shows error when hotel name is empty', async () => {
    renderModal()
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => {
      expect(screen.getByText(/please enter a hotel name/i)).toBeInTheDocument()
    })
    expect(defaultProps.onSave).not.toHaveBeenCalled()
  })

  it('shows error when check-in is missing', async () => {
    renderModal()
    const nameInput = screen.getByPlaceholderText('e.g. Hotel Ritz')
    await user.type(nameInput, 'Grand')
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => {
      expect(screen.getByText(/please set a check-in date/i)).toBeInTheDocument()
    })
  })

  it('shows error when check-out is missing', async () => {
    renderModal()
    const nameInput = screen.getByPlaceholderText('e.g. Hotel Ritz')
    await user.type(nameInput, 'Grand')
    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2025-08-01' } })
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => {
      expect(screen.getByText(/please set a check-out date/i)).toBeInTheDocument()
    })
  })

  it('shows error when checkout is not after checkin', async () => {
    renderModal()
    await fillForm(user, 'Grand', '2025-08-07', '2025-08-01')
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => {
      expect(screen.getByText(/check-out must be after check-in/i)).toBeInTheDocument()
    })
  })

  it('shows overlap error when dates conflict with existing hotel', async () => {
    const existing = { id: 'h0', name: 'Other Hotel', checkIn: '2025-08-05T00:00:00.000Z', checkOut: '2025-08-10T00:00:00.000Z' }
    renderModal({ hotels: [existing] })
    await fillForm(user, 'Grand', '2025-08-01', '2025-08-08')
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => {
      expect(screen.getByText(/overlap/i)).toBeInTheDocument()
    })
  })

  it('calls onSave with correct data on valid submission', async () => {
    renderModal()
    await fillForm(user)
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledTimes(1)
    })
    const arg = defaultProps.onSave.mock.calls[0][0]
    expect(arg.name).toBe('Grand Hotel')
    expect(arg.checkIn).toContain('2025-08-01')
    expect(arg.checkOut).toContain('2025-08-07')
  })

  it('includes id in payload when editing', async () => {
    const editing = { id: 'h1', name: 'Old Name', checkIn: '2025-08-01T00:00:00.000Z', checkOut: '2025-08-07T00:00:00.000Z' }
    renderModal({ editing })
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledTimes(1)
    })
    expect(defaultProps.onSave.mock.calls[0][0].id).toBe('h1')
  })

  it('calls onClose when Cancel is clicked', async () => {
    renderModal()
    await user.click(screen.getByText('Cancel'))
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })
})
