export const formatCurrency = (n?: number | null) => {
  const amount = Number(n) || 0
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount)
}

export const currency = formatCurrency

export const formatDate = (d?: string | null, short = true) => {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: short ? 'short' : 'long',
    day: 'numeric',
  })
}

export const formatMonthYear = (d: string) => {
  const dt = new Date(d + '-01')
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}
