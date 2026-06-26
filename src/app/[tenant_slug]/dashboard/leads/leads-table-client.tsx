'use client';

import React, { useState, useMemo } from 'react';
import { Lead, Tenant, EducationLevel, LeadSource, LeadStatus } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { 
  DownloadIcon, 
  SearchIcon, 
  PhoneIcon, 
  MailIcon, 
  MessageSquareIcon,
  CalendarIcon,
  TagIcon,
  UserIcon,
  LayersIcon,
  UsersIcon,
  InfoIcon
} from 'lucide-react';

const statusLabels: Record<LeadStatus, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  visited: 'Visitó',
  enrolled: 'Inscrito',
  lost: 'Perdido',
};

const levelLabels: Record<EducationLevel, string> = {
  maternal: 'Maternal',
  preescolar: 'Preescolar',
  primaria: 'Primaria',
  secundaria: 'Secundaria',
  preparatoria: 'Preparatoria',
};

const sourceLabels: Record<LeadSource, string> = {
  web: 'Sitio Web',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  google: 'Google Search',
  referral: 'Recomendación',
  walk_in: 'Visita Directa',
  other: 'Otro',
};

export default function LeadsTableClient({
  leads,
  tenant,
}: {
  leads: Lead[];
  tenant: Tenant;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Dynamic counts for filter badges
  const counts = useMemo(() => {
    return {
      all: leads.length,
      new: leads.filter((l) => l.status === 'new').length,
      contacted: leads.filter((l) => l.status === 'contacted').length,
      visited: leads.filter((l) => l.status === 'visited').length,
      enrolled: leads.filter((l) => l.status === 'enrolled').length,
      lost: leads.filter((l) => l.status === 'lost').length,
    };
  }, [leads]);

  // Filter logic
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        lead.full_name.toLowerCase().includes(searchLower) ||
        (lead.email && lead.email.toLowerCase().includes(searchLower)) ||
        (lead.phone && lead.phone.includes(searchLower)) ||
        (lead.whatsapp && lead.whatsapp.includes(searchLower));

      return matchesStatus && matchesSearch;
    });
  }, [leads, statusFilter, searchTerm]);

  // Export CSV with UTF-8 BOM
  const handleExportCSV = () => {
    const headers = [
      'Nombre',
      'Correo',
      'Teléfono',
      'WhatsApp',
      'Hijos',
      'Nivel de Interés',
      'Origen',
      'Estado',
      'Notas',
      'Fecha de Registro',
    ];

    const escapeCSVValue = (val: string | null | number) => {
      if (val === null || val === undefined) return '';
      const stringVal = String(val);
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    };

    const rows = filteredLeads.map((lead) => [
      lead.full_name,
      lead.email || '',
      lead.phone || '',
      lead.whatsapp || '',
      lead.children_count,
      lead.level_interest ? levelLabels[lead.level_interest] || lead.level_interest : 'No especificado',
      sourceLabels[lead.source] || lead.source,
      statusLabels[lead.status] || lead.status,
      lead.notes || '',
      new Date(lead.created_at).toLocaleDateString('es-MX'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map(escapeCSVValue).join(',')),
    ].join('\n');

    // Prepend UTF-8 BOM (\uFEFF) so Excel opens accents natively
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `prospectos_${tenant.slug}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeStyle = (status: LeadStatus) => {
    switch (status) {
      case 'new':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200';
      case 'contacted':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200';
      case 'visited':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200';
      case 'enrolled':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200';
      case 'lost':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Embudo de Ventas (CRM)</h1>
          <p className="text-muted-foreground mt-1">Registra y da seguimiento a los prospectos del colegio.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={handleExportCSV}
            disabled={filteredLeads.length === 0}
            className="flex items-center gap-2"
          >
            <DownloadIcon className="h-4 w-4" />
            <span>Exportar CSV</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-1 bg-muted/40 p-1 rounded-xl border border-border">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos <span className="opacity-60 font-normal">({counts.all})</span>
          </button>
          {Object.entries(statusLabels).map(([status, label]) => {
            const count = counts[status as LeadStatus] || 0;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === status
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label} <span className="opacity-60 font-normal">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full rounded-xl bg-background"
          />
        </div>
      </div>

      {/* Leads Table Card */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        {filteredLeads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 font-semibold text-muted-foreground">
                  <th className="p-4">Nombre</th>
                  <th className="p-4">WhatsApp</th>
                  <th className="p-4">Nivel</th>
                  <th className="p-4">Fuente</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-foreground">{lead.full_name}</div>
                      {lead.email && <div className="text-xs text-muted-foreground">{lead.email}</div>}
                    </td>
                    <td className="p-4">
                      {lead.whatsapp ? (
                        <a
                          href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline bg-primary/5 px-2.5 py-1 rounded-md"
                        >
                          <MessageSquareIcon className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/20" />
                          <span>{lead.whatsapp}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {lead.level_interest ? (
                        <span className="text-xs font-medium text-foreground">
                          {levelLabels[lead.level_interest] || lead.level_interest}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-xs bg-muted border border-border text-muted-foreground capitalize">
                        {sourceLabels[lead.source] || lead.source}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeStyle(lead.status)}`}>
                        {statusLabels[lead.status]}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <UsersIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold tracking-tight">No se encontraron prospectos</h3>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm">
              Aún no se han recibido leads en la base de datos o no coinciden con los criterios de búsqueda.
            </p>
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog
        open={selectedLead !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLead(null);
        }}
      >
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <UserIcon className="h-5 w-5 text-primary" />
              <span>Detalle de Prospecto</span>
            </DialogTitle>
            <DialogDescription>
              Ficha del cliente potencial registrada en Lumis CRM.
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-6 py-4">
              {/* Profile Card Summary */}
              <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-lg text-foreground">{selectedLead.full_name}</h3>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <Badge variant="outline" className={`px-2 py-0.5 font-semibold text-xs border ${getStatusBadgeStyle(selectedLead.status)}`}>
                      {statusLabels[selectedLead.status]}
                    </Badge>
                    {selectedLead.level_interest && (
                      <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                        {levelLabels[selectedLead.level_interest]}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground bg-background px-3 py-1.5 border border-border rounded-lg self-stretch sm:self-auto flex items-center gap-2">
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <span className="font-semibold block">Registrado el</span>
                    <span>
                      {new Date(selectedLead.created_at).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact Section */}
                <div className="space-y-3.5 border border-border rounded-xl p-4 bg-card">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <PhoneIcon className="h-3.5 w-3.5" />
                    <span>Datos de Contacto</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground block">Correo electrónico</span>
                      {selectedLead.email ? (
                        <a href={`mailto:${selectedLead.email}`} className="text-primary font-medium hover:underline flex items-center gap-1">
                          <MailIcon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{selectedLead.email}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">No provisto</span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Teléfono Móvil</span>
                      {selectedLead.phone ? (
                        <span className="font-medium text-foreground flex items-center gap-1">
                          <PhoneIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{selectedLead.phone}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">No provisto</span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">WhatsApp Directo</span>
                      {selectedLead.whatsapp ? (
                        <a
                          href={`https://wa.me/${selectedLead.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary font-medium hover:underline flex items-center gap-1"
                        >
                          <MessageSquareIcon className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/20 shrink-0" />
                          <span>{selectedLead.whatsapp}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">No provisto</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admission Metadata */}
                <div className="space-y-3.5 border border-border rounded-xl p-4 bg-card">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <LayersIcon className="h-3.5 w-3.5" />
                    <span>Admisiones e Interés</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground block">Nivel Educativo</span>
                      <span className="font-medium text-foreground">
                        {selectedLead.level_interest ? levelLabels[selectedLead.level_interest] : 'No especificado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Cantidad de Hijos</span>
                      <span className="font-medium text-foreground flex items-center gap-1">
                        <UsersIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{selectedLead.children_count}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Canal de Procedencia</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-muted border border-border text-muted-foreground capitalize font-semibold mt-0.5 inline-block">
                        {sourceLabels[selectedLead.source] || selectedLead.source}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Marketing Analytics UTM */}
              {(selectedLead.utm_source || selectedLead.utm_medium || selectedLead.utm_campaign) && (
                <div className="border border-border rounded-xl p-4 bg-card space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <TagIcon className="h-3.5 w-3.5" />
                    <span>Seguimiento de Marketing (UTMs)</span>
                  </h4>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {selectedLead.utm_source && (
                      <div className="bg-muted px-2.5 py-1 rounded-lg border border-border">
                        <span className="text-muted-foreground font-medium">Source: </span>
                        <span className="font-semibold text-foreground">{selectedLead.utm_source}</span>
                      </div>
                    )}
                    {selectedLead.utm_medium && (
                      <div className="bg-muted px-2.5 py-1 rounded-lg border border-border">
                        <span className="text-muted-foreground font-medium">Medium: </span>
                        <span className="font-semibold text-foreground">{selectedLead.utm_medium}</span>
                      </div>
                    )}
                    {selectedLead.utm_campaign && (
                      <div className="bg-muted px-2.5 py-1 rounded-lg border border-border">
                        <span className="text-muted-foreground font-medium">Campaign: </span>
                        <span className="font-semibold text-foreground">{selectedLead.utm_campaign}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes Details */}
              <div className="border border-border rounded-xl p-4 bg-card space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <InfoIcon className="h-3.5 w-3.5" />
                  <span>Notas y Comentarios</span>
                </h4>
                <div className="bg-muted/30 p-3 rounded-lg border border-border text-sm text-foreground whitespace-pre-wrap min-h-[4.5rem]">
                  {selectedLead.notes || <span className="text-muted-foreground italic text-xs">Sin observaciones registradas.</span>}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {/* compliance with render syntax on base-ui dialog-close */}
            <DialogClose render={<Button variant="outline" />}>
              Cerrar
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
