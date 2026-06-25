'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function TenantContactPage() {
  const params = useParams();
  const tenantSlug = params?.tenant_slug as string;

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    childrenCount: 1,
    levelInterest: 'preescolar',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantSlug,
          fullName: formData.fullName,
          email: formData.email || null,
          phone: formData.phone || null,
          whatsapp: formData.whatsapp || null,
          childrenCount: Number(formData.childrenCount),
          levelInterest: formData.levelInterest,
          notes: formData.notes || null,
          source: 'web',
        }),
      });

      if (!response.ok) {
        throw new Error('Hubo un problema al enviar tus datos. Inténtalo de nuevo.');
      }

      setSuccess(true);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        whatsapp: '',
        childrenCount: 1,
        levelInterest: 'preescolar',
        notes: '',
      });
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white" style={{ backgroundColor: 'var(--primary)' }}>
                {tenantSlug?.substring(0, 2).toUpperCase()}
              </div>
              <span className="font-semibold text-lg tracking-tight uppercase">{tenantSlug}</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/about" className="hover:text-primary transition-colors">Nosotros</Link>
            <Link href="/admissions" className="hover:text-primary transition-colors">Admisiones</Link>
            <Link href="/contact" className="text-primary transition-colors">Contacto</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Portal Institucional</Link>
            <Link href="/contact" className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90 shadow-md" style={{ backgroundColor: 'var(--primary)' }}>Agendar Visita</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Agendar Visita</h1>
          <p className="text-muted-foreground mt-2">Déjanos tus datos y un asesor se pondrá en contacto contigo para coordinar una visita personalizada.</p>
        </div>

        {success ? (
          <div className="p-6 border border-green-500/30 bg-green-500/10 rounded-2xl text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg">✓</div>
            <h3 className="font-bold text-lg text-green-600 dark:text-green-400">¡Registro Exitoso!</h3>
            <p className="text-sm text-muted-foreground">Hemos recibido tus datos correctamente. Nos comunicaremos contigo a la brevedad.</p>
            <button 
              onClick={() => setSuccess(false)}
              className="mt-2 text-sm underline text-primary font-medium"
            >
              Registrar otro prospecto
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 border border-border bg-card/60 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-semibold">Nombre Completo del Padre/Madre *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Ej. María González"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold">Correo Electrónico</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="ejemplo@correo.com"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-semibold">Teléfono Celular *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="10 dígitos"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="levelInterest" className="text-sm font-semibold">Nivel de Interés *</label>
                <select
                  id="levelInterest"
                  name="levelInterest"
                  value={formData.levelInterest}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  <option value="maternal">Maternal</option>
                  <option value="preescolar">Preescolar</option>
                  <option value="primaria">Primaria</option>
                  <option value="secundaria">Secundaria</option>
                  <option value="preparatoria">Preparatoria</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="childrenCount" className="text-sm font-semibold">Cantidad de Hijos *</label>
                <input
                  type="number"
                  id="childrenCount"
                  name="childrenCount"
                  min="1"
                  required
                  value={formData.childrenCount}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-semibold">Notas adicionales (Opcional)</label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                placeholder="Preguntas específicas sobre becas, horarios, etc."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-semibold text-white rounded-lg shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card/40 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {tenantSlug?.toUpperCase()}. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:underline">Aviso de Privacidad</Link>
            <Link href="/terms" className="hover:underline">Términos de Servicio</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
