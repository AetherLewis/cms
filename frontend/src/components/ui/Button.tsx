import { cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'danger'
  size?: 'sm' | 'icon'
  asChild?: boolean
  children: ReactNode
}

export function Button({ variant = 'primary', size, asChild, className = '', children, ...props }: Props) {
  const styles = {
    primary: 'bg-indigo-700 text-white hover:bg-indigo-800 shadow-sm',
    outline: 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }[variant]
  const sizing = size === 'icon' ? 'h-9 w-9 p-0' : size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm'
  const classes = `inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${sizing} ${className}`
  if (asChild && isValidElement(children)) {
    const child = children as React.ReactElement<any>
    return cloneElement(child, {
      ...props,
      className: `${classes} ${child.props.className || ''}`,
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        props.onClick?.(event as any)
        child.props.onClick?.(event)
      },
    })
  }
  return <button className={classes} {...props}>{children}</button>
}
