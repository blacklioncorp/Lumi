import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { getTenantFromHostname } from '@/lib/tenant';

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
  const { supabase, supabaseResponse, user } = await updateSession(request);

  // 2. Resolve Tenant
  const host = request.headers.get('host') || '';
  const { tenant, isCustomDomain } = await getTenantFromHostname(host, supabase);

  // Clone headers from original response to preserve cookies
  const requestHeaders = new Headers(request.headers);

  // If a tenant is resolved, inject its branding and ID to request headers
  if (tenant) {
    requestHeaders.set('x-tenant-id', tenant.id);
    requestHeaders.set('x-tenant-slug', tenant.slug);
    requestHeaders.set('x-tenant-name', tenant.name);
    requestHeaders.set('x-tenant-custom-domain', isCustomDomain ? 'true' : 'false');
    requestHeaders.set('x-tenant-primary-color', tenant.primary_color);
    requestHeaders.set('x-tenant-secondary-color', tenant.secondary_color);
    if (tenant.logo_url) {
      requestHeaders.set('x-tenant-logo-url', tenant.logo_url);
    }

    // 3. Routing & Path Rewriting for Tenants
    // If the path is /login, we let it pass. If they are already logged in, redirect to /dashboard
    if (pathname === '/login') {
      if (user) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      // Rewrite to tenant login page internally
      const url = request.nextUrl.clone();
      url.pathname = `/${tenant.slug}/login`;
      return NextResponse.rewrite(url, {
        request: {
          headers: requestHeaders,
        },
      });
    }

    // Check if the route is a dashboard route and needs authentication
    const isDashboardRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/tours') || pathname.startsWith('/leads') || pathname.startsWith('/students') || pathname.startsWith('/content');
    
    if (isDashboardRoute && !user) {
      // Redirect to login page
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Rewrite request internally to `/[tenant_slug]/original_path`
    const url = request.nextUrl.clone();
    url.pathname = `/${tenant.slug}${url.pathname}`;

    // Return rewritten URL with inject headers and updated cookies
    const rewriteResponse = NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });

    // Copy cookies from updateSession response to the rewriteResponse
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      rewriteResponse.cookies.set(cookie.name, cookie.value, cookie);
    });

    return rewriteResponse;
  }

  // 4. Root App (Lumis Landing Page) routing
  // If we are on the root domain, but trying to access dashboard paths, redirect to root login or block
  if (pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Return original response
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files or api/auth
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
