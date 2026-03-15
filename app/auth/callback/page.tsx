'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/ui/spinner'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError

        if (session) {
          // Check if user has completed profile setup
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('company_name')
            .eq('user_id', session.user.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError
          }

          // If no profile or empty company_name, redirect to setup
          if (!profileData || !profileData.company_name) {
            router.push('/profile-setup')
          } else {
            router.push('/dashboard')
          }
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        router.push('/login')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary">
      <div className="text-center space-y-4">
        <Spinner className="h-12 w-12 mx-auto" />
        <p className="text-lg text-foreground">Logging you in...</p>
      </div>
    </div>
  )
}
