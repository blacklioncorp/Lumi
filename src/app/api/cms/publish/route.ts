import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withTenantGuard } from '@/lib/auth';

/**
 * POST /api/cms/publish
 * Marca todos los bloques de contenido correspondientes a este tenant como publicados (published = true).
 */
export const POST = withTenantGuard(async (request, _context) => {
  const tenantId = request.headers.get('x-tenant-id');
  const supabase = createAdminClient();

  // Actualizar todos los bloques del tenant a published = true
  const { error, data } = await (supabase as any)
    .from('content_blocks')
    .update({ published: true, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .select('id');

  if (error) {
    console.error('Error publicando bloques:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const count = data ? data.length : 0;
  return NextResponse.json({ success: true, count });
});
