import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/auth/callback']
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.includes(pathname)

  // Create Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xgiwnrhdduybbuiyquxd.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ZCwEuyyKASPdUosoJ2QEyg_AAX2zHm_'
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Get the session from the request cookies
  const { data: { session }, error } = await supabase.auth.getSession()

  // If no session and trying to access protected route, redirect to login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If session exists and trying to access login/signup, redirect to dashboard or profile setup
  if (session && (pathname === '/login' || pathname === '/signup')) {
    // Check if profile is complete
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('company_name')
        .eq('user_id', session.user.id)
        .single()

      const dashboardUrl = !profileData?.company_name ? '/profile-setup' : '/dashboard'
      return NextResponse.redirect(new URL(dashboardUrl, request.url))
    } catch {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.*|apple-icon.*).*)',
  ],
}
