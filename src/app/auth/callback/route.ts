import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseJwt } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // `next` parameter specifies where to go after successful login.
  // We use this as a hint, but we still apply role-based routing if `next` isn't very specific.
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session) {
      // 1. Extraemos role y tenant del accessToken
      const jwtPayload = parseJwt(data.session.access_token);
      const role = jwtPayload?.user_role || 'parent';
      const tenantId = jwtPayload?.tenant_id;

      // 2. Routing basado en Roles (si la ruta no es forzada mediante `next` o si `next` es genérico)
      // Si el usuario intentó acceder a una URL específica, se la respetamos (salvo que sea la raíz)
      if (next === '/' || next === '/login') {
        if (role === 'superadmin') {
          return NextResponse.redirect(`${origin}/superadmin/dashboard`);
        }
        
        // Si no es superadmin y no tiene tenant, es un error (orphaned user)
        if (!tenantId) {
          // Redirigimos a una página genérica de error o login
          return NextResponse.redirect(`${origin}/login?error=no_tenant_assigned`);
        }

        // Si llegó hasta aquí, redirigimos al dashboard o portal de su tenant.
        // Nota: Next.js middleware re-escribirá estas URLs al [tenant_slug] correspondiente 
        // basándose en el hostname. Para que funcione bien la redirección HTTP,
        // devolvemos la URL limpia que el middleware procesará.
        if (role === 'school_admin' || role === 'editor') {
          return NextResponse.redirect(`${origin}/dashboard`);
        } else {
          return NextResponse.redirect(`${origin}/portal`);
        }
      }

      // 3. Fallback: redirigir a `next`
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Redirección si falla el código o no hay código (invalid or expired)
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
