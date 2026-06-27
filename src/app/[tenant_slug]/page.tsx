import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { ContentBlock } from '@/types/database';
import { TenantConfig } from '@/types/tenant';

// Siempre hacer fetch fresco — nunca servir datos cacheados del build
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import Navbar from './_components/Navbar';
import HeroSection from './_components/HeroSection';
import StatsBar from './_components/StatsBar';
import ScheduleSection from './_components/ScheduleSection';
import EducationLevels from './_components/EducationLevels';
import WhyUs from './_components/WhyUs';
import InstitutionalFeed from './_components/InstitutionalFeed';
import Gallery from './_components/Gallery';
import Testimonials from './_components/Testimonials';
import LeadForm from './_components/LeadForm';
import LocationSection from './_components/LocationSection';
import Footer from './_components/Footer';

export default async function TenantPublicPage() {
  const headersList = headers();

  // Leer la configuración del tenant inyectada por el middleware
  const config: TenantConfig = {
    id:              headersList.get('x-tenant-id')      || '',
    name:            headersList.get('x-tenant-name') ? decodeURIComponent(headersList.get('x-tenant-name')!) : 'Colegio',
    slug:            headersList.get('x-tenant-slug')    || '',
    logo_url:        headersList.get('x-tenant-logo-url') ? decodeURIComponent(headersList.get('x-tenant-logo-url')!) : null,
    primary_color:   headersList.get('x-tenant-primary-color')   || '#1E40AF',
    secondary_color: headersList.get('x-tenant-secondary-color') || '#F59E0B',
    active_modules:  [],   // se carga desde Supabase
    timezone:        'America/Mexico_City',
  };

  // Un único fetch a Supabase para content_blocks + active_modules del tenant
  const supabase = createClient();

  const [blocksResult, tenantResult] = await Promise.all([
    supabase
      .from('content_blocks')
      .select('*')
      .eq('tenant_id', config.id)
      .eq('page', 'home')
      .eq('published', true)
      .order('order_index', { ascending: true }),
    supabase
      .from('tenants')
      .select('active_modules, timezone')
      .eq('id', config.id)
      .single(),
  ]);

  const blocks: ContentBlock[] = (blocksResult.data || []) as ContentBlock[];

  type TenantRow = { active_modules: string[]; timezone: string };
  const tenantRow = tenantResult.data as TenantRow | null;
  if (tenantRow) {
    config.active_modules = tenantRow.active_modules || [];
    config.timezone       = tenantRow.timezone || 'America/Mexico_City';
  }

  return (
    <main className="min-h-screen">
      <Navbar config={config} blocks={blocks} />
      {blocks.length === 0 ? (
        <>
          <HeroSection config={config} blocks={blocks} />
          <StatsBar config={config} blocks={blocks} />
          <ScheduleSection config={config} blocks={blocks} />
          <EducationLevels config={config} blocks={blocks} />
          <WhyUs config={config} blocks={blocks} />
          <InstitutionalFeed config={config} blocks={blocks} />
          <Gallery config={config} blocks={blocks} />
          <Testimonials config={config} blocks={blocks} />
          <LeadForm config={config} blocks={blocks} />
          <LocationSection config={config} blocks={blocks} />
        </>
      ) : (
        <>
          {blocks.map((block) => {
            switch (block.block_type) {
              case 'hero':
                return <HeroSection key={block.id} config={config} blocks={[block]} />;
              case 'stats':
                return <StatsBar key={block.id} config={config} blocks={[block]} />;
              case 'schedule':
                return <ScheduleSection key={block.id} config={config} blocks={[block]} />;
              case 'education_levels':
                return <EducationLevels key={block.id} config={config} blocks={[block]} />;
              case 'why_us':
                return <WhyUs key={block.id} config={config} blocks={[block]} />;
              case 'gallery':
                return <Gallery key={block.id} config={config} blocks={[block]} />;
              case 'testimonial':
                return <Testimonials key={block.id} config={config} blocks={[block]} />;
              case 'map':
                return <LocationSection key={block.id} config={config} blocks={[block]} />;
              case 'custom':
                if (block.data?.section === 'levels') return <EducationLevels key={block.id} config={config} blocks={[block]} />;
                if (block.data?.section === 'why_us') return <WhyUs key={block.id} config={config} blocks={[block]} />;
                return null;
              default:
                return null;
            }
          })}

          <InstitutionalFeed config={config} blocks={blocks} />
          <LeadForm config={config} blocks={blocks} />
        </>
      )}
      <Footer config={config} blocks={blocks} />
    </main>
  );
}
