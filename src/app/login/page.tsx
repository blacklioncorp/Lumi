'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function GenericLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      let errorMsg = 'Credenciales inválidas. Por favor, verifica tu correo y contraseña.';
      if (authError.message.includes('Invalid login credentials')) {
        errorMsg = 'Credenciales inválidas. Por favor, verifica tu correo y contraseña.';
      } else if (authError.message.includes('Email not confirmed')) {
        errorMsg = 'El correo electrónico no ha sido verificado.';
      } else {
        errorMsg = authError.message;
      }
      setError(errorMsg);
      setLoading(false);
      return;
    }

    const user = authData?.user;
    if (!user) {
      setError('No se pudo recuperar la información del usuario.');
      setLoading(false);
      return;
    }

    try {
      // Query users table for role and tenant_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('id', user.id)
        .maybeSingle();

      const typedUserData = userData as { role: string; tenant_id: string } | null;

      if (userError || !typedUserData) {
        // Check if user is superadmin (fallback by parsing auth user metadata if users table fails)
        const userRole = user.user_metadata?.role || 'parent';
        if (userRole === 'superadmin') {
          router.push('/superadmin/dashboard');
          router.refresh();
          return;
        }
        setError('Error al obtener perfil de usuario o no tienes un rol válido asignado.');
        setLoading(false);
        return;
      }

      const { role, tenant_id } = typedUserData;

      if (role === 'superadmin') {
        router.push('/superadmin/dashboard');
        router.refresh();
        return;
      }

      if (!tenant_id) {
        setError('Tu usuario no está asociado a ningún colegio.');
        setLoading(false);
        return;
      }

      // Fetch tenant slug
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('slug')
        .eq('id', tenant_id)
        .maybeSingle();

      const typedTenantData = tenantData as { slug: string } | null;

      if (tenantError || !typedTenantData?.slug) {
        setError('Error al resolver la información de tu colegio.');
        setLoading(false);
        return;
      }

      const tenantSlug = typedTenantData.slug;

      if (role === 'school_admin' || role === 'editor') {
        router.push(`/${tenantSlug}/dashboard`);
      } else if (role === 'parent' || role === 'student') {
        router.push(`/${tenantSlug}/portal`);
      } else {
        setError('Rol de usuario no autorizado.');
      }
      router.refresh();
    } catch (err) {
      console.error('Error during generic login routing:', err);
      setError('Hubo un error inesperado al procesar tu inicio de sesión.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-white text-xl shadow-md">
            L
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">Lumis</span>
          <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-slate-800 rounded-full uppercase tracking-wider">
            Portal
          </span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Iniciar Sesión
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Acceso global para administradores y directivos
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-500">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-slate-700 font-semibold">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 rounded-xl border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                placeholder="director@colegio.edu.mx"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-700 font-semibold">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 rounded-xl border-slate-200 focus:border-slate-400 focus:ring-slate-400"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
