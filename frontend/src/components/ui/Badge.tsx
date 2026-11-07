<<<<<<< HEAD
import React from 'react'
import { clsx } from 'clsx'

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  children: React.ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
  success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  warning:
    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
}

export function Badge({
  variant = 'primary',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium capitalize',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
=======
type Props = { status?: string; type?: string; label?: string }

export function Badge({ status, type, label }: Props) {
  const value = label || status || type || '—'
  const tone = status === 'paid' || status === 'active' ? 'bg-emerald-100 text-emerald-700' : status === 'overdue' || status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-star-100 text-star-700'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}>{value.replace('_', ' ')}</span>
}
>>>>>>> bd369c0752ce6d7f9d8d853b1fa14164b6f2c7e2
