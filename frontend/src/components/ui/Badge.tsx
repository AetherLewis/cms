type Props = { status?: string; type?: string; label?: string }

export function Badge({ status, type, label }: Props) {
  const value = label || status || type || '—'
  const tone = status === 'paid' || status === 'active' || status === 'completed'
    ? 'bg-emerald-50 text-emerald-700'
    : status === 'overdue' || status === 'cancelled' || status === 'expired'
      ? 'bg-red-50 text-red-700'
      : status === 'sent'
        ? 'bg-indigo-50 text-indigo-700'
        : status === 'draft'
          ? 'bg-slate-100 text-slate-600'
          : 'bg-amber-50 text-amber-700'

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}>
      {value.replace('_', ' ')}
    </span>
  )
}
