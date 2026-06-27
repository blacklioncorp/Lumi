'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, Globe, MessagesSquare, Calendar, Link2 } from 'lucide-react';

interface IntegrationsFormProps {
  tenantId: string;
  activeModules: string[];
  initialData: any;
  currentCustomDomain: string;
}

export default function IntegrationsForm({
  tenantId,
  activeModules,
  initialData,
  currentCustomDomain
}: IntegrationsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    facebook_url: initialData?.facebook_url || '',
    instagram_url: initialData?.instagram_url || '',
    tiktok_url: initialData?.tiktok_url || '',
    youtube_url: initialData?.youtube_url || '',
    whatsapp_number: initialData?.whatsapp_number || '',
    whatsapp_message_template: initialData?.whatsapp_message_template || 'Hola {nombre}, gracias por contactar a {colegio}. En breve te atenderemos.',
    google_calendar_email: initialData?.google_calendar_email || '',
    custom_domain: currentCustomDomain || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/cms/tenant/integrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Integraciones guardadas correctamente.');
    } catch (error) {
      toast.error('Hubo un error al guardar las integraciones.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Redes Sociales */}
      <div className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
          <Link2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Redes Sociales</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold">Facebook Page URL</label>
            <input type="text" name="facebook_url" value={formData.facebook_url} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" placeholder="https://facebook.com/..." />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold">Instagram URL</label>
            <input type="text" name="instagram_url" value={formData.instagram_url} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" placeholder="https://instagram.com/..." />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold">TikTok URL</label>
            <input type="text" name="tiktok_url" value={formData.tiktok_url} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" placeholder="https://tiktok.com/@..." />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold">YouTube Canal URL</label>
            <input type="text" name="youtube_url" value={formData.youtube_url} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" placeholder="https://youtube.com/..." />
          </div>
        </div>
      </div>

      {/* WhatsApp Business */}
      {activeModules.includes('whatsapp') && (
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
            <MessagesSquare className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-bold">WhatsApp Business</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-1 max-w-sm">
              <label className="text-sm font-semibold">Número de WhatsApp (ej. 5512345678)</label>
              <input type="text" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" placeholder="55..." />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">Mensaje de bienvenida personalizable</label>
              <textarea name="whatsapp_message_template" value={formData.whatsapp_message_template} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm resize-none" placeholder="Hola {nombre}..." />
              <p className="text-xs text-muted-foreground mt-1">Variables disponibles: {'{nombre}'}, {'{colegio}'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Google Calendar */}
      {activeModules.includes('google_calendar') && (
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold">Google Calendar</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Estado de conexión: {formData.google_calendar_email ? <span className="text-green-600">Conectado ({formData.google_calendar_email})</span> : <span className="text-muted-foreground">No conectado</span>}</p>
            </div>
            <Button variant={formData.google_calendar_email ? "destructive" : "default"} size="sm">
              {formData.google_calendar_email ? "Desconectar" : "Conectar Google Calendar"}
            </Button>
          </div>
        </div>
      )}

      {/* Custom Domain */}
      <div className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Dominio Personalizado</h2>
        </div>
        <div className="space-y-4 max-w-md">
          <div className="space-y-1">
            <label className="text-sm font-semibold">Dominio actual configurado</label>
            <input type="text" name="custom_domain" value={formData.custom_domain} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" placeholder="miescuela.edu.mx" />
          </div>
          <div className="p-3 bg-muted rounded-lg text-sm border border-border">
            <p className="font-semibold mb-1">Instrucciones DNS:</p>
            <p className="text-muted-foreground">Agrega este registro CNAME en tu registrador de DNS:</p>
            <code className="block bg-background border border-border px-2 py-1 mt-2 rounded font-mono text-xs">www → cname.vercel-dns.com</code>
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-border pt-6">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Guardar Integraciones
        </Button>
      </div>
    </div>
  );
}
