'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function TenantLoginPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params?.tenant_slug as string;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Authenticate with Supabase
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      // Redirect to dashboard on successful login
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-6 py-12">
      <div className="w-full max-w-md space-y-8 bg-card border border-border p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-xl mx-auto shadow-md"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {tenantSlug?.substring(0, 2).toUpperCase()}
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">
            Portal Institucional
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresa a tu cuenta de <span className="font-semibold uppercase">{tenantSlug}</span>
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="ejemplo@colegio.edu.mx"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-sm font-semibold">Contraseña</label>
              <a href="#" className="text-xs text-primary hover:underline">¿Olvidaste tu contraseña?</a>
            </div>
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-semibold text-white rounded-lg shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground mt-4">
          ¿No tienes acceso? Contacta a la administración de tu plantel.
        </div>
      </div>
    </div>
  );
}
