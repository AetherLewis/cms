import type { SelectHTMLAttributes } from 'react'

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`rounded-lg border border-star-200 bg-white px-3 py-2 text-sm text-star-900 outline-none focus:ring-2 focus:ring-star-600 ${className}`} {...props} />
}
