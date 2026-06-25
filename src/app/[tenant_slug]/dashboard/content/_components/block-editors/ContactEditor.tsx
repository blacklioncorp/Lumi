'use client';

import React from 'react';

interface ContactEditorProps {
  data: any;
  onChange: (newData: any) => void;
  tenantId: string;
}

export default function ContactEditor({ data = {}, onChange }: ContactEditorProps) {
  const handleChange = (key: string, value: any) => {
    onChange({
      ...data,
      [key]: value,
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo permitir dígitos, máximo 10 dígitos para MX
    const cleaned = e.target.value.replace(/\D/g, '').substring(0, 10);
    handleChange('phone', cleaned);
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').substring(0, 10);
    handleChange('social_whatsapp', cleaned);
  };

  return (
    <div className="space-y-6">
      {/* Address */}
      <div className="space-y-2">
        <label className="text-sm font-bold block">Dirección Física Completa</label>
        <textarea
          value={data.address || ''}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="Ej. Av. Universidad 120, Col. Centro, Querétaro, Qro."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      {/* Phone and Email */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-bold block">Teléfono de Oficina (10 dígitos)</label>
          <input
            type="tel"
            value={data.phone || ''}
            onChange={handlePhoneChange}
            placeholder="Ej. 4421234567"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold block">Correo de Contacto</label>
          <input
            type="email"
            value={data.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Ej. contacto@colegio.edu.mx"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-2">
        <label className="text-sm font-bold block">Horario de Atención</label>
        <textarea
          value={data.schedule || ''}
          onChange={(e) => handleChange('schedule', e.target.value)}
          placeholder="Ej. Lunes a Viernes de 8:00 AM a 3:00 PM"
          rows={2}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      {/* Google Maps Iframe */}
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-bold block">Google Maps Embed URL</label>
          <p className="text-xs text-muted-foreground">
            Ingresa la URL del atributo `src` del iframe de Google Maps Compartir → Incorporar mapa.
          </p>
          <input
            type="text"
            value={data.maps_embed || ''}
            onChange={(e) => handleChange('maps_embed', e.target.value)}
            placeholder="https://www.google.com/maps/embed?pb=..."
            className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {data.maps_embed && data.maps_embed.startsWith('https://') && (
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground">Previsualización del Mapa:</span>
            <div className="aspect-video w-full rounded-xl overflow-hidden border border-border">
              <iframe
                title="Google Maps Preview"
                src={data.maps_embed}
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </div>
        )}
      </div>

      {/* Social Media Inputs */}
      <div className="p-4 border border-border rounded-xl space-y-4 bg-muted/20">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
          Redes Sociales y Mensajería
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold block">WhatsApp (10 dígitos sin +52)</label>
            <input
              type="tel"
              value={data.social_whatsapp || ''}
              onChange={handleWhatsappChange}
              placeholder="Ej. 4421234567"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold block">Enlace Facebook (URL)</label>
            <input
              type="url"
              value={data.social_facebook || ''}
              onChange={(e) => handleChange('social_facebook', e.target.value)}
              placeholder="https://facebook.com/tu-colegio"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold block">Enlace Instagram (URL)</label>
            <input
              type="url"
              value={data.social_instagram || ''}
              onChange={(e) => handleChange('social_instagram', e.target.value)}
              placeholder="https://instagram.com/tu-colegio"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold block">Enlace TikTok (URL)</label>
            <input
              type="url"
              value={data.social_tiktok || ''}
              onChange={(e) => handleChange('social_tiktok', e.target.value)}
              placeholder="https://tiktok.com/@tu-colegio"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
