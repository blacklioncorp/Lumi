'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Laptop, Activity } from 'lucide-react';
import { LandingComponentProps } from '@/types/tenant';
import { ContentBlock } from '@/types/database';

export default function ScheduleSection({ config, blocks }: LandingComponentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Buscar el bloque tipo 'schedule'
  const scheduleBlock = blocks.find((b: ContentBlock) => b.block_type === 'schedule');
  
  // Datos por defecto si no hay bloque
  const data = scheduleBlock?.data || {
    schedule: 'Lunes a Viernes 7:30 - 15:00',
    modality: 'Presencial con refuerzo digital',
    activities: 'Arte, Deportes, Robótica y más'
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-16 bg-slate-50 border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Un día en el colegio
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          
          {/* Horario */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0 }}
            className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100"
          >
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Horario Base</h3>
            <p className="text-slate-600 text-sm">{data.schedule}</p>
          </motion.div>

          {/* Modalidad */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100"
          >
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Laptop className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Modalidad</h3>
            <p className="text-slate-600 text-sm">{data.modality}</p>
          </motion.div>

          {/* Actividades */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100"
          >
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <Activity className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Actividades</h3>
            <p className="text-slate-600 text-sm">{data.activities}</p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
