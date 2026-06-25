'use client';

import Image from 'next/image';
import { LandingComponentProps } from '@/types/tenant';
import { ContentBlock } from '@/types/database';

// SVG inline para íconos de redes — lucide-react v1.x no exporta redes sociales
const SOCIAL_SVGS: Record<string, string> = {
  instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  facebook:  'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  youtube:   'M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z',
  twitter:   'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.416-8.764-7.87-10.736h7.374l4.46 5.753zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  linkedin:  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
};

function SocialIcon({ platform, url }: { platform: string; url: string }) {
  const path = SOCIAL_SVGS[platform.toLowerCase()];
  if (!path) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
      aria-label={platform}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d={path} />
      </svg>
    </a>
  );
}

interface SocialLink {
  platform: string;
  url:      string;
}

const NAV_LINKS = [
  { label: 'Inicio',      href: '#hero'        },
  { label: 'Nosotros',    href: '#nosotros'    },
  { label: 'Niveles',     href: '#niveles'     },
  { label: 'Galería',     href: '#galeria'     },
  { label: 'Testimonios', href: '#testimonios' },
];

const LEVEL_LINKS = [
  { label: 'Maternal',    href: '#niveles' },
  { label: 'Preescolar',  href: '#niveles' },
  { label: 'Primaria',    href: '#niveles' },
  { label: 'Secundaria',  href: '#niveles' },
  { label: 'Preparatoria',href: '#niveles' },
];

function scrollTo(id: string) {
  document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Footer({ config, blocks }: LandingComponentProps) {
  const footerBlock = blocks.find((b: ContentBlock) => b.block_type === 'custom' && b.data?.section === 'footer');
  const description = (footerBlock?.data?.description as string | undefined) ?? `${config.name} es una institución educativa privada con más de tres décadas formando líderes íntegros, comprometidos con México y el mundo.`;
  const socialLinks: SocialLink[] = (footerBlock?.data?.social as SocialLink[] | undefined) ?? [];
  const phone  = (footerBlock?.data?.phone  as string | undefined) ?? '';
  const email  = (footerBlock?.data?.email  as string | undefined) ?? '';
  const address = (footerBlock?.data?.address as string | undefined) ?? '';

  return (
    <footer className="bg-slate-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Columna 1: Marca */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              {config.logo_url ? (
                <Image
                  src={config.logo_url}
                  alt={config.name}
                  width={100}
                  height={36}
                  className="h-9 w-auto object-contain brightness-0 invert"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
                  style={{ backgroundColor: config.primary_color }}
                >
                  {config.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="font-semibold text-white">{config.name}</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              {description}
            </p>
            {/* Redes sociales */}
            {socialLinks.length > 0 && (
              <div className="flex gap-3 mt-1">
                {socialLinks.map((social) => (
                  <SocialIcon key={social.platform} platform={social.platform} url={social.url} />
                ))}
              </div>
            )}
          </div>

          {/* Columna 2: Navegación */}
          <div>
            <p className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Navegación</p>
            <ul className="flex flex-col gap-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => scrollTo(link.href)}
                    className="text-slate-400 hover:text-white text-sm transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3: Niveles */}
          <div>
            <p className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Niveles</p>
            <ul className="flex flex-col gap-2.5">
              {LEVEL_LINKS.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => scrollTo(link.href)}
                    className="text-slate-400 hover:text-white text-sm transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div>
            <p className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Contacto</p>
            <ul className="flex flex-col gap-3 text-slate-400 text-sm">
              {address && <li>{address}</li>}
              {phone   && (
                <li>
                  <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-white transition-colors">
                    {phone}
                  </a>
                </li>
              )}
              {email   && (
                <li>
                  <a href={`mailto:${email}`} className="hover:text-white transition-colors">
                    {email}
                  </a>
                </li>
              )}
              <li>
                <button
                  onClick={() => scrollTo('#contacto')}
                  className="mt-1 inline-flex px-4 py-2 rounded-lg font-medium text-xs text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: config.primary_color }}
                >
                  Agendar visita →
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {config.name}. Todos los derechos reservados.</p>
          <p>
            Tecnología por{' '}
            <a
              href="https://lumis.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Lumis
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
