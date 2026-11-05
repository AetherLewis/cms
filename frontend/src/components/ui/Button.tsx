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
