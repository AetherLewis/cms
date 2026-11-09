import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  FolderOpen,
  Settings,
  LogOut,
  BarChart,
  ShieldCheck,
  Repeat,
  Search,
  Bell,
  ChevronDown,
} from 'lucide-react'

export function RootLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const [search, setSearch] = useState('')
  const adminItems = [
    { to: '/reports', label: 'Reports', icon: BarChart },
    { to: '/audit', label: 'Audit log', icon: ShieldCheck },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/clients', label: 'Clients', icon: Users },
    { to: '/contracts', label: 'Contracts', icon: FileText },
    { to: '/invoices', label: 'Invoices', icon: FileText },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/recurring', label: 'Recurring', icon: Repeat },
    { to: '/documents', label: 'Documents', icon: FolderOpen },
  ]
  const searchableItems = [...navItems, ...adminItems]

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <div className="min-h-screen lg:flex">
        <aside className="flex w-full shrink-0 flex-col border-b border-slate-200/80 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-[248px] lg:border-b-0 lg:border-r">
          <NavLink to="/" className="flex items-center gap-3 border-b border-slate-100 px-5 py-5" end>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-700 text-sm font-bold text-white">SC</span>
            <span><span className="block text-sm font-bold tracking-tight text-slate-900">StarCore</span><span className="block text-xs text-slate-500">Operations Suite</span></span>
          </NavLink>
          <div className="px-4 pt-5"><p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? 'bg-indigo-50 text-indigo-800 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
          </div>
          <div className="mt-5 border-t border-slate-100 px-4 pt-4"><p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Administration</p><nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">{[
            { to: '/reports', label: 'Reports', icon: BarChart }, { to: '/audit', label: 'Audit log', icon: ShieldCheck }, { to: '/settings', label: 'Settings', icon: Settings },
          ].map((item) => { const Icon = item.icon; return <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-800' : 'text-slate-600 hover:bg-slate-50'}`}><Icon className="h-4 w-4" />{item.label}</NavLink> })}</nav></div>
          <div className="mt-auto hidden border-t border-slate-100 p-4 lg:block"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{user?.full_name || user?.email}</span><span className="block text-xs capitalize text-slate-500">{user?.role || 'Member'}</span></span><button onClick={() => logout()} title="Sign out" className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><LogOut className="h-4 w-4" /></button></div></div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="relative hidden w-full max-w-md sm:block"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search workspace pages" className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />{search && <div className="absolute left-0 right-0 top-11 z-30 rounded-md border border-slate-200 bg-white p-1 shadow-xl">{searchableItems.filter((item) => item.label.toLowerCase().includes(search.toLowerCase())).map((item) => <NavLink key={item.to} onClick={() => setSearch('')} to={item.to} className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50">{item.label}</NavLink>)}{!searchableItems.some((item) => item.label.toLowerCase().includes(search.toLowerCase())) && <p className="px-3 py-2 text-sm text-slate-400">No matching pages</p>}</div>}</div>
            <div className="ml-auto flex items-center gap-3"><NavLink to="/audit" title="View audit activity" className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100"><Bell className="h-4 w-4" /></NavLink><button onClick={() => logout()} title="Sign out" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-red-50 hover:text-red-700"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-800">{user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}</span><span className="hidden sm:inline">{user?.full_name || user?.email}</span><ChevronDown className="h-3.5 w-3.5" /></button></div>
          </header>
          <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
