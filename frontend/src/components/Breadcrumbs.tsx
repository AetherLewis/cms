<<<<<<< HEAD
import React from 'react'

interface BreadcrumbsProps {
  items: { label: string; path?: string }[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400"
    >
      {items.map((item, index) => (
        <span
          key={item.label}
          className="flex items-center"
        >
          {index > 0 && (
            <span className="mx-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-1"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </span>
          )}
          {item.path ? (
            <a
              href={item.path}
              className="hover:text-indigo-500 transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
=======
import { Link } from 'react-router-dom'

export function Breadcrumbs({ path, onHome }: { path: { label: string }[]; onHome?: () => void }) {
  return <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-star-500"><Link to="/" onClick={onHome} className="hover:text-star-700">Home</Link>{path.map((item, index) => <span key={`${item.label}-${index}`}>/ {item.label}</span>)}</nav>
}
>>>>>>> bd369c0752ce6d7f9d8d853b1fa14164b6f2c7e2
