'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, signInWithGoogle } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleEmailLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth
        .signInWithPassword({ email, password })
      if (error) throw error
      if (data.session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_name')
          .eq('id', data.session.user.id)
          .single()
        if (!profile?.company_name) {
          router.push('/profile-setup')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (error) {
      const msg = error instanceof Error 
        ? error.message : 'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center 
      justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            Worxful
          </h1>
          <p className="text-gray-500">
            AMC Management System
          </p>
        </div>
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">
            Sign In
          </h2>
          <form onSubmit={handleEmailLogin} 
            className="space-y-4">
            <div>
              <label className="block text-sm 
                font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full border rounded-md p-3 
                  outline-none focus:border-blue-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm 
                font-medium mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => 
                  setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border rounded-md p-3 
                  outline-none focus:border-blue-500"
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-red-600 text-sm">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white 
                py-3 rounded-md font-medium 
                hover:bg-blue-700">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="my-4 text-center 
            text-gray-400">
            Or
          </div>
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full border py-3 rounded-md 
              font-medium hover:bg-gray-50">
            Sign in with Google
          </button>
          <p className="text-center text-sm 
            text-gray-500 mt-4">
            Don't have an account?{' '}
            <Link href="/signup" 
              className="text-blue-600 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
