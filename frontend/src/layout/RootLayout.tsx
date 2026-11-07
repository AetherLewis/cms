import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  FolderOpen,
  FileSearch,
  Settings,
  LogOut,
  BarChart,
  ShieldCheck,
} from 'lucide-react'

export function RootLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/clients', label: 'Clients', icon: Users },
    { to: '/contracts', label: 'Contracts', icon: FileText },
    { to: '/invoices', label: 'Invoices', icon: FileText },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/documents', label: 'Documents', icon: FolderOpen },
    { to: '/recurring', label: 'Recurring', icon: FileSearch },
    { to: '/reports', label: 'Reports', icon: BarChart },
    { to: '/audit', label: 'Audit Log', icon: ShieldCheck },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <header className="border-b border-[#e2e8f0] bg-white sticky top-0 z-20">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3 lg:px-8">
          <NavLink
            to="/"
            className="flex shrink-0 items-center gap-2 font-bold text-lg tracking-tight text-slate-900 hover:text-indigo-700"
            end
          >
            <div className="w-8 h-8 bg-indigo-700 rounded-md flex items-center justify-center text-white font-bold text-sm">
              SC
            </div>
            <span>StarCore CMS</span>
          </NavLink>

          <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto pb-0.5 lg:order-none lg:w-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive ? 'bg-indigo-50 text-indigo-800 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 pl-3">
              <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-star-900">{user?.full_name || user?.email}</div>
                <div className="text-xs text-star-500 capitalize">{user?.role}</div>
              </div>
              <button
                onClick={() => logout()}
                className="text-xs text-slate-500 hover:text-red-600 font-medium"
              >
                Sign out
              </button>
            </div>
            <button onClick={() => logout()} className="md:hidden p-2 text-red-500 hover:bg-red-50 rounded-lg">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  )
}
