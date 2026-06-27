import React from 'react';
import { requireRole } from '@/lib/auth';
import { getTenantFromHeaders } from '@/lib/tenant';
import { createClient } from '@/lib/supabase/server';
import IntegrationsForm from './IntegrationsForm';

export default async function IntegrationsPage() {
  await requireRole(['school_admin', 'superadmin']);

  const { tenant } = getTenantFromHeaders();
  if (!tenant) return null;

  const supabase = createClient();
  let integrations = null;

  try {
    const { data, error } = await supabase
      .from('tenant_integrations')
      .select('*')
      .eq('tenant_id', tenant.id)
      .single();

    if (!error && data) {
      integrations = data;
    }
  } catch (error) {
    console.error('Failed to load integrations', error);
  }

  // Si no existe, usamos valores vacíos
  const currentIntegrations = integrations || {
    whatsapp_number: '',
    whatsapp_message_template: '',
    google_calendar_email: '',
    facebook_url: '',
    instagram_url: '',
    tiktok_url: '',
    youtube_url: '',
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integraciones y Dominios</h1>
        <p className="text-muted-foreground mt-1">
          Configura las redes sociales, WhatsApp, calendario y el dominio personalizado de tu colegio.
        </p>
      </div>

      <IntegrationsForm 
        tenantId={tenant.id} 
        activeModules={tenant.active_modules || []} 
        initialData={currentIntegrations}
        currentCustomDomain={tenant.custom_domain || ''}
      />
    </div>
  );
}
