import { getTenantFromHeaders } from '@/lib/tenant';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import LoginForm from './login-form';

export default async function TenantLoginPage({
  params,
}: {
  params: { tenant_slug: string };
}) {
  const { tenant } = getTenantFromHeaders();

  if (!tenant || tenant.slug !== params.tenant_slug) {
    notFound();
  }

  // We need to fetch active_modules to know if SSO is enabled,
  // since the middleware doesn't inject the full array into headers.
  const supabase = createClient();
  const { data: tenantData } = await supabase
    .from('tenants')
    .select('active_modules')
    .eq('id', tenant.id)
    .single();

  const activeModules: string[] = (tenantData as { active_modules: string[] } | null)?.active_modules || [];
  const isGoogleSsoEnabled = activeModules.includes('google_sso');

  return (
    <div
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8"
      style={{ backgroundColor: `${tenant.primary_color}10` }} // Light background based on primary color
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {tenant.logo_url ? (
          <Image
            className="mx-auto h-24 w-auto object-contain"
            src={tenant.logo_url!}
            alt={tenant.name}
            width={200}
            height={96}
          />
        ) : (
          <div
            className="mx-auto h-24 w-24 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg"
            style={{ backgroundColor: tenant.primary_color }}
          >
            {tenant.name.charAt(0)}
          </div>
        )}
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Iniciar sesión
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Bienvenido a {tenant.name}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border-t-4" style={{ borderColor: tenant.secondary_color }}>
          <LoginForm
            tenantSlug={tenant.slug}
            isGoogleSsoEnabled={isGoogleSsoEnabled}
            primaryColor={tenant.primary_color}
          />
        </div>
      </div>
    </div>
  );
}
