import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/leads
 * Acepta campos en snake_case (formulario público) o camelCase (integración interna).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Normalizar: el formulario público envía snake_case
    const tenantSlug    = (body.tenant_slug     ?? body.tenantSlug)     as string | undefined;
    const fullName      = (body.full_name        ?? body.fullName)       as string | undefined;
    const email         = (body.email            ?? null)                as string | null;
    const phone         = (body.phone            ?? null)                as string | null;
    const whatsapp      = (body.whatsapp         ?? null)                as string | null;
    const childrenCount = (body.children_count   ?? body.childrenCount   ?? 1) as number;
    const levelInterest = (body.level_interest   ?? body.levelInterest   ?? null) as string | null;
    const source        = (body.source           ?? 'web')              as string;
    const notes         = (body.notes            ?? null)                as string | null;

    if (!tenantSlug || !fullName) {
      return NextResponse.json(
        { error: 'Se requieren tenant_slug y full_name' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // 1. Resolver el tenant por slug
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tenant, error: tenantError } = await (supabaseAdmin as any)
      .from('tenants')
      .select('id, name, slug, active_modules')
      .eq('slug', tenantSlug)
      .eq('is_active', true)
      .maybeSingle();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Colegio no encontrado o inactivo' },
        { status: 404 }
      );
    }

    // 2. Insertar lead
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lead, error: leadError } = await (supabaseAdmin as any)
      .from('leads')
      .insert({
        tenant_id:      tenant.id,
        full_name:      fullName,
        email:          email,
        phone:          phone,
        whatsapp:       whatsapp,
        children_count: childrenCount,
        level_interest: levelInterest,
        source:         source,
        status:         'new',
        notes:          notes,
      })
      .select()
      .single();

    if (leadError) {
      console.error('Error insertando lead:', leadError);
      return NextResponse.json(
        { error: 'Error guardando el registro en la base de datos' },
        { status: 500 }
      );
    }

    // 3. Notificación asíncrona a n8n (fire-and-forget)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_LEAD_URL;
    if (n8nWebhookUrl) {
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
      const whatsapp_enabled = activeModules.includes('whatsapp');
      const webhookSecret = process.env.N8N_WEBHOOK_SECRET || '';

      const payload = {
        event: 'new_lead',
        tenant_id: tenant.id,
        tenant_slug: tenant.slug,
        tenant_name: tenant.name,
        lead: {
          id: lead.id,
          full_name: lead.full_name,
          whatsapp: lead.whatsapp || '',
          email: lead.email,
          level_interest: lead.level_interest || '',
          children_count: Number(lead.children_count),
          source: lead.source
        },
        whatsapp_enabled,
        timestamp: new Date().toISOString()
      };

      fetch(n8nWebhookUrl, {
        method:  'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(webhookSecret ? { 'x-lumis-secret': webhookSecret } : {})
        },
        body:    JSON.stringify(payload),
      }).catch((err) => console.error('Error disparando webhook n8n:', err));
    }

    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error en /api/leads:', message);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
