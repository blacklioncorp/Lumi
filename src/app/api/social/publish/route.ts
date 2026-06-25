import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth';
import { z } from 'zod';

// Schema de validación Zod para publicar contenido en redes sociales
const postSocialSchema = z.object({
  tenant_slug: z.string().min(1),
  platforms: z.array(z.enum(['facebook', 'instagram', 'tiktok'])).min(1),
  content: z.object({
    text: z.string().min(1, 'El texto de la publicación es obligatorio'),
    media_urls: z.array(z.string().url()).default([]),
    media_type: z.enum(['image', 'video']),
    scheduled_at: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Fecha scheduled_at inválida' })
      .nullable()
      .default(null),
  }),
});

/**
 * POST /api/social/publish
 * Valida permisos del usuario, activa módulos del tenant, envía un webhook a n8n y registra el post.
 */
export async function POST(request: Request) {
  try {
    // 1. Verificar autenticación del usuario
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const jsonBody = await request.json();
    const result = postSocialSchema.safeParse(jsonBody);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: result.error.format() },
        { status: 400 }
      );
    }

    const { tenant_slug, platforms, content } = result.data;
    const supabaseAdmin = createAdminClient();

    // 2. Resolver el tenant por slug
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tenant, error: tenantError } = await (supabaseAdmin as any)
      .from('tenants')
      .select('id, name, slug, active_modules')
      .eq('slug', tenant_slug)
      .eq('is_active', true)
      .maybeSingle();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Colegio no encontrado o inactivo' },
        { status: 404 }
      );
    }

    // 3. Verificar auth: el rol debe ser school_admin o editor del tenant (los superadmins tienen bypass)
    const isSuperAdmin = user.user_role === 'superadmin';
    const isTenantAuthorized =
      user.tenant_id === tenant.id &&
      (user.user_role === 'school_admin' || user.user_role === 'editor');

    if (!isSuperAdmin && !isTenantAuthorized) {
      return NextResponse.json(
        { error: 'Acceso denegado. No tienes permisos para publicar en este colegio.' },
        { status: 403 }
      );
    }

    // 4. Verificar que active_modules incluye "social_media_posting"
    let activeModules: string[] = [];
    if (tenant.active_modules) {
      if (Array.isArray(tenant.active_modules)) {
        activeModules = tenant.active_modules;
      } else if (typeof tenant.active_modules === 'string') {
        try {
          activeModules = JSON.parse(tenant.active_modules);
        } catch {
          activeModules = [];
        }
      }
    }

    if (!activeModules.includes('social_media_posting')) {
      return NextResponse.json(
        { error: 'El módulo general social_media_posting no está activo para este colegio.' },
        { status: 400 }
      );
    }

    // 5. Para cada platform en platforms[], verificar que el módulo específico está activo
    for (const platform of platforms) {
      if (!activeModules.includes(platform)) {
        return NextResponse.json(
          { error: `El módulo de la plataforma específica '${platform}' no está activo para este colegio.` },
          { status: 400 }
        );
      }
    }

    // 6. Registrar en la base de datos (social_posts)
    const postStatus = content.scheduled_at ? 'scheduled' : 'pending';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error: postError } = await (supabaseAdmin as any)
      .from('social_posts')
      .insert({
        tenant_id: tenant.id,
        platforms,
        content_text: content.text,
        media_urls: content.media_urls,
        media_type: content.media_type,
        status: postStatus,
        scheduled_at: content.scheduled_at,
        created_by: user.id,
      })
      .select()
      .single();

    if (postError || !post) {
      console.error('Error insertando social post:', postError);
      return NextResponse.json(
        { error: 'Error registrando la publicación en la base de datos' },
        { status: 500 }
      );
    }

    // 7. Disparar webhook a n8n (fire-and-forget)
    const n8nWebhookSocialUrl = process.env.N8N_WEBHOOK_SOCIAL_URL;
    if (n8nWebhookSocialUrl) {
      const webhookSecret = process.env.N8N_WEBHOOK_SECRET || '';

      const payload = {
        event: 'social_publish',
        post_id: post.id,
        tenant_id: tenant.id,
        tenant_slug: tenant.slug,
        platforms,
        content: {
          text: content.text,
          media_urls: content.media_urls,
          media_type: content.media_type,
        },
        scheduled_at: content.scheduled_at,
        timestamp: new Date().toISOString(),
      };

      fetch(n8nWebhookSocialUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhookSecret ? { 'x-lumis-secret': webhookSecret } : {}),
        },
        body: JSON.stringify(payload),
      }).catch((err) => console.error('Error disparando webhook de social posting n8n:', err));
    }

    // 8. Responder con { success: true, post_id: string, status: "pending" }
    return NextResponse.json(
      {
        success: true,
        post_id: post.id,
        status: postStatus,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error en POST /api/social/publish:', msg);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
