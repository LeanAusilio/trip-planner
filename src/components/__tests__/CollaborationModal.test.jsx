import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CollaborationModal from '../CollaborationModal'

const defaults = {
  isCollaborating: false,
  tripCode: null,
  syncStatus: 'idle',
  onStartSharing: vi.fn(),
  onJoinTrip: vi.fn(),
  onStopSharing: vi.fn(),
  onClose: vi.fn(),
}

beforeEach(() => vi.clearAllMocks())

const renderModal = (props = {}) =>
  render(<CollaborationModal {...defaults} {...props} />)

// ── Not collaborating ─────────────────────────────────────────────────────

describe('Not collaborating', () => {
  it('renders the modal', () => {
    renderModal()
    expect(screen.getByTestId('collaboration-modal')).toBeInTheDocument()
  })

  it('shows "Start sharing" and "Join with a code" buttons', () => {
    renderModal()
    expect(screen.getByTestId('start-sharing-button')).toBeInTheDocument()
    expect(screen.getByTestId('join-code-button')).toBeInTheDocument()
  })

  it('calls onStartSharing when start button clicked', async () => {
    defaults.onStartSharing.mockResolvedValue()
    renderModal()
    fireEvent.click(screen.getByTestId('start-sharing-button'))
    expect(defaults.onStartSharing).toHaveBeenCalledOnce()
  })

  it('shows join input after clicking "Join with a code"', () => {
    renderModal()
    fireEvent.click(screen.getByTestId('join-code-button'))
    expect(screen.getByTestId('join-code-input')).toBeInTheDocument()
  })

  it('join submit is disabled until 6 chars entered', () => {
    renderModal()
    fireEvent.click(screen.getByTestId('join-code-button'))
    expect(screen.getByTestId('join-submit-button')).toBeDisabled()
    fireEvent.change(screen.getByTestId('join-code-input'), { target: { value: 'ABC123' } })
    expect(screen.getByTestId('join-submit-button')).not.toBeDisabled()
  })

  it('calls onJoinTrip with uppercased code on submit', async () => {
    defaults.onJoinTrip.mockResolvedValue()
    renderModal()
    fireEvent.click(screen.getByTestId('join-code-button'))
    fireEvent.change(screen.getByTestId('join-code-input'), { target: { value: 'abc123' } })
    fireEvent.click(screen.getByTestId('join-submit-button'))
    expect(defaults.onJoinTrip).toHaveBeenCalledWith('ABC123')
  })

  it('shows error message when onJoinTrip rejects', async () => {
    defaults.onJoinTrip.mockRejectedValue(new Error('Trip not found'))
    renderModal()
    fireEvent.click(screen.getByTestId('join-code-button'))
    fireEvent.change(screen.getByTestId('join-code-input'), { target: { value: 'ZZZZZZ' } })
    fireEvent.click(screen.getByTestId('join-submit-button'))
    await screen.findByTestId('collab-error')
    expect(screen.getByTestId('collab-error')).toHaveTextContent('Trip not found')
  })

  it('calls onClose when backdrop clicked', () => {
    render(<CollaborationModal {...defaults} />)
    // The outer div is the backdrop
    fireEvent.click(document.querySelector('[data-testid="collaboration-modal"]').parentElement)
    expect(defaults.onClose).toHaveBeenCalledOnce()
  })
})

// ── Collaborating ─────────────────────────────────────────────────────────

describe('Collaborating', () => {
  const collabProps = { isCollaborating: true, tripCode: 'XK7M2P', syncStatus: 'synced' }

  it('shows the trip code', () => {
    renderModal(collabProps)
    expect(screen.getByText('XK7M2P')).toBeInTheDocument()
  })

  it('shows the copy button', () => {
    renderModal(collabProps)
    expect(screen.getByTestId('copy-code-button')).toBeInTheDocument()
  })

  it('shows correct sync dot colour for each status', () => {
    const { rerender } = renderModal({ ...collabProps, syncStatus: 'syncing' })
    expect(screen.getByTestId('sync-dot')).toHaveStyle({ background: '#f59e0b' })

    rerender(<CollaborationModal {...defaults} {...collabProps} syncStatus="synced" />)
    expect(screen.getByTestId('sync-dot')).toHaveStyle({ background: '#22c55e' })

    rerender(<CollaborationModal {...defaults} {...collabProps} syncStatus="error" />)
    expect(screen.getByTestId('sync-dot')).toHaveStyle({ background: '#ef4444' })
  })

  it('calls onStopSharing when "Stop sharing" clicked', () => {
    renderModal(collabProps)
    fireEvent.click(screen.getByText('Stop sharing'))
    expect(defaults.onStopSharing).toHaveBeenCalledOnce()
  })
})
