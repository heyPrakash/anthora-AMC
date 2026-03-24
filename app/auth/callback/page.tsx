'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  
  useEffect(() => {
    const handle = async () => {
      try {
        const { data: { session } } = 
          await supabase.auth.getSession()
        
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('company_name')
            .eq('id', session.user.id)
            .single()
          
          if (!profile?.company_name) {
            router.push('/profile-setup')
          } else {
            router.push('/')
          }
        } else {
          router.push('/login')
        }
      } catch (error) {
        router.push('/login')
      }
    }
    handle()
  }, [router])

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #e5e7eb',
        borderTop: '4px solid #2563eb',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}/>
      <p style={{color: '#6b7280'}}>
        Logging you in...
      </p>
    </div>
  )
}
