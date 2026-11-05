type Props = { status?: string; type?: string; label?: string }

export function Badge({ status, type, label }: Props) {
  const value = label || status || type || '—'
  const tone = status === 'paid' || status === 'active' ? 'bg-emerald-100 text-emerald-700' : status === 'overdue' || status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-star-100 text-star-700'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}>{value.replace('_', ' ')}</span>
}
