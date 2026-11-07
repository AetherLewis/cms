<<<<<<< HEAD
import React from 'react'
import { clsx } from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-sm',
  secondary:
    'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700',
  danger:
    'bg-red-500 text-white hover:bg-red-600 shadow-sm',
  ghost:
    'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
}

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
=======
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'danger'
  size?: 'sm' | 'icon'
  asChild?: boolean
  children: ReactNode
}

export function Button({ variant = 'primary', size, asChild, className = '', children, ...props }: Props) {
  const styles = {
    primary: 'bg-star-600 text-white hover:bg-star-700',
    outline: 'border border-star-200 bg-white text-star-700 hover:bg-star-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }[variant]
  const sizing = size === 'icon' ? 'h-9 w-9 p-0' : size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'
  const classes = `inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${sizing} ${className}`
  if (asChild) return <Link className={classes} {...(props as LinkProps)}>{children}</Link>
  return <button className={classes} {...props}>{children}</button>
}
>>>>>>> bd369c0752ce6d7f9d8d853b1fa14164b6f2c7e2
