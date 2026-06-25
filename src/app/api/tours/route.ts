import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth';
import { z } from 'zod';

// Schema de validación para POST /api/tours
const postTourSchema = z.object({
  tenant_slug: z.string().min(1),
  lead_id: z.string().uuid(),
  scheduled_at: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Formato de fecha scheduled_at inválido (debe ser ISO 8601)',
  }),
  duration_minutes: z.number().int().positive().default(60),
  notes: z.string().nullable().optional(),
});

// Schema de validación para PATCH /api/tours
const patchTourSchema = z.object({
  tour_id: z.string().uuid(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']),
  notes: z.string().nullable().optional(),
});

/**
 * POST /api/tours
 * Crea un nuevo tour, verifica pertenencia del lead, y dispara el webhook de n8n para Google Calendar.
 */
export async function POST(request: Request) {
  try {
    const jsonBody = await request.json();
    const result = postTourSchema.safeParse(jsonBody);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: result.error.format() },
        { status: 400 }
      );
    }

    const { tenant_slug, lead_id, scheduled_at, duration_minutes, notes } = result.data;
    const supabaseAdmin = createAdminClient();

    // 1. Resolver el tenant por slug
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tenant, error: tenantError } = await (supabaseAdmin as any)
      .from('tenants')
      .select('id, name, active_modules')
      .eq('slug', tenant_slug)
      .eq('is_active', true)
      .maybeSingle();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Colegio no encontrado o inactivo' },
        { status: 404 }
      );
    }

    // 2. Verificar que el lead existe y pertenece a ese tenant
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lead, error: leadError } = await (supabaseAdmin as any)
      .from('leads')
      .select('id, tenant_id, full_name, whatsapp, email')
      .eq('id', lead_id)
      .maybeSingle();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      );
    }

    if (lead.tenant_id !== tenant.id) {
      return NextResponse.json(
        { error: 'El lead especificado no pertenece a este colegio' },
        { status: 403 }
      );
    }

    // 3. Insertar el tour en la base de datos (inicialmente sin google_event_id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tour, error: tourError } = await (supabaseAdmin as any)
      .from('tours')
      .insert({
        tenant_id: tenant.id,
        lead_id: lead.id,
        scheduled_at,
        duration_minutes,
        notes: notes || null,
        status: 'scheduled',
      })
      .select()
      .single();

    if (tourError || !tour) {
      console.error('Error insertando tour:', tourError);
      return NextResponse.json(
        { error: 'Error guardando el tour en la base de datos' },
        { status: 500 }
      );
    }

    // 4. Disparar el webhook de n8n (fire-and-forget)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_TOUR_URL;
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
      const googleCalendarEnabled = activeModules.includes('google_calendar');
      const webhookSecret = process.env.N8N_WEBHOOK_SECRET || '';

      // Formatear la fecha en español de México (es-MX)
      const scheduledAtFormatted = new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'America/Mexico_City',
      }).format(new Date(scheduled_at));

      const payload = {
        event: 'tour_scheduled',
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        tour_id: tour.id,
        lead: {
          full_name: lead.full_name,
          whatsapp: lead.whatsapp || '',
          email: lead.email || null,
        },
        scheduled_at,
        duration_minutes,
        google_calendar_enabled: googleCalendarEnabled,
        scheduled_at_formatted: scheduledAtFormatted,
      };

      fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhookSecret ? { 'x-lumis-secret': webhookSecret } : {}),
        },
        body: JSON.stringify(payload),
      }).catch((err) => console.error('Error disparando webhook de tours n8n:', err));
    }

    return NextResponse.json(tour, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error en POST /api/tours:', msg);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * PATCH /api/tours
 * Actualiza el estado de un tour existente. Requiere autenticación y validar pertenencia al tenant.
 */
export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const jsonBody = await request.json();
    const result = patchTourSchema.safeParse(jsonBody);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: result.error.format() },
        { status: 400 }
      );
    }

    const { tour_id, status, notes } = result.data;
    const supabaseAdmin = createAdminClient();

    // 1. Obtener el tour y verificar si existe
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tour, error: tourError } = await (supabaseAdmin as any)
      .from('tours')
      .select('id, tenant_id, google_event_id')
      .eq('id', tour_id)
      .maybeSingle();

    if (tourError || !tour) {
      return NextResponse.json(
        { error: 'Tour no encontrado' },
        { status: 404 }
      );
    }

    // 2. Validar que el tour pertenece al tenant del usuario autenticado (superadmin tiene bypass)
    if (user.user_role !== 'superadmin' && user.tenant_id !== tour.tenant_id) {
      return NextResponse.json(
        { error: 'Acceso denegado. No tienes permisos sobre este tenant.' },
        { status: 403 }
      );
    }

    // 3. Actualizar en la base de datos
    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedTour, error: updateError } = await (supabaseAdmin as any)
      .from('tours')
      .update(updateData)
      .eq('id', tour_id)
      .select()
      .single();

    if (updateError || !updatedTour) {
      console.error('Error actualizando tour:', updateError);
      return NextResponse.json(
        { error: 'Error actualizando el tour en la base de datos' },
        { status: 500 }
      );
    }

    // 4. Si el estado es "cancelled", disparar webhook de cancelación
    if (status === 'cancelled') {
      const n8nWebhookCancelledUrl = process.env.N8N_WEBHOOK_TOUR_CANCELLED_URL;
      if (n8nWebhookCancelledUrl) {
        const webhookSecret = process.env.N8N_WEBHOOK_SECRET || '';

        const payload = {
          event: 'tour_cancelled',
          tour_id: tour.id,
          tenant_id: tour.tenant_id,
          google_event_id: tour.google_event_id || null,
          timestamp: new Date().toISOString(),
        };

        fetch(n8nWebhookCancelledUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(webhookSecret ? { 'x-lumis-secret': webhookSecret } : {}),
          },
          body: JSON.stringify(payload),
        }).catch((err) => console.error('Error disparando webhook de cancelación n8n:', err));
      }
    }

    return NextResponse.json(updatedTour, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error en PATCH /api/tours:', msg);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
