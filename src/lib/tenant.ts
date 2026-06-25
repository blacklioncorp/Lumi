import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Tenant } from '@/types/database';
import { ROOT_DOMAIN } from './constants';
import { headers } from 'next/headers';

export interface ResolvedTenant {
  tenant: Tenant | null;
  isCustomDomain: boolean;
  slug: string | null;
}

/**
 * Resolves a tenant from a given hostname.
 * Handles custom domains and subdomains.
 */
export async function getTenantFromHostname(
  hostname: string,
  supabase: SupabaseClient<Database>
): Promise<ResolvedTenant> {
  // Normalize hostname (remove port and lowercase)
  const cleanHost = hostname.split(':')[0].toLowerCase();
  const cleanRoot = ROOT_DOMAIN.split(':')[0].toLowerCase();

  // If the host is exactly the root domain, there is no tenant (it's the main landing page of Lumis)
  if (cleanHost === cleanRoot) {
    return { tenant: null, isCustomDomain: false, slug: null };
  }

  let isCustomDomain = false;
  let slug: string | null = null;

  // Check if it's a subdomain of the root domain
  if (cleanHost.endsWith(`.${cleanRoot}`)) {
    slug = cleanHost.replace(`.${cleanRoot}`, '');
  } else {
    // If it doesn't end with the root domain, it's a custom domain
    isCustomDomain = true;
  }

  try {
    let query = supabase.from('tenants').select('*').eq('is_active', true);

    if (isCustomDomain) {
      query = query.eq('custom_domain', cleanHost);
    } else if (slug) {
      query = query.eq('slug', slug);
    } else {
      return { tenant: null, isCustomDomain: false, slug: null };
    }

    const { data: tenant, error } = await query.maybeSingle() as { data: any; error: any };

    if (error || !tenant) {
      return { tenant: null, isCustomDomain, slug };
    }

    return {
      tenant,
      isCustomDomain,
      slug: tenant.slug,
    };
  } catch (err) {
    console.error('Error resolving tenant:', err);
    return { tenant: null, isCustomDomain, slug };
  }
}

/**
 * Read the tenant details from request headers (in Server Components).
 * These headers are injected by the middleware.
 */
export function getTenantFromHeaders(): ResolvedTenant {
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id');
  const tenantSlug = headersList.get('x-tenant-slug');
  const isCustomDomainStr = headersList.get('x-tenant-custom-domain');
  const tenantName = headersList.get('x-tenant-name');
  const primaryColor = headersList.get('x-tenant-primary-color') || '#1E40AF';
  const secondaryColor = headersList.get('x-tenant-secondary-color') || '#F59E0B';
  const logoUrl = headersList.get('x-tenant-logo-url');

  if (!tenantId) {
    return { tenant: null, isCustomDomain: false, slug: null };
  }

  return {
    tenant: {
      id: tenantId,
      slug: tenantSlug || '',
      name: tenantName || '',
      custom_domain: isCustomDomainStr === 'true' ? 'yes' : null, // placeholder
      plan: 'basic', // placeholder
      active_modules: [], // placeholder
      logo_url: logoUrl,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      timezone: 'America/Mexico_City',
      is_active: true,
      created_at: '',
      updated_at: '',
    },
    isCustomDomain: isCustomDomainStr === 'true',
    slug: tenantSlug,
  };
}
