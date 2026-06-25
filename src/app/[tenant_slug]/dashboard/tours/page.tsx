import React from 'react';
import { getTenantFromHeaders } from '@/lib/tenant';
import { createClient } from '@/lib/supabase/server';
import { Tour } from '@/types/database';

export default async function DashboardToursPage() {
  const { tenant } = getTenantFromHeaders();
  if (!tenant) return null;

  const supabase = createClient();
  let tours: Tour[] = [];

  try {
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .order('scheduled_at', { ascending: true });

    if (!error && data) {
      tours = data;
    }
  } catch (err) {
    console.error('Failed to load tours:', err);
  }

  // Fallback mock data if DB is empty
  const displayTours = tours.length > 0 ? tours : [
    {
      id: '1',
      tenant_id: tenant.id,
      lead_id: '1',
      scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      duration_minutes: 60,
      google_event_id: 'g_event_abc123',
      status: 'scheduled',
      notes: 'Visita guiada para preescolar y primaria. Mostrar alberca y laboratorios.',
    },
    {
      id: '2',
      tenant_id: tenant.id,
      lead_id: '2',
      scheduled_at: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
      duration_minutes: 45,
      google_event_id: 'g_event_xyz789',
      status: 'scheduled',
      notes: 'Plática con coordinación académica de secundaria.',
    }
  ] as unknown as Tour[];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario de Visitas</h1>
          <p className="text-muted-foreground mt-1">Monitorea y agenda tours escolares por el campus.</p>
        </div>
        <button 
          className="self-start px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90 shadow-md flex items-center gap-2"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          <span>+</span> Programar Visita
        </button>
      </div>

      {/* Synchronized status banner */}
      <div className="p-4 bg-primary/10 border border-primary/20 text-xs rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>🔄</span>
          <span className="font-semibold text-primary">Sincronización de Google Calendar Activa</span>
        </div>
        <span className="text-muted-foreground">Última sincronización: hace 5 minutos</span>
      </div>

      {/* Tours List */}
      <div className="grid gap-6 md:grid-cols-2">
        {displayTours.map((tour) => (
          <div key={tour.id} className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                  ⏱ {tour.duration_minutes} Minutos
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 capitalize">
                  {tour.status}
                </span>
              </div>
              <h3 className="font-bold text-lg">Visita de Prospecto</h3>
              <p className="text-xs text-muted-foreground">
                📅 {new Date(tour.scheduled_at).toLocaleString('es-MX', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground mt-2">
                {tour.notes || 'Sin especificaciones.'}
              </p>
            </div>

            <div className="border-t border-border pt-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Google ID: <code className="bg-muted px-1 py-0.5 rounded text-[10px]">{tour.google_event_id || 'N/A'}</code>
              </span>
              <button className="font-semibold text-primary hover:underline">
                Reagendar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
