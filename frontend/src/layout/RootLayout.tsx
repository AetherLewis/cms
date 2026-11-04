import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  FileContract,
  FileText,
  CreditCard,
  FileArrowLeft,
  FileSearch,
  Settings,
  LogOut,
  Plus,
  BookOpen,
  BarChart,
  ShieldCheck,
  Mail,
} from 'lucide-react'

export function RootLayout() {
  const { user, logout } = useAuth()

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/clients', label: 'Clients', icon: Users },
    { to: '/contracts', label: 'Contracts', icon: FileContract },
    { to: '/invoices', label: 'Invoices', icon: FileText },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/documents', label: 'Documents', icon: FileArrowLeft },
    { to: '/recurring', label: 'Recurring', icon: FileSearch },
    { to: '/reports', label: 'Reports', icon: BarChart },
    { to: '/audit', label: 'Audit Log', icon: ShieldCheck },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-star-50">
      <header className="border-b border-star-200 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center justify-between px-6 py-3">
          <NavLink
            to="/"
            className="flex items-center gap-2 font-bold text-xl text-star-700 hover:text-star-600"
            end
          >
            <div className="w-8 h-8 bg-star-600 rounded-lg flex items-center justify-center text-white font-bold">
              SC
            </div>
            <span>StarCore CMS</span>
          </NavLink>

          <nav className="flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-star-600 transition-colors ${
                      isActive ? 'bg-star-100 text-star-600 font-semibold' : 'hover:bg-star-100 hover:text-star-700'
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
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-star-50 rounded-full border border-star-200">
              <div className="w-8 h-8 bg-star-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-star-900">{user?.full_name || user?.email}</div>
                <div className="text-xs text-star-500 capitalize">{user?.role}</div>
              </div>
              <button
                onClick={() => logout()}
                className="text-xs text-red-500 hover:text-red-600 font-medium underline hover:no-underline"
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

      <main className="flex-1 p-6 lg:p-8">{/* children via Outlet */}</main>
    </div>
  )
}
