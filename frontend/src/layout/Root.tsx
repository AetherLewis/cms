import { Outlet, useLocation } from 'react-router-dom'
import { RootLayout } from './RootLayout'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'

export function Root() {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Redirect unauthenticated users to login (except login page itself)
  useEffect(() => {
    if (!loading && !user && location.pathname !== '/login') {
      window.location.replace('/login')
    }
  }, [loading, user, location.pathname])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-star-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-star-600 font-medium">Loading StarCore...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-star-100">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-star-100">
          <Outlet context={{ loginPage: true }} />
        </div>
      </div>
    )
  }

  return <RootLayout><Outlet /></RootLayout>
}
