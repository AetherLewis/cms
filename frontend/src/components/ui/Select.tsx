import React from 'react'
import { clsx } from 'clsx'

type SelectVariant = 'primary' | 'secondary'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: SelectVariant
  children?: React.ReactNode
}

export function Select({
  variant = 'primary',
  className,
  children,
  ...props
}: SelectProps) {
  const baseClasses =
    'block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

  const variantClasses: Record<SelectVariant, string> = {
    primary: '',
    secondary: 'border-slate-500 dark:border-slate-400',
  }

  return (
    <select
      className={clsx(baseClasses, variantClasses[variant], className)}
      {...props}
    >
      {children}
    </select>
  )
}