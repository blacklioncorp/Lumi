import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withTenantGuard } from '@/lib/auth';

/**
 * PATCH /api/cms/blocks/reorder
 * Actualiza el order_index de múltiples bloques en una sola operación lote,
 * previa verificación de pertenencia al tenant.
 */
export const PATCH = withTenantGuard(async (request, _context) => {
  const tenantId = request.headers.get('x-tenant-id');
  const body = await request.json();

  if (!body.blocks || !Array.isArray(body.blocks)) {
    return NextResponse.json(
      { error: 'Formato inválido. Se requiere un arreglo de bloques con id y order_index.' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const blockUpdates: { id: string; order_index: number }[] = body.blocks;
  const ids = blockUpdates.map((b) => b.id);

  if (ids.length === 0) {
    return NextResponse.json({ success: true });
  }

  // 1. Obtener todos los bloques involucrados y comprobar que existen y pertenecen al tenant
  const { data: verifiedBlocks, error: checkError } = await (supabase as any)
    .from('content_blocks')
    .select('id, tenant_id')
    .in('id', ids);

  if (checkError || !verifiedBlocks || verifiedBlocks.length !== ids.length) {
    return NextResponse.json(
      { error: 'Algunos bloques especificados no existen o la consulta falló.' },
      { status: 400 }
    );
  }

  const hasMismatchedTenant = verifiedBlocks.some((b: any) => b.tenant_id !== tenantId);
  if (hasMismatchedTenant) {
    return NextResponse.json(
      { error: 'Acceso denegado. Uno o más bloques no pertenecen a este colegio.' },
      { status: 403 }
    );
  }

  // 2. Ejecutar las actualizaciones en paralelo (o secuencialmente)
  const updatePromises = blockUpdates.map((block) =>
    (supabase as any)
      .from('content_blocks')
      .update({ order_index: block.order_index, updated_at: new Date().toISOString() })
      .eq('id', block.id)
  );

  const results = await Promise.all(updatePromises);
  const failedUpdate = results.find((r) => r.error);

  if (failedUpdate) {
    console.error('Error durante la reordenación:', failedUpdate.error);
    return NextResponse.json(
      { error: 'Fallo al actualizar el orden de algunos bloques.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
});
