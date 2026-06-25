import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tenantSlug,
      fullName,
      email,
      phone,
      whatsapp,
      childrenCount,
      levelInterest,
      source,
      notes,
    } = body;

    if (!tenantSlug || !fullName) {
      return NextResponse.json(
        { error: 'Missing tenantSlug or fullName' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // 1. Resolve Tenant ID by slug
    const { data: tenant, error: tenantError } = await (supabaseAdmin as any)
      .from('tenants')
      .select('id, name')
      .eq('slug', tenantSlug)
      .eq('is_active', true)
      .maybeSingle();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found or inactive' },
        { status: 404 }
      );
    }

    // 2. Insert Lead
    const { data: lead, error: leadError } = await (supabaseAdmin as any)
      .from('leads')
      .insert({
        tenant_id: tenant.id,
        full_name: fullName,
        email,
        phone,
        whatsapp,
        children_count: childrenCount || 1,
        level_interest: levelInterest,
        source: source || 'web',
        status: 'new',
        notes,
      })
      .select()
      .single();

    if (leadError) {
      console.error('Database error inserting lead:', leadError);
      return NextResponse.json(
        { error: 'Error saving lead details to database' },
        { status: 500 }
      );
    }

    // 3. (Optional) Trigger n8n Automation Webhook
    // If n8n webhooks are configured, we could dispatch to them asynchronously here.
    const n8nWebhookUrl = process.env.N8N_LEAD_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      try {
        fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'lead.created',
            tenant: { id: tenant.id, name: tenant.name },
            lead,
          }),
        }).catch((err) => console.error('Failed to trigger n8n webhook:', err));
      } catch (webhookErr) {
        console.error('Error dispatching webhook:', webhookErr);
      }
    }

    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (error: any) {
    console.error('API Error in leads creation:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
