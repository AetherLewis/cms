import React from 'react'
import { clsx } from 'clsx'

type TextareaVariant = 'primary' | 'secondary'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: TextareaVariant
}

export function Textarea({
  variant = 'primary',
  className,
  ...props
}: TextareaProps) {
  const baseClasses =
    'block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed resize-y'

  const variantClasses: Record<TextareaVariant, string> = {
    primary: '',
    secondary: 'border-slate-500 dark:border-slate-400',
  }

  return (
    <textarea
      className={clsx(baseClasses, variantClasses[variant], className)}
      {...props}
    />
  )
}