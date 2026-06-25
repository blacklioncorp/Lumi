import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth';

/**
 * PATCH /api/cms/tenant/settings
 * Actualiza la configuración básica y branding (colores, logo, nombre) del tenant.
 * Solo permitido para school_admin y superadmin.
 */
export async function PATCH(request: Request) {
  try {
    // 1. Verificar autenticación del usuario
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo permitido para school_admin y superadmin
    if (user.user_role !== 'school_admin' && user.user_role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Solo administradores pueden cambiar la configuración del colegio.' },
        { status: 403 }
      );
    }

    // 2. Extraer tenant de los headers
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Falta el contexto del colegio (tenant_id)' }, { status: 400 });
    }

    // Aislamiento: El usuario debe pertenecer al tenant especificado (excepto superadmin)
    if (user.user_role !== 'superadmin' && user.tenant_id !== tenantId) {
      return NextResponse.json(
        { error: 'Acceso denegado. No puedes modificar la configuración de otro colegio.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const supabase = createAdminClient();

    // 3. Preparar campos de actualización
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) {
      updateData.name = body.name;
    }
    if (body.logo_url !== undefined) {
      updateData.logo_url = body.logo_url || null;
    }
    if (body.primary_color !== undefined) {
      updateData.primary_color = body.primary_color;
    }
    if (body.secondary_color !== undefined) {
      updateData.secondary_color = body.secondary_color;
    }
    if (body.timezone !== undefined) {
      updateData.timezone = body.timezone;
    }

    // 4. Actualizar en Supabase
    const { data: updatedTenant, error: updateError } = await (supabase as any)
      .from('tenants')
      .update(updateData)
      .eq('id', tenantId)
      .select()
      .single();

    if (updateError) {
      console.error('Error actualizando configuración del tenant:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedTenant);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error en PATCH /api/cms/tenant/settings:', msg);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
