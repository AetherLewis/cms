import type { ReactNode } from 'react'

export function DetailRow({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub?: string }) {
  return <div className="flex gap-3"><div>{icon}</div><div><p className="text-xs text-star-500">{label}</p><p className="font-medium text-star-900">{value}</p>{sub && <p className="text-xs text-star-500">{sub}</p>}</div></div>
}

export function SummaryStatistic() { return null }
export function ActionButtons() { return null }
