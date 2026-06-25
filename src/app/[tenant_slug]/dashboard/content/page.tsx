import React from 'react';
import { getTenantFromHeaders } from '@/lib/tenant';
import { createClient } from '@/lib/supabase/server';
import { ContentBlock } from '@/types/database';

export default async function DashboardContentPage() {
  const { tenant } = getTenantFromHeaders();
  if (!tenant) return null;

  const supabase = createClient();
  let blocks: ContentBlock[] = [];

  try {
    const { data, error } = await supabase
      .from('content_blocks')
      .select('*')
      .order('order_index', { ascending: true });

    if (!error && data) {
      blocks = data as any;
    }
  } catch (err) {
    console.error('Failed to load content blocks:', err);
  }

  // Fallback mock data if DB is empty
  const displayBlocks = blocks.length > 0 ? blocks : [
    {
      id: '1',
      tenant_id: tenant.id,
      page: 'home',
      block_type: 'hero',
      order_index: 0,
      published: true,
      data: {
        title: 'Forjando a los líderes del mañana',
        subtitle: 'Admisiones Abiertas para ciclo 2026',
        description: 'Excelencia académica, valores éticos y el desarrollo de competencias tecnológicas de vanguardia.',
      },
    },
    {
      id: '2',
      tenant_id: tenant.id,
      page: 'home',
      block_type: 'stats',
      order_index: 1,
      published: true,
      data: {
        stats: [
          { label: 'Años de Trayectoria', value: '25+' },
          { label: 'Egresados Exitosos', value: '1,500+' },
          { label: 'Docentes Certificados', value: '100%' },
        ]
      },
    },
    {
      id: '3',
      tenant_id: tenant.id,
      page: 'home',
      block_type: 'faq',
      order_index: 2,
      published: false,
      data: {
        questions: [
          { q: '¿Tienen transporte escolar?', a: 'Sí, contamos con rutas seguras en toda la ciudad.' },
          { q: '¿Qué idiomas enseñan?', a: 'Educación bilingüe Español-Inglés con certificaciones Cambridge.' }
        ]
      },
    }
  ] as unknown as ContentBlock[];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Web Builder (CMS)</h1>
          <p className="text-muted-foreground mt-1">Modifica las secciones y textos del sitio público del colegio.</p>
        </div>
        <button 
          className="self-start px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90 shadow-md flex items-center gap-2"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          <span>+</span> Agregar Bloque de Sección
        </button>
      </div>

      {/* Sections list */}
      <div className="space-y-4">
        {displayBlocks.map((block) => (
          <div key={block.id} className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-muted text-muted-foreground border border-border uppercase rounded">
                  Index {block.order_index}
                </span>
                <span className="font-mono text-xs font-semibold capitalize text-primary">
                  🧩 Tipo: {block.block_type}
                </span>
                <span 
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    block.published 
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                      : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                  }`}
                >
                  {block.published ? 'Publicado' : 'Borrador'}
                </span>
              </div>
              <h3 className="font-bold text-base mt-2 capitalize">
                {block.block_type === 'hero' ? block.data.title : `${block.block_type} Section`}
              </h3>
              <p className="text-xs text-muted-foreground max-w-lg">
                {block.block_type === 'hero' 
                  ? block.data.description 
                  : JSON.stringify(block.data)}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button className="px-3 py-1.5 text-xs font-semibold border border-border hover:bg-muted rounded-lg transition-colors">
                Editar Datos
              </button>
              <button 
                className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                {block.published ? 'Despublicar' : 'Publicar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
