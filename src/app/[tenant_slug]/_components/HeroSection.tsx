'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { ContentBlock } from '@/types/database';
import { LandingComponentProps } from '@/types/tenant';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: 'easeOut' as const, delay },
});

function scrollTo(id: string) {
  document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function HeroSection({ config, blocks }: LandingComponentProps) {
  // Buscar el bloque 'hero' en content_blocks
  const heroBlock = blocks.find((b: ContentBlock) => b.block_type === 'hero');

  const bgImageUrl    = (heroBlock?.data?.bg_image_url   as string | undefined) ?? null;
  const headline      = (heroBlock?.data?.headline        as string | undefined) ?? `Forjando a los líderes del mañana en ${config.name}`;
  const subheadline   = (heroBlock?.data?.subheadline     as string | undefined) ?? 'Educación de excelencia que combina valores, tecnología y desarrollo humano para un mundo en constante cambio.';
  const showAdmissions = config.active_modules.includes('admissions_open');

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Fondo: imagen o gradiente dinámico */}
      {bgImageUrl ? (
        <Image
          src={bgImageUrl}
          alt="Fondo del colegio"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${config.primary_color} 0%, ${config.secondary_color} 100%)`,
          }}
        />
      )}

      {/* Overlay oscuro para contraste de texto */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      {/* Contenido */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center gap-6 pt-16">

        {/* Badge de admisiones */}
        {showAdmissions && (
          <motion.div {...fadeUp(0)}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide bg-white/15 backdrop-blur-sm text-white border border-white/25">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: config.secondary_color }}
              />
              Inscripciones abiertas ciclo 2025-2026
            </span>
          </motion.div>
        )}

        {/* H1 */}
        <motion.h1
          {...fadeUp(showAdmissions ? 0.12 : 0)}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight text-balance"
        >
          {headline}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          {...fadeUp(0.24)}
          className="text-lg sm:text-xl text-white/80 max-w-2xl leading-relaxed"
        >
          {subheadline}
        </motion.p>

        {/* Botones CTA */}
        <motion.div
          {...fadeUp(0.36)}
          className="flex flex-col sm:flex-row gap-4 mt-2"
        >
          <button
            onClick={() => scrollTo('#contacto')}
            className="px-7 py-3.5 rounded-xl font-semibold text-white text-sm shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
            style={{ backgroundColor: config.primary_color }}
          >
            Agendar visita
          </button>
          <button
            onClick={() => scrollTo('#niveles')}
            className="px-7 py-3.5 rounded-xl font-semibold text-sm text-white border border-white/50 backdrop-blur-sm transition-all hover:bg-white/10 hover:scale-105 active:scale-95"
          >
            Conocer más
          </button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        onClick={() => scrollTo('#stats')}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/60 hover:text-white transition-colors"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5, ease: 'easeOut' }}
        aria-label="Scroll hacia abajo"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          <ChevronDown size={32} />
        </motion.div>
      </motion.button>
    </section>
  );
}
