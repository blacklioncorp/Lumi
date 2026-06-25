'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Save, Sparkles } from 'lucide-react';
import { TenantConfig } from '@/types/tenant';
import ImageUploader from '../content/_components/ImageUploader';
import { Button } from '@/components/ui/button';

interface SettingsFormProps {
  tenant: TenantConfig;
}

// Lista de zonas horarias recomendadas para México
const MEXICO_TIMEZONES = [
  { value: 'America/Mexico_City', label: 'Centro (CDMX, Monterrey, Guadalajara)' },
  { value: 'America/Cancun', label: 'Sureste (Quintana Roo, Cancún)' },
  { value: 'America/Tijuana', label: 'Pacífico Norte (Baja California, Tijuana)' },
  { value: 'America/Hermosillo', label: 'Sonora (Hermosillo)' },
  { value: 'America/Mazatlan', label: 'Pacífico (Sinaloa, Nayarit, Chihuahua, Mazatlán)' },
];

export default function SettingsForm({ tenant }: SettingsFormProps) {
  const [name, setName] = useState(tenant.name);
  const [logoUrl, setLogoUrl] = useState<string | null>(tenant.logo_url);
  const [primaryColor, setPrimaryColor] = useState(tenant.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(tenant.secondary_color);
  const [timezone, setTimezone] = useState(tenant.timezone);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const saveToastId = toast.loading('Guardando configuración de identidad...');

    try {
      const res = await fetch('/api/cms/tenant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          logo_url: logoUrl,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          timezone,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al guardar');
      }

      toast.success('Identidad del colegio actualizada con éxito.', { id: saveToastId });
      
      // Forzar recarga ligera para propagar los colores inyectados por headers del middleware
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al guardar la configuración.', { id: saveToastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Grid de Formulario vs Vista Previa */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulario */}
        <form onSubmit={handleSave} className="lg:col-span-7 bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="font-bold text-lg">Branding e Identidad Visual</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Personaliza el logotipo, los colores temáticos y los datos primarios de tu escuela.
            </p>
          </div>

          {/* Nombre del Colegio */}
          <div className="space-y-2">
            <label className="text-sm font-bold block">Nombre Oficial del Colegio</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Colegio Harvard"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <label className="text-sm font-bold block">Zona Horaria (Operaciones y Visitas)</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {MEXICO_TIMEZONES.map((zone) => (
                <option key={zone.value} value={zone.value}>
                  {zone.label}
                </option>
              ))}
            </select>
          </div>

          {/* Logo Uploader */}
          <div className="space-y-2">
            <label className="text-sm font-bold block">Logotipo del Colegio</label>
            <p className="text-xs text-muted-foreground mb-2">
              Se recomienda una imagen con fondo transparente y formato cuadrado/horizontal limpio.
            </p>
            <ImageUploader
              value={logoUrl}
              onChange={(url) => setLogoUrl(url || null)}
              tenantId={tenant.id}
              folder="logo"
            />
          </div>

          {/* Color pickers */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold block">Color Primario (Tema)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-10 rounded border border-border p-1 bg-background cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-border rounded-lg bg-card"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold block">Color Secundario (Acento)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-12 h-10 rounded border border-border p-1 bg-background cursor-pointer"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-border rounded-lg bg-card"
                />
              </div>
            </div>
          </div>

          {/* Botón guardar */}
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center justify-center gap-2 py-5 rounded-xl transition-all"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Guardar Configuración
          </Button>
        </form>

        {/* Vista Previa */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Vista Previa en Tiempo Real</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Así lucirá el branding de tu colegio en la barra de navegación del sitio público:
            </p>

            {/* Navbar Preview */}
            <div className="border border-border rounded-xl p-4 bg-muted/30">
              <header className="bg-background rounded-lg border border-border shadow-sm overflow-hidden">
                {/* Navbar mock header */}
                <div className="h-14 px-4 flex items-center justify-between">
                  {/* Logo + Name */}
                  <div className="flex items-center gap-2">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoUrl} alt="Logo preview" className="h-6 w-auto object-contain" />
                    ) : (
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center font-bold text-white text-[10px]"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="font-bold text-xs truncate max-w-[120px]">{name}</span>
                  </div>

                  {/* Navigation Links */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer">
                      Inicio
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer">
                      Admisiones
                    </span>
                    <button
                      type="button"
                      className="px-2.5 py-1 text-[9px] font-bold text-white rounded-md shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Contacto
                    </button>
                  </div>
                </div>
              </header>

              {/* Botón flotante estilo Whatsapp mock */}
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1 shadow-sm"
                  style={{ backgroundColor: secondaryColor }}
                >
                  💬 Chatear con nosotros
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
