import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { toast } from 'react-hot-toast'
import { Mail, Lock, ArrowRight, UserPlus, ShieldCheck } from 'lucide-react'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      localStorage.setItem('starcore_token', 'true')
      toast.success('Welcome back')
      navigate('/')
    } catch (err: any) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      toast.success('Account created — please sign in')
    } catch (err: any) {
      toast.error(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-star-100 to-star-200 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-star-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg shadow-star-600/20">
            SC
          </div>
          <h1 className="text-3xl font-bold text-star-900">StarCore CMS</h1>
          <p className="text-star-500 mt-2">Contracts • Invoices • Payments • All in one place</p>
        </div>

        <div className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-star-700">Email address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-white border border-star-200 rounded-xl text-star-900 focus:ring-2 focus:ring-star-600 focus:border-transparent outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-star-700">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-white border border-star-200 rounded-xl text-star-900 focus:ring-2 focus:ring-star-600 focus:border-transparent outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-star-600 text-white rounded-xl font-semibold transition-all hover:bg-star-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : <><ArrowRight className="w-4 h-4" /> Sign in</>}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-star-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-star-400">Or continue with</span>
            </div>
          </div>

          <div className="relative flex flex-col gap-4 mt-4">
            <button
              onClick={handleSignup}
              className="py-3 border border-star-200 rounded-xl text-star-600 font-semibold flex items-center justify-center gap-2 hover:bg-star-50 transition-all"
            >
              <UserPlus className="w-4 h-4" /> Create account
            </button>
            <div className="flex items-center justify-center gap-2 text-xs text-star-400">
              <ShieldCheck className="w-3 h-3" />
              <span>Data encrypted &amp; RLS-protected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
