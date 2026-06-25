import React from 'react';
import { getTenantFromHeaders } from '@/lib/tenant';
import { createClient } from '@/lib/supabase/server';
import { Lead } from '@/types/database';

export default async function DashboardLeadsPage() {
  const { tenant } = getTenantFromHeaders();
  if (!tenant) return null;

  const supabase = createClient();
  let leads: Lead[] = [];

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      leads = data;
    }
  } catch (err) {
    console.error('Failed to load leads:', err);
  }

  // Fallback mock data if DB is empty
  const displayLeads = leads.length > 0 ? leads : [
    {
      id: '1',
      tenant_id: tenant.id,
      full_name: 'Alejandra Pérez',
      email: 'alejandra.perez@example.com',
      phone: '5512345678',
      whatsapp: '5512345678',
      children_count: 2,
      level_interest: 'primaria',
      source: 'instagram',
      status: 'new',
      notes: 'Interesada en programa bilingüe y transporte escolar.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      tenant_id: tenant.id,
      full_name: 'Roberto Gómez',
      email: 'roberto.gomez@example.com',
      phone: '5587654321',
      whatsapp: '5587654321',
      children_count: 1,
      level_interest: 'preescolar',
      source: 'web',
      status: 'contacted',
      notes: 'Contactado por teléfono. Solicita folleto de costos.',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '3',
      tenant_id: tenant.id,
      full_name: 'Gabriela Ortiz',
      email: 'gaby.ortiz@example.com',
      phone: '5543210987',
      whatsapp: '5543210987',
      children_count: 1,
      level_interest: 'secundaria',
      source: 'whatsapp',
      status: 'visited',
      notes: 'Realizó tour escolar. Pendiente examen de admisión.',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 172800000).toISOString(),
    }
  ] as unknown as Lead[];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Embudo de Ventas (CRM)</h1>
          <p className="text-muted-foreground mt-1">Registra y da seguimiento a los prospectos del colegio.</p>
        </div>
        <button 
          className="self-start px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90 shadow-md flex items-center gap-2"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          <span>+</span> Registrar Prospecto
        </button>
      </div>

      {/* Leads Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                <th className="p-4">Nombre</th>
                <th className="p-4">Nivel Interés</th>
                <th className="p-4">Contacto</th>
                <th className="p-4">Origen</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 font-medium">{lead.full_name}</td>
                  <td className="p-4 capitalize">{lead.level_interest || 'No especificado'}</td>
                  <td className="p-4 space-y-1">
                    <p className="text-xs">{lead.email}</p>
                    <p className="text-xs text-muted-foreground">{lead.phone}</p>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-xs bg-muted border border-border capitalize">
                      {lead.source}
                    </span>
                  </td>
                  <td className="p-4">
                    <span 
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        lead.status === 'new' 
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                          : lead.status === 'contacted'
                          ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                          : lead.status === 'visited'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                          : 'bg-green-500/10 text-green-600 dark:text-green-400'
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-muted-foreground max-w-xs truncate">
                    {lead.notes || 'Sin notas'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
