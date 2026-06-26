import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

import { MODULES_BY_PLAN } from '@/lib/modules';

async function verifySuperAdmin(supabase: any) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return false;
  
  try {
    const base64Url = session.access_token.split('.')[1];
    if (!base64Url) return false;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const jwt = JSON.parse(jsonPayload);
    return jwt?.user_role === 'superadmin';
  } catch {
    return false;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
  const supabase = createClient();
  const isSuper = await verifySuperAdmin(supabase);
  if (!isSuper) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, plan, primary_color, secondary_color, custom_domain, is_active } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (plan !== undefined) {
      updateData.plan = plan;
      if (plan === 'basic' || plan === 'intermediate' || plan === 'premium') {
        updateData.active_modules = MODULES_BY_PLAN[plan as keyof typeof MODULES_BY_PLAN];
      }
    }
    if (primary_color !== undefined) updateData.primary_color = primary_color;
    if (secondary_color !== undefined) updateData.secondary_color = secondary_color;
    if (custom_domain !== undefined) updateData.custom_domain = custom_domain || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: tenant, error } = await (supabase as any)
      .from('tenants')
      .update(updateData)
      .eq('id', params.tenantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating tenant details:', error);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    return NextResponse.json({ tenant });
  } catch (err) {
    console.error('Unhandled error in PATCH tenant:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
  const supabase = createClient();
  const isSuper = await verifySuperAdmin(supabase);
  if (!isSuper) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { data: tenant, error } = await (supabase as any)
      .from('tenants')
      .update({ is_active: false })
      .eq('id', params.tenantId)
      .select()
      .single();

    if (error) {
      console.error('Error soft deleting tenant:', error);
      return NextResponse.json({ error: 'Database delete failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, tenant });
  } catch (err) {
    console.error('Unhandled error in DELETE tenant:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
