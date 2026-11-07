import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'react-hot-toast'
import { supabase } from '../utils/supabase'

export interface User {
  id: string
  email: string
  full_name?: string
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        localStorage.setItem('starcore_token', data.session.access_token)
        setUser({
          id: data.session.user.id,
          email: data.session.user.email ?? '',
          full_name: data.session.user.user_metadata?.full_name,
          role: (data.session.user.user_metadata?.role as string) || 'viewer',
        })
      }
      setLoading(false)
    }
    checkSession()

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (session.access_token) localStorage.setItem('starcore_token', session.access_token)
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          full_name: session.user.user_metadata?.full_name,
          role: (session.user.user_metadata?.role as string) || 'viewer',
        })
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        // Supabase owns session persistence and token refresh.
      }
    })
    return () => sub?.subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.session?.user) {
      localStorage.setItem('starcore_token', data.session.access_token)
      setUser({
        id: data.session.user.id,
        email: data.session.user.email ?? '',
        full_name: data.session.user.user_metadata?.full_name,
        role: (data.session.user.user_metadata?.role as string) || 'viewer',
      })
    }
  }

  const signup = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    toast.success('Account created — please sign in')
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    localStorage.removeItem('starcore_token')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
