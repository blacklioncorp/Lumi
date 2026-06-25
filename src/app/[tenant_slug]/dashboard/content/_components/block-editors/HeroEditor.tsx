'use client';

import React from 'react';
import ImageUploader from '../ImageUploader';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface HeroEditorProps {
  data: any;
  onChange: (newData: any) => void;
  tenantId: string;
}

export default function HeroEditor({ data = {}, onChange, tenantId }: HeroEditorProps) {
  const handleChange = (key: string, value: any) => {
    onChange({
      ...data,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* headline */}
      <div className="space-y-2">
        <label className="text-sm font-bold block">Título Principal (Headline)</label>
        <input
          type="text"
          value={data.headline || ''}
          onChange={(e) => handleChange('headline', e.target.value)}
          placeholder="Ej. Forjando a los líderes del mañana"
          className="w-full px-3 py-2 text-base font-semibold border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* subheadline */}
      <div className="space-y-2">
        <label className="text-sm font-bold block">Subtítulo / Descripción (Subheadline)</label>
        <textarea
          value={data.subheadline || ''}
          onChange={(e) => handleChange('subheadline', e.target.value)}
          placeholder="Ej. Admisiones abiertas para el ciclo escolar 2026. Inscripciones abiertas."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      {/* bg_image_url */}
      <div className="space-y-2">
        <label className="text-sm font-bold block">Imagen de Fondo (Hero Banner)</label>
        <ImageUploader
          value={data.bg_image_url || null}
          onChange={(url) => handleChange('bg_image_url', url)}
          tenantId={tenantId}
          folder="hero"
        />
      </div>

      {/* CTAs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-bold block">Texto Botón Primario</label>
          <input
            type="text"
            value={data.cta_primary_text || ''}
            onChange={(e) => handleChange('cta_primary_text', e.target.value)}
            placeholder="Ej. Agendar visita"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold block">Texto Botón Secundario</label>
          <input
            type="text"
            value={data.cta_secondary_text || ''}
            onChange={(e) => handleChange('cta_secondary_text', e.target.value)}
            placeholder="Ej. Conocer más"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Badge settings */}
      <div className="p-4 border border-border rounded-xl space-y-4 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-badge-switch" className="text-sm font-bold">Mostrar Badge de Inscripción</Label>
            <p className="text-xs text-muted-foreground">Muestra una etiqueta flotante de anuncio.</p>
          </div>
          <Switch
            id="show-badge-switch"
            checked={data.show_badge ?? true}
            onCheckedChange={(checked) => handleChange('show_badge', checked)}
          />
        </div>

        {(data.show_badge ?? true) && (
          <div className="space-y-2">
            <label className="text-sm font-bold block">Texto del Badge</label>
            <input
              type="text"
              value={data.badge_text || ''}
              onChange={(e) => handleChange('badge_text', e.target.value)}
              placeholder="Ej. Admisiones Abiertas 2026"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}
      </div>
    </div>
  );
}
