import React from 'react'
import { clsx } from 'clsx'

type InputVariant = 'primary' | 'secondary' | 'danger'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant
  type?: string
  children?: React.ReactNode
}

export function Input({
  variant = 'primary',
  type = 'text',
  className,
  ...props
}: InputProps) {
  const baseClasses = 'block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm placeholder-slate-400 dark:placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClasses: Record<InputVariant, string> = {
    primary: '',
    secondary: 'border-slate-500 dark:border-slate-400',
    danger: 'border-red-500 dark:border-red-400',
  }

  return (
    <input
      type={type}
      className={clsx(baseClasses, variantClasses[variant], className)}
      {...props}
    />
  )
}