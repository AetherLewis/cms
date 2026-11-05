import type { InputHTMLAttributes } from 'react'

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`rounded-lg border border-star-200 bg-white px-3 py-2 text-sm text-star-900 outline-none focus:ring-2 focus:ring-star-600 ${className}`} {...props} />
}
