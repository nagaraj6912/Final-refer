import { createSupabaseAdminClient } from '@/lib/supabaseClient';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient'; // We'll create this next

// This is a Server Component. It runs on the server first.
export default async function AdminPage() {
  const cookieStore = cookies();
  
  // 1. Get the current user's session
  const supabase = createSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // 2. If no user, redirect to home
    redirect('/');
  }

  // 3. Check if the user is in the 'admin_users' table
  //    We MUST use the admin client for this.
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: admin, error } = await supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('user_id', session.user.id)
    .single();

  if (error || !admin) {
    // 4. If not an admin, redirect to home
    console.warn('Non-admin user tried to access /admin');
    redirect('/');
  }

  // 5. If successful, render the client component
  //    (We pass the apps and clicks data down)
  const { data: apps } = await supabase.from('Referstore').select('*');
  const { data: clicks } = await supabase.from('referral_clicks').select('*').order('timestamp', { ascending: false }).limit(20);

  return (
    <AdminDashboardClient 
      initialApps={apps || []} 
      initialClicks={clicks || []} 
    />
  );
}