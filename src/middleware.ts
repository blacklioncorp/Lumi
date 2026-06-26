import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { getTenantFromHostname } from '@/lib/tenant';

/**
 * Función ultra-ligera para parsear el JWT en el Edge Runtime sin dependencias
 */
function parseJwtEdge(token: string) {
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
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore static assets, internal paths, and API routes that are not ours
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 1. Update/Refresh Supabase Session
  const { supabase, supabaseResponse, user, session } = await updateSession(request);

  // 2. Extraer role y tenant_id del JWT sin tocar BD
  let userRole = 'anon';
  let userTenantId = null;

  if (session?.access_token) {
    const jwt = parseJwtEdge(session.access_token);
    userRole = jwt?.user_role || 'parent';
    userTenantId = jwt?.tenant_id || null;
  }

  // 3. Resolve Tenant (by hostname or path slug)
  const host = request.headers.get('host') || '';
  const pathSegments = pathname.split('/').filter(Boolean);
  const pathSlug = pathSegments[0] || undefined;

  const { tenant, isCustomDomain } = await getTenantFromHostname(
    host,
    supabase,
    pathSlug
  );

  // 4. Protección estricta de rutas de Superadmin (Nivel Global)
  if (pathname.startsWith('/superadmin')) {
    if (userRole !== 'superadmin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Si es superadmin, le permitimos pasar a sus rutas, sin reescribir tenant
    return supabaseResponse;
  }

  // Clonar headers para inyectar contexto
  const requestHeaders = new Headers(request.headers);

  // 5. Flujo con Tenant Resuelto
  if (tenant) {
    requestHeaders.set('x-tenant-id', tenant.id);
    requestHeaders.set('x-tenant-slug', tenant.slug);
    requestHeaders.set('x-tenant-name', encodeURIComponent(tenant.name));
    requestHeaders.set('x-tenant-custom-domain', isCustomDomain ? 'true' : 'false');
    requestHeaders.set('x-tenant-primary-color', tenant.primary_color);
    requestHeaders.set('x-tenant-secondary-color', tenant.secondary_color);
    if (tenant.logo_url) {
      requestHeaders.set('x-tenant-logo-url', encodeURIComponent(tenant.logo_url));
    }

    // Calcular el prefijo de redirección dinámico (evita loops y reescrituras incorrectas)
    const redirectPrefix = isCustomDomain ? '' : `/${tenant.slug}`;

    // Extraer el pathname limpio sin el prefijo del slug para verificar rutas
    const pathWithoutSlug = pathname.replace(new RegExp(`^\\/${tenant.slug}`), '') || '/';

    // A. Rutas de Login
    if (pathWithoutSlug === '/login') {
      if (user) {
        // Redirección inteligente si ya está logueado
        if (userRole === 'superadmin') {
          return NextResponse.redirect(new URL(`${redirectPrefix}/dashboard`, request.url));
        }
        if (userRole === 'school_admin' || userRole === 'editor') {
          return NextResponse.redirect(new URL(`${redirectPrefix}/dashboard`, request.url));
        }
        return NextResponse.redirect(new URL(`${redirectPrefix}/portal`, request.url));
      }
      
      // Si el usuario no está logueado pero el path es exactamente "/login" (sin slug), reescribir al path del login del tenant
      if (pathname === '/login') {
        const url = request.nextUrl.clone();
        url.pathname = `/${tenant.slug}/login`;
        return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
      }
    }

    // B. Protección de Rutas Internas del Tenant
    const isDashboard = pathWithoutSlug.startsWith('/dashboard') || 
                        pathWithoutSlug.startsWith('/tours') || 
                        pathWithoutSlug.startsWith('/leads') || 
                        pathWithoutSlug.startsWith('/students') || 
                        pathWithoutSlug.startsWith('/content');
    const isPortal = pathWithoutSlug.startsWith('/portal');

    if (isDashboard || isPortal) {
      // B1. Debe estar logueado
      if (!user) {
        return NextResponse.redirect(new URL(`${redirectPrefix}/login`, request.url));
      }
      
      // B2. Aislamiento Multi-Tenant (Security Audit)
      // Si el usuario pertenece a un colegio distinto al del dominio actual, bloquear.
      if (userRole !== 'superadmin' && userTenantId !== tenant.id) {
        // Se redirige a login con error de acceso cruzado
        return NextResponse.redirect(new URL(`${redirectPrefix}/login?error=unauthorized_tenant`, request.url));
      }

      // B3. Verificación de Roles por Área
      if (isDashboard && !['school_admin', 'editor', 'superadmin'].includes(userRole)) {
        return NextResponse.redirect(new URL(`${redirectPrefix}/portal`, request.url));
      }

      if (isPortal && !['parent', 'student', 'superadmin'].includes(userRole)) {
        return NextResponse.redirect(new URL(`${redirectPrefix}/dashboard`, request.url));
      }
    }

    // C. Reescribir ruta para App Router (si no tiene ya el slug)
    const url = request.nextUrl.clone();
    if (!pathname.startsWith(`/${tenant.slug}`)) {
      url.pathname = `/${tenant.slug}${url.pathname}`;
    }

    const rewriteResponse = NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });

    // Mantener cookies sincronizadas
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      rewriteResponse.cookies.set(cookie.name, cookie.value, cookie);
    });

    return rewriteResponse;
  }

  // 6. Flujo sin Tenant (Raíz del SaaS Lumis)
  // Si no hay tenant y el usuario intenta entrar a rutas protegidas
  const isProtectedRoot = pathname.startsWith('/dashboard') || pathname.startsWith('/portal');
  if (isProtectedRoot && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
