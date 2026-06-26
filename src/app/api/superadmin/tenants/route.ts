import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Verify superadmin role helper
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

export async function GET() {
  const supabase = createClient();
  const isSuper = await verifySuperAdmin(supabase);
  if (!isSuper) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('*, leads:leads(id), students:students(id, status)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tenants list:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const mapped = (tenants || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      custom_domain: t.custom_domain,
      plan: t.plan,
      active_modules: t.active_modules,
      logo_url: t.logo_url,
      primary_color: t.primary_color,
      secondary_color: t.secondary_color,
      is_active: t.is_active,
      created_at: t.created_at,
      leads_count: t.leads?.length || 0,
      students_count: t.students?.filter((s: any) => s.status === 'active').length || 0
    }));

    return NextResponse.json({ tenants: mapped });
  } catch (err) {
    console.error('Unhandled error in GET tenants:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();
  const isSuper = await verifySuperAdmin(supabase);
  if (!isSuper) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { tenant: tenantData, admin: adminData } = body;

    if (!tenantData || !adminData) {
      return NextResponse.json({ error: 'Faltan datos de tenant o admin' }, { status: 400 });
    }

    const { name, slug, plan, primary_color, secondary_color, custom_domain } = tenantData;
    const { full_name, email, password, phone } = adminData;

    if (!name || !slug || !plan || !full_name || !email || !password) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    // 1. Verify slug uniqueness
    const { data: existingSlug } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existingSlug) {
      return NextResponse.json({ error: 'El slug ya está registrado por otro colegio.' }, { status: 409 });
    }

    // Initialize service role admin client
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Set default active modules based on plan (analytics added to Basic per Note 2)
    let active_modules: string[] = [];
    if (plan === 'basic') {
      active_modules = ['crm', 'website', 'whatsapp', 'google_calendar', 'analytics'];
    } else if (plan === 'intermediate') {
      active_modules = ['crm', 'website', 'whatsapp', 'google_calendar', 'analytics', 'social_media', 'google_sso'];
    } else if (plan === 'premium') {
      active_modules = [
        'crm', 'website', 'whatsapp', 'google_calendar', 'social_media', 'analytics',
        'google_sso', 'payments', 'parent_portal', 'pwa', 'nfc_access', 'safelunch'
      ];
    }

    // 3. Insert tenant record
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name,
        slug,
        plan,
        primary_color: primary_color || '#1E40AF',
        secondary_color: secondary_color || '#F59E0B',
        custom_domain: custom_domain || null,
        active_modules,
        is_active: true
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      console.error('Error inserting tenant:', tenantError);
      return NextResponse.json({ error: 'Error al registrar el colegio en la base de datos.' }, { status: 500 });
    }

    // 4. Create user in Supabase Auth via Admin Client (confirmed, no email validation required)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        tenant_id: tenant.id,
        role: 'school_admin'
      }
    });

    if (authError || !authUser?.user) {
      console.error('Error creating auth user:', authError);
      // Rollback tenant insertion
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id);
      return NextResponse.json({ error: `Error al crear el usuario administrador: ${authError?.message}` }, { status: 500 });
    }

    // 5. Ensure public.users entry is synchronized (with phone)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', authUser.user.id)
      .maybeSingle();

    if (!existingUser) {
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.user.id,
          tenant_id: tenant.id,
          role: 'school_admin',
          full_name,
          email,
          phone: phone || null,
          is_active: true
        });
      
      if (userError) {
        console.error('Error inserting public user:', userError);
      }
    } else {
      // Sync phone number if it wasn't copied by trigger
      const { error: phoneError } = await supabaseAdmin
        .from('users')
        .update({ phone: phone || null })
        .eq('id', authUser.user.id);
      
      if (phoneError) {
        console.error('Error syncing phone on public user:', phoneError);
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lumi-delta-sooty.vercel.app';

    return NextResponse.json({
      tenant,
      user_id: authUser.user.id,
      urls: {
        landing: `${baseUrl}/${tenant.slug}`,
        dashboard: `${baseUrl}/${tenant.slug}/dashboard`,
        login: `${baseUrl}/${tenant.slug}/login`
      }
    });
  } catch (err) {
    console.error('Unhandled error in POST tenants:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
