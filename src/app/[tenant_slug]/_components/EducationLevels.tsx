'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Baby, Smile, BookOpen, GraduationCap, FlaskConical, Globe, Music, Trophy } from 'lucide-react';
import Link from 'next/link';
import { LandingComponentProps, EducationLevelItem } from '@/types/tenant';
import { ContentBlock } from '@/types/database';

const LEVEL_ICONS: Record<string, React.ElementType> = {
  Baby: Baby,
  Smile: Smile,
  BookOpen: BookOpen,
  FlaskConical: FlaskConical,
  GraduationCap: GraduationCap,
  Globe: Globe,
  Music: Music,
  Trophy: Trophy,
  // Compatibilidad con iconos antiguos
  maternal: Baby,
  preescolar: Smile,
  primaria: BookOpen,
  secundaria: FlaskConical,
  preparatoria: GraduationCap,
};

const DEFAULT_LEVELS: EducationLevelItem[] = [
  { id: 'maternal',    name: 'Maternal',     icon: 'Baby',    description: 'Atención personalizada y estimulación temprana para bebés de 1 a 3 años.'  },
  { id: 'preescolar',  name: 'Preescolar',   icon: 'Smile',  description: 'Aprendizaje lúdico que despierta la curiosidad y la creatividad (3-6 años).' },
  { id: 'primaria',    name: 'Primaria',     icon: 'BookOpen',    description: 'Formación integral con énfasis en lectura, matemáticas y valores.'           },
  { id: 'secundaria',  name: 'Secundaria',   icon: 'FlaskConical',  description: 'Ciencias, tecnología y artes para adolescentes que exploran su identidad.'   },
  { id: 'preparatoria',name: 'Preparatoria', icon: 'GraduationCap',description: 'Orientación vocacional y bachillerato con enfoque universitario.'            },
];

export default function EducationLevels({ config, blocks }: LandingComponentProps) {
  const ref  = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Buscar bloque tipo education_levels o el antiguo custom
  const levelsBlock = blocks.find((b: ContentBlock) => b.block_type === 'education_levels' || (b.block_type === 'custom' && b.data?.section === 'levels'));
  
  // Extraer niveles y filtrar solo los activos
  let levels: any[] = [];
  if (levelsBlock?.data?.levels && Array.isArray(levelsBlock.data.levels)) {
    levels = levelsBlock.data.levels.filter((l: any) => l.active !== false); // Por defecto true si no está explícito
  }
  
  // Si no hay datos (ej. recién añadido) o arreglo vacío, mostrar los 5 por defecto
  if (levels.length === 0) {
    levels = DEFAULT_LEVELS;
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="niveles" className="py-20 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="text-center mb-14">
          <span
            className="text-xs font-bold tracking-widest uppercase mb-3 inline-block"
            style={{ color: config.primary_color }}
          >
            Oferta educativa
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Niveles educativos
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto text-base">
            Acompañamos a cada alumno en cada etapa de su desarrollo con programas diseñados para su edad.
          </p>
        </div>

        {/* Grid de cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {levels.map((level, i) => {
            const Icon = LEVEL_ICONS[level.icon] ?? BookOpen;
            const accentColor = level.color || config.primary_color;
            
            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 28 }}
                animate={visible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.12 }}
                className="group relative flex flex-col items-center text-center p-6 rounded-2xl border border-gray-100 bg-white shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                style={{
                  // Borde de color tenant o personalizado al hacer hover
                  ['--tw-ring-color' as string]: accentColor,
                }}
              >
                {/* Ícono con fondo */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors"
                  style={{ backgroundColor: `${accentColor}15` }}
                >
                  <Icon
                    size={26}
                    style={{ color: accentColor }}
                  />
                </div>

                {/* Nombre */}
                <h3 className="font-bold text-gray-900 text-sm mb-1.5 leading-tight">
                  {level.name}
                </h3>

                {/* Descripción */}
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  {level.description}
                </p>

                <Link
                  href={`/${config.slug}/admissions`}
                  className="text-xs font-semibold transition-colors hover:underline"
                  style={{ color: accentColor }}
                >
                  Más información →
                </Link>

                {/* Borde superior colorido al hover */}
                <div
                  className="absolute top-0 inset-x-0 h-0.5 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: accentColor }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
