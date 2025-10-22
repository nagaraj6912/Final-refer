import { createSupabaseAdminClient } from '@/lib/supabaseClient';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { upiId } = await request.json();

  if (!upiId) {
    return NextResponse.json({ error: 'UPI ID is required' }, { status: 400 });
  }

  // Get the current user's session from their cookies
  const cookieStore = cookies();
  const supabase = createSupabaseBrowserClient();
  
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use the SUPABASE_SERVICE_ROLE_KEY to update user_metadata
  // This is required because RLS policies often restrict this table.
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    session.user.id,
    { user_metadata: { upi_id: upiId } } // Save UPI ID to metadata
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'UPI ID updated successfully.' });
}