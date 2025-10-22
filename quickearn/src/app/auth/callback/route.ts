import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// This is a server-side route
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // 'next' is an optional parameter to redirect after login
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = cookies();
    const supabase = createSupabaseBrowserClient();
    
    // Exchange the auth code for a user session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Successful login, redirect to the dashboard
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If there's an error or no code, redirect to an error page
  // (You can create a /auth-error page later)
  console.error('Auth callback error');
  return NextResponse.redirect(`${origin}/`);
}