'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, HeartHandshake, Users } from 'lucide-react';
import { LandingComponentProps } from '@/types/tenant';
import { ContentBlock } from '@/types/database';

interface WhyUsItem {
  icon: string;
  title: string;
  description: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  trophy:       Trophy,
  hearthandshake: HeartHandshake,
  users:        Users,
};

const DEFAULT_ITEMS: WhyUsItem[] = [
  {
    icon:        'trophy',
    title:       'Excelencia Académica',
    description: 'Programas certificados por las más altas instituciones de México con enfoque bilingüe y desarrollo del pensamiento crítico.',
  },
  {
    icon:        'hearthandshake',
    title:       'Formación Integral',
    description: 'Cultivamos valores, ética e inteligencia emocional junto con las competencias académicas para la vida.',
  },
  {
    icon:        'users',
    title:       'Comunidad',
    description: 'Una comunidad activa de padres, alumnos y maestros comprometidos con el crecimiento de cada estudiante.',
  },
];

export default function WhyUs({ config, blocks }: LandingComponentProps) {
  const ref     = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const whyBlock = blocks.find((b: ContentBlock) => b.block_type === 'custom' && b.data?.section === 'why_us');
  const items: WhyUsItem[] = (whyBlock?.data?.items as WhyUsItem[] | undefined) ?? DEFAULT_ITEMS;
  const title   = (whyBlock?.data?.title as string | undefined) ?? '¿Por qué elegirnos?';
  const subtitle = (whyBlock?.data?.subtitle as string | undefined) ?? 'Más de tres décadas construyendo futuros brillantes con un enfoque que va más allá de las aulas.';

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="nosotros" className="py-20 bg-slate-50" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="text-center mb-14">
          <span
            className="text-xs font-bold tracking-widest uppercase mb-3 inline-block"
            style={{ color: config.primary_color }}
          >
            Nuestra diferencia
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            {title}
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, i) => {
            const Icon = ICON_MAP[item.icon] ?? Trophy;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                animate={visible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.12 }}
                className="flex flex-col items-start gap-4 p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${config.primary_color}15` }}
                >
                  <Icon size={24} style={{ color: config.primary_color }} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
