export function formatCurrency(amount) {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function pluralNights(count) {
  return `${count} night${count !== 1 ? 's' : ''}`
}
