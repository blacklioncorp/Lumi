'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { LandingComponentProps, Testimonial } from '@/types/tenant';
import { ContentBlock } from '@/types/database';

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id:     '1',
    author: 'María González',
    role:   'Mamá de Sofía, 3° Primaria',
    text:   'Desde el primer día se nota la calidez de los maestros y la organización del colegio. Mi hija llegó con miedo y ahora no quiere perderse ni un día. ¡La mejor decisión que tomamos como familia!',
    stars:  5,
  },
  {
    id:     '2',
    author: 'Carlos Ramírez',
    role:   'Papá de Diego, 1° Secundaria',
    text:   'La calidad académica es excelente, pero lo que más me impresiona es cómo trabajan los valores en cada actividad. Diego ha madurado mucho este año, ya se nota en casa.',
    stars:  5,
  },
  {
    id:     '3',
    author: 'Ana López',
    role:   'Mamá de Valentina, Preescolar',
    text:   'El ambiente es increíble. Valentina viene feliz cada mañana y eso lo dice todo. Los maestros siempre están disponibles para hablar y los avances son notorios.',
    stars:  5,
  },
];

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={16}
          fill={i < count ? '#F59E0B' : 'none'}
          stroke={i < count ? '#F59E0B' : '#D1D5DB'}
        />
      ))}
    </div>
  );
}

export default function Testimonials({ blocks }: LandingComponentProps) {
  const [index,    setIndex]    = useState(0);
  const [paused,   setPaused]   = useState(false);
  const [expanded, setExpanded] = useState(false);

  const testimonialBlock = blocks.find((b: ContentBlock) => b.block_type === 'testimonial');
  const testimonials: Testimonial[] = (testimonialBlock?.data?.items as Testimonial[] | undefined) ?? DEFAULT_TESTIMONIALS;
  const total = testimonials.length;

  const goNext = useCallback(() => {
    setIndex((v) => (v + 1) % total);
    setExpanded(false);
  }, [total]);

  const goPrev = () => {
    setIndex((v) => (v - 1 + total) % total);
    setExpanded(false);
  };

  // Auto-play cada 4 s
  useEffect(() => {
    if (paused || total <= 1) return;
    const timer = setInterval(goNext, 4000);
    return () => clearInterval(timer);
  }, [paused, goNext, total]);

  const current = testimonials[index];

  return (
    <section
      id="testimonios"
      className="py-20 bg-slate-50"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Encabezado */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Lo que dicen las familias
          </h2>
          <p className="text-gray-500 mt-2 text-base">
            Testimonios reales de nuestra comunidad escolar.
          </p>
        </div>

        {/* Card */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 sm:p-10 flex flex-col gap-5"
            >
              {/* Estrellas */}
              <StarRow count={current.stars} />

              {/* Texto */}
              <p
                className={`text-gray-700 text-base leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}
              >
                &ldquo;{current.text}&rdquo;
              </p>
              {current.text.length > 140 && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="text-xs font-semibold text-gray-400 hover:text-gray-600 self-start transition-colors"
                >
                  {expanded ? 'Leer menos' : 'Leer más'}
                </button>
              )}

              {/* Autor */}
              <div className="flex items-center gap-3 mt-2">
                {current.avatar_url ? (
                  <Image
                  src={current.avatar_url}
                  alt={current.author}
                  width={44}
                  height={44}
                  className="w-11 h-11 rounded-full object-cover"
                />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm">
                    {current.author.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{current.author}</div>
                  <div className="text-xs text-gray-500">{current.role}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Botones prev/next */}
          {total > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-md border border-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={goNext}
                className="absolute -right-4 sm:-right-6 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-md border border-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        {total > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => { setIndex(i); setExpanded(false); }}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: i === index ? '#1E40AF' : '#D1D5DB',
                  transform: i === index ? 'scale(1.3)' : 'scale(1)',
                }}
                aria-label={`Testimonio ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
