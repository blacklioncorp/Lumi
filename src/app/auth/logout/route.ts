import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();

  // Sign out from Supabase Auth
  await supabase.auth.signOut();

  // Redirect to login page
  const url = new URL(request.url);
  return NextResponse.redirect(`${url.origin}/login`, {
    status: 303, // Redirect status for POST responses
  });
}
