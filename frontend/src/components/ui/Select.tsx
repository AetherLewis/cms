<<<<<<< HEAD
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
=======
import type { SelectHTMLAttributes } from 'react'

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`rounded-lg border border-star-200 bg-white px-3 py-2 text-sm text-star-900 outline-none focus:ring-2 focus:ring-star-600 ${className}`} {...props} />
}
>>>>>>> bd369c0752ce6d7f9d8d853b1fa14164b6f2c7e2
