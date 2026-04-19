import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PackingList from '../PackingList'

const makeItem = (overrides = {}) => ({
  id: crypto.randomUUID(),
  text: 'Passport',
  checked: false,
  ...overrides,
})

const defaultProps = {
  items: [],
  onAdd: vi.fn(),
  onToggle: vi.fn(),
  onDelete: vi.fn(),
  onClearChecked: vi.fn(),
  dark: false,
}

describe('PackingList', () => {
  let user
  beforeEach(() => {
    user = userEvent.setup()
    Object.values(defaultProps).forEach((v) => typeof v === 'function' && v.mockReset?.())
  })

  it('renders Packing List heading', () => {
    render(<PackingList {...defaultProps} />)
    expect(screen.getByText('Packing List')).toBeInTheDocument()
  })

  it('renders items', () => {
    const items = [makeItem({ text: 'Passport' }), makeItem({ text: 'Sunscreen' })]
    render(<PackingList {...defaultProps} items={items} />)
    expect(screen.getByText('Passport')).toBeInTheDocument()
    expect(screen.getByText('Sunscreen')).toBeInTheDocument()
  })

  it('shows item count when items exist', () => {
    const items = [makeItem({ text: 'A' }), makeItem({ text: 'B', checked: true })]
    render(<PackingList {...defaultProps} items={items} />)
    expect(screen.getByText('1/2')).toBeInTheDocument()
  })

  it('calls onAdd when Add button is clicked', async () => {
    render(<PackingList {...defaultProps} />)
    const input = screen.getByPlaceholderText('Add an item…')
    await user.type(input, 'Sunscreen')
    await user.click(screen.getByText('Add'))
    expect(defaultProps.onAdd).toHaveBeenCalledWith('Sunscreen')
  })

  it('calls onAdd when Enter is pressed', async () => {
    render(<PackingList {...defaultProps} />)
    const input = screen.getByPlaceholderText('Add an item…')
    await user.type(input, 'Sunscreen{Enter}')
    expect(defaultProps.onAdd).toHaveBeenCalledWith('Sunscreen')
  })

  it('does not call onAdd with empty input', async () => {
    render(<PackingList {...defaultProps} />)
    await user.click(screen.getByText('Add'))
    expect(defaultProps.onAdd).not.toHaveBeenCalled()
  })

  it('does not call onAdd with whitespace-only input', async () => {
    render(<PackingList {...defaultProps} />)
    const input = screen.getByPlaceholderText('Add an item…')
    await user.type(input, '   {Enter}')
    expect(defaultProps.onAdd).not.toHaveBeenCalled()
  })

  it('clears input after adding', async () => {
    render(<PackingList {...defaultProps} />)
    const input = screen.getByPlaceholderText('Add an item…')
    await user.type(input, 'Sunscreen')
    await user.click(screen.getByText('Add'))
    expect(input).toHaveValue('')
  })

  it('calls onToggle when checkbox is clicked', async () => {
    const item = makeItem({ id: 'item-1', text: 'Passport' })
    render(<PackingList {...defaultProps} items={[item]} />)
    const checkboxes = screen.getAllByRole('button')
    // First button is the checkbox (not Add or delete)
    await user.click(checkboxes[0])
    expect(defaultProps.onToggle).toHaveBeenCalledWith('item-1')
  })

  it('shows strikethrough for checked items', () => {
    const item = makeItem({ text: 'Passport', checked: true })
    render(<PackingList {...defaultProps} items={[item]} />)
    const text = screen.getByText('Passport')
    expect(text).toHaveClass('line-through')
  })

  it('shows Clear checked button only when there are checked items', () => {
    const { rerender } = render(<PackingList {...defaultProps} items={[makeItem()]} />)
    expect(screen.queryByText('Clear checked')).not.toBeInTheDocument()

    rerender(<PackingList {...defaultProps} items={[makeItem({ checked: true })]} />)
    expect(screen.getByText('Clear checked')).toBeInTheDocument()
  })

  it('calls onClearChecked when Clear checked is clicked', async () => {
    const item = makeItem({ checked: true })
    render(<PackingList {...defaultProps} items={[item]} />)
    await user.click(screen.getByText('Clear checked'))
    expect(defaultProps.onClearChecked).toHaveBeenCalledTimes(1)
  })

  it('toggles open/closed when header is clicked', async () => {
    const items = [makeItem({ text: 'Passport' })]
    render(<PackingList {...defaultProps} items={items} />)
    expect(screen.getByText('Passport')).toBeInTheDocument()

    // Click the header to collapse
    await user.click(screen.getByText('Packing List').closest('[class*="cursor-pointer"]'))
    expect(screen.queryByText('Passport')).not.toBeInTheDocument()
  })
})
