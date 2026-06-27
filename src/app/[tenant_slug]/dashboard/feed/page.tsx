import React from 'react';
import { requireRole } from '@/lib/auth';
import { getTenantFromHeaders } from '@/lib/tenant';
import { createClient } from '@/lib/supabase/server';
import { InstitutionalPost } from '@/types/database';
import EmptyState from '@/components/EmptyState';
import { Button, buttonVariants } from '@/components/ui/button';
import { Megaphone, Plus } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardFeedPage() {
  await requireRole(['school_admin', 'editor', 'superadmin']);
  const { tenant, isCustomDomain } = getTenantFromHeaders();
  if (!tenant) return null;

  const prefix = isCustomDomain ? '' : `/${tenant.slug}`;

  const supabase = createClient();
  const { data: posts } = await supabase
    .from('institutional_posts')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feed Institucional</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona comunicados, eventos y contenido de redes sociales.
          </p>
        </div>
        <Link href={`${prefix}/dashboard/feed/new`} className={buttonVariants({ variant: 'default' })}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Publicación
        </Link>
      </div>

      {(!posts || posts.length === 0) ? (
        <EmptyState
          title="Sin publicaciones"
          description="Aún no has creado ninguna publicación para el feed institucional."
          actionLabel="Crear mi primera publicación"
          onActionHref={`${prefix}/dashboard/feed/new`}
          icon={Megaphone}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20">
            <h3 className="font-semibold text-sm">Publicaciones Recientes</h3>
          </div>
          <div className="divide-y divide-border">
            {posts.map((post: InstitutionalPost) => (
              <div key={post.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0">
                    {post.post_type === 'event' ? '📅' : '📢'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{post.title}</h4>
                    <p className="text-xs text-muted-foreground">{post.post_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${post.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {post.published ? 'Publicado' : 'Borrador'}
                  </span>
                  <Link href={`${prefix}/dashboard/feed/${post.id}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                    Editar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
