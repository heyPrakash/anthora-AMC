'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const handleCallback = async () => {
      try {
        // Exchange the OAuth code for a session if present in the URL
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('Code exchange error:', error)
            router.replace('/login')
            return
          }
        }

        // Wait for the session to be established
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          // Session not ready yet — listen for the auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              subscription.unsubscribe()
              if (newSession) {
                await redirectAfterLogin(newSession.user.id)
              } else {
                router.replace('/login')
              }
            }
          )
          // Timeout fallback after 8 seconds
          setTimeout(() => {
            subscription.unsubscribe()
            router.replace('/login')
          }, 8000)
          return
        }

        await redirectAfterLogin(session.user.id)
      } catch (error) {
        console.error('Auth callback error:', error)
        router.replace('/login')
      }
    }

    const redirectAfterLogin = async (userId: string) => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_name')
          .eq('id', userId)
          .single()

        if (!profile?.company_name) {
          router.replace('/profile-setup')
        } else {
          router.replace('/')
        }
      } catch {
        router.replace('/')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '16px',
      fontFamily: 'sans-serif'
    }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #e5e7eb',
        borderTop: '4px solid #29ABE2',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <p style={{ color: '#6b7280', fontSize: '15px' }}>Signing you in...</p>
    </div>
  )
}
