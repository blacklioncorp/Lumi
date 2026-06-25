import React from 'react';
import { getTenantFromHeaders } from '@/lib/tenant';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth';
import CMSEditor from './_components/CMSEditor';
import { ContentBlock } from '@/types/database';

export default async function DashboardContentPage() {
  // 1. Verificar autenticación (solo school_admin y editor)
  const user = await requireRole(['school_admin', 'editor']);

  // 2. Obtener el tenant configurado en los headers por el middleware
  const { tenant } = getTenantFromHeaders();
  if (!tenant) return null;

  // 3. Consultar todos los bloques de contenido (publicados y borradores)
  const supabaseAdmin = createAdminClient();
  let blocks: ContentBlock[] = [];

  try {
    const { data, error } = await (supabaseAdmin as any)
      .from('content_blocks')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('order_index', { ascending: true });

    if (!error && data) {
      blocks = data as ContentBlock[];
    }
  } catch (err) {
    console.error('Failed to load content blocks:', err);
  }

  // 4. Adaptar configuración de tenant para pasar al editor
  const tenantConfig = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    logo_url: tenant.logo_url,
    primary_color: tenant.primary_color,
    secondary_color: tenant.secondary_color,
    active_modules: tenant.active_modules,
    timezone: tenant.timezone,
  };

  return (
    <CMSEditor
      config={tenantConfig}
      initialBlocks={blocks}
      userRole={user.user_role || 'editor'}
    />
  );
}
