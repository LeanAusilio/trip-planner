export function formatCurrency(n: number | null | undefined): string {
  if (n == null) return '0'
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
