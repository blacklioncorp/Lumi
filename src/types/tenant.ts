import { Tenant, ContentBlock } from '@/types/database';

/**
 * Configuración del tenant para la landing pública.
 * Subconjunto de Tenant necesario para la UI.
 */
export type TenantConfig = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  active_modules: string[];
  timezone: string;
};

/** Re-export de ContentBlock para que los componentes no importen de database.ts directamente */
export type { ContentBlock };

/** Tipo del tenant completo (alias de Tenant del schema) */
export type { Tenant };

/** Props base que reciben todos los componentes de la landing */
export interface LandingComponentProps {
  config: TenantConfig;
  blocks: ContentBlock[];
}

/** Datos de fallback para testimonios */
export interface Testimonial {
  id: string;
  author: string;
  role: string;
  text: string;
  stars: number;
  avatar_url?: string;
}

/** Datos de fallback para estadísticas */
export interface Stat {
  value: number;
  suffix?: string;
  label: string;
}

/** Datos de fallback para niveles educativos */
export interface EducationLevelItem {
  id: string;
  name: string;
  description: string;
  icon: string;
}
