import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth';

/**
 * PATCH /api/cms/tenant/integrations
 * Actualiza las integraciones y dominio del tenant.
 */
export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (user.user_role !== 'school_admin' && user.user_role !== 'superadmin') {
      return NextResponse.json({ error: 'Permisos insuficientes.' }, { status: 403 });
    }

    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Falta tenant_id' }, { status: 400 });
    }

    if (user.user_role !== 'superadmin' && user.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
    }

    const body = await request.json();
    const supabase = createAdminClient();

    // 1. Actualizar custom_domain en la tabla tenants
    if (body.custom_domain !== undefined) {
      const { error: tenantError } = await (supabase as any)
        .from('tenants')
        .update({
          custom_domain: body.custom_domain || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (tenantError) {
        return NextResponse.json({ error: tenantError.message }, { status: 500 });
      }
    }

    // 2. Upsert en tenant_integrations
    const integrationData = {
      tenant_id: tenantId,
      whatsapp_number: body.whatsapp_number,
      whatsapp_message_template: body.whatsapp_message_template,
      google_calendar_email: body.google_calendar_email,
      facebook_url: body.facebook_url,
      instagram_url: body.instagram_url,
      tiktok_url: body.tiktok_url,
      youtube_url: body.youtube_url,
      updated_at: new Date().toISOString()
    };

    // Upsert on tenant_id constraint
    const { error: upsertError } = await (supabase as any)
      .from('tenant_integrations')
      .upsert(integrationData, { onConflict: 'tenant_id' });

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
