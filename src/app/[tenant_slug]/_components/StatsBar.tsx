'use client';

import { useEffect, useRef, useState } from 'react';
import { LandingComponentProps, Stat } from '@/types/tenant';
import { ContentBlock } from '@/types/database';

const DEFAULT_STATS: Stat[] = [
  { value: 30,  label: 'Años de experiencia'        },
  { value: 850, label: 'Alumnos activos'             },
  { value: 95,  suffix: '%', label: 'Docentes certificados' },
  { value: 98,  suffix: '%', label: 'Egresados en universidades top' },
];

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Curva easeOut cúbica
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [target, active, duration]);

  return count;
}

function StatItem({ stat, active }: { stat: Stat; active: boolean }) {
  const count = useCountUp(stat.value, active);
  return (
    <div className="flex flex-col items-center gap-1 px-6">
      <span className="text-4xl sm:text-5xl font-extrabold text-white tabular-nums">
        {count}{stat.suffix ?? '+'}
      </span>
      <span className="text-sm text-slate-400 text-center font-medium leading-tight max-w-[120px]">
        {stat.label}
      </span>
    </div>
  );
}

export default function StatsBar({ config, blocks }: LandingComponentProps) {
  const ref     = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  // Buscar datos de stats en content_blocks
  const statsBlock = blocks.find((b: ContentBlock) => b.block_type === 'stats');
  const stats: Stat[] = (statsBlock?.data?.stats as Stat[] | undefined) ?? DEFAULT_STATS;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold: 0.35 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="stats"
      ref={ref}
      className="py-16 bg-slate-900"
    >
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center divide-y sm:divide-y-0 sm:divide-x divide-slate-700 gap-8 sm:gap-0">
          {stats.map((stat, i) => (
            <StatItem key={i} stat={stat} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}
