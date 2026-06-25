import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js';

// Tipos extraídos de schema.sql
export type Role = 'superadmin' | 'school_admin' | 'editor' | 'parent' | 'student';

export interface AppUser extends User {
  user_role?: Role;
  tenant_id?: string;
}

/**
 * Parsea el payload de un JWT asumiendo formato base64url sin dependencias externas
 */
export function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
}

/**
 * Extrae el rol y tenant_id del token de acceso actual en el servidor
 */
export async function getSessionUser(): Promise<AppUser | null> {
  const supabase = createClient();
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;

  // El custom_access_token_hook inyecta tenant_id y user_role en el accessToken
  const jwtPayload = parseJwt(session.access_token);
  
  const appUser: AppUser = {
    ...session.user,
    user_role: jwtPayload?.user_role || 'parent', // default fallback
    tenant_id: jwtPayload?.tenant_id,
  };

  return appUser;
}

/**
 * Verifica que el usuario tenga uno de los roles permitidos, de lo contrario redirige.
 */
export async function requireRole(allowedRoles: Role[], redirectTo: string = '/login') {
  const user = await getSessionUser();

  if (!user || !user.user_role || !allowedRoles.includes(user.user_role)) {
    redirect(redirectTo);
  }

  return user;
}

/**
 * Valida si el tenant_id del usuario coincide con el del request actual
 */
export function isSameTenant(userTenantId?: string, requestTenantId?: string): boolean {
  if (!userTenantId || !requestTenantId) return false;
  return userTenantId === requestTenantId;
}

/**
 * HOF para proteger rutas de API y asegurar que el request y el usuario
 * pertenecen al mismo tenant, excepto para 'superadmin' que tiene acceso global.
 */
export function withTenantGuard(
  handler: (request: Request, context: any, user: AppUser) => Promise<Response> | Response
) {
  return async (request: Request, context: any) => {
    const user = await getSessionUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // superadmin bypasses tenant checks
    if (user.user_role === 'superadmin') {
      return handler(request, context, user);
    }

    // Leemos el tenant inyectado por el middleware
    const requestTenantId = request.headers.get('x-tenant-id');

    if (!requestTenantId) {
      return new Response(JSON.stringify({ error: 'Tenant context missing' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!isSameTenant(user.tenant_id, requestTenantId)) {
      return new Response(JSON.stringify({ error: 'Tenant mismatch. Forbidden.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return handler(request, context, user);
  };
}
