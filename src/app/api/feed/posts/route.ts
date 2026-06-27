import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { withTenantGuard } from '@/lib/auth';

/**
 * GET /api/feed/posts
 * Lista todas las publicaciones del tenant
 */
export const GET = withTenantGuard(async (request) => {
  const tenantId = request.headers.get('x-tenant-id');
  const supabase = createAdminClient();

  const { data, error } = await (supabase as any)
    .from('institutional_posts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
});

/**
 * POST /api/feed/posts
 * Crea una nueva publicación
 */
export const POST = withTenantGuard(async (request) => {
  const tenantId = request.headers.get('x-tenant-id');
  const tenantSlug = request.headers.get('x-tenant-slug');
  const body = await request.json();

  const { title, content, post_type, media_url, thumbnail_url, embed_code, cta_label, cta_url, tags, is_pinned, published, scheduled_at } = body;

  if (!title || !post_type) {
    return NextResponse.json({ error: 'título y tipo de publicación son requeridos.' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await (supabase as any)
    .from('institutional_posts')
    .insert({
      tenant_id: tenantId,
      title: title.trim(),
      content: content || null,
      post_type,
      media_url: media_url || null,
      thumbnail_url: thumbnail_url || null,
      embed_code: embed_code || null,
      cta_label: cta_label || null,
      cta_url: cta_url || null,
      tags: tags || null,
      is_pinned: is_pinned ?? false,
      published: published ?? false,
      published_at: published ? new Date().toISOString() : null,
      scheduled_at: scheduled_at || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (tenantSlug) revalidatePath(`/${tenantSlug}`);

  return NextResponse.json(data, { status: 201 });
});

/**
 * PATCH /api/feed/posts
 * Actualiza una publicación existente
 */
export const PATCH = withTenantGuard(async (request) => {
  const tenantId = request.headers.get('x-tenant-id');
  const tenantSlug = request.headers.get('x-tenant-slug');
  const body = await request.json();

  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'Se requiere el ID de la publicación.' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verify ownership
  const { data: existing } = await (supabase as any)
    .from('institutional_posts')
    .select('tenant_id')
    .eq('id', id)
    .single();

  if (!existing || existing.tenant_id !== tenantId) {
    return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
  }

  // If toggling to published, set published_at
  if (updates.published === true && !existing.published_at) {
    updates.published_at = new Date().toISOString();
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await (supabase as any)
    .from('institutional_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (tenantSlug) revalidatePath(`/${tenantSlug}`);

  return NextResponse.json(data);
});

/**
 * DELETE /api/feed/posts
 * Elimina una publicación
 */
export const DELETE = withTenantGuard(async (request) => {
  const tenantId = request.headers.get('x-tenant-id');
  const tenantSlug = request.headers.get('x-tenant-slug');
  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: 'Se requiere el ID de la publicación.' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: existing } = await (supabase as any)
    .from('institutional_posts')
    .select('tenant_id')
    .eq('id', id)
    .single();

  if (!existing || existing.tenant_id !== tenantId) {
    return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
  }

  const { error } = await (supabase as any)
    .from('institutional_posts')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (tenantSlug) revalidatePath(`/${tenantSlug}`);

  return NextResponse.json({ success: true });
});
