import React from 'react';
import { requireRole } from '@/lib/auth';
import { getTenantFromHeaders } from '@/lib/tenant';
import SettingsForm from './SettingsForm';

export default async function SettingsPage() {
  // 1. Verificar autenticación (solo school_admin o superadmin)
  await requireRole(['school_admin']);

  // 2. Obtener el tenant configurado en los headers por el middleware
  const { tenant } = getTenantFromHeaders();
  if (!tenant) return null;

  // 3. Adaptar configuración de tenant
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
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración del Colegio</h1>
        <p className="text-muted-foreground mt-1">
          Ajusta la configuración de identidad corporativa y horario operativo de tu plantel.
        </p>
      </div>

      <SettingsForm tenant={tenantConfig} />
    </div>
  );
}
