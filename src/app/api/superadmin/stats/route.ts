import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  
  // Verify superadmin role using the access token role claim
  const { data: { session } } = await supabase.auth.getSession();
  let isSuperAdmin = false;
  
  if (session?.access_token) {
    try {
      const base64Url = session.access_token.split('.')[1];
      if (base64Url) {
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const jwt = JSON.parse(jsonPayload);
        if (jwt?.user_role === 'superadmin') {
          isSuperAdmin = true;
        }
      }
    } catch (e) {
      console.error('Error parsing token in stats API:', e);
    }
  }

  if (!isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden. Requires superadmin role.' }, { status: 403 });
  }

  try {
    const { count: total_tenants } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true });

    const { count: active_tenants } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    // Fetch active tenants' plans to calculate MRR
    const { data: tenantsPlans } = await supabase
      .from('tenants')
      .select('plan')
      .eq('is_active', true);

    let mrr = 0;
    if (tenantsPlans) {
      (tenantsPlans as any[]).forEach((t) => {
        if (t.plan === 'basic') mrr += 800;
        else if (t.plan === 'intermediate') mrr += 2500;
        else if (t.plan === 'premium') mrr += 6000;
      });
    }

    const { count: total_leads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    const { count: total_students } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    return NextResponse.json({
      total_tenants: total_tenants || 0,
      active_tenants: active_tenants || 0,
      mrr,
      total_leads: total_leads || 0,
      total_students: total_students || 0,
    });
  } catch (err) {
    console.error('Error fetching global stats:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
