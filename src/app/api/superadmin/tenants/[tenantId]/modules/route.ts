import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
  try {
    // 1. Verificación de permisos
    // Solo un superadmin puede acceder a esta ruta. requireRole arroja redirección o devuelve el user.
    // Al ser un API route, si requireRole redirige, next/navigation maneja el throw.
    // Para APIs es mejor usar una validación explícita si preferimos retornar JSON.
    // Reutilizaremos lógica propia aquí o capturaremos el redirect, pero como getSessionUser 
    // no arroja throw si no redirigimos explícitamente, haremos una validación manual o usamos nuestro HOF.
    
    // Al ser una ruta /api, es preferible retornar 401/403 en JSON
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Leemos el role desde el JWT inyectado en metadata (o parseando el accessToken como en el middleware).
    // Usaremos el JWT en sesión (o en su defecto si no está, asumimos que no es superadmin)
    const { data: { session } } = await supabase.auth.getSession();
    let isSuperAdmin = false;
    
    if (session?.access_token) {
      // Decode JWT de forma simple (el mismo que en el middleware/auth.ts)
      const base64Url = session.access_token.split('.')[1];
      if (base64Url) {
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const jwt = JSON.parse(jsonPayload);
        if (jwt?.user_role === 'superadmin') {
          isSuperAdmin = true;
        }
      }
    }

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden. Requires superadmin role.' }, { status: 403 });
    }

    // 2. Parse payload
    const body = await request.json();
    const active_modules = body.active_modules || body.modules;

    if (!Array.isArray(active_modules)) {
      return NextResponse.json({ error: 'active_modules o modules debe ser un arreglo' }, { status: 400 });
    }

    // 3. Update en BD usando el cliente autenticado
    // Gracias al RLS (policy "superadmin_tenants_all"), el superadmin puede modificar cualquier tenant.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('tenants')
      .update({ active_modules })
      .eq('id', params.tenantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating tenant modules:', error);
      return NextResponse.json({ error: 'Error interno al actualizar la base de datos' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Unhandled error in PATCH modules:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
