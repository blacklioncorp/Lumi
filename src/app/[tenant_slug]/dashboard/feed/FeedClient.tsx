'use client';

import React, { useState } from 'react';
import { InstitutionalPost, PostType } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Megaphone, CalendarDays, Trophy, Newspaper,
  Share2, Link2, Video, Music2,
  Plus, Pencil, Trash2, Pin, PinOff, Eye, EyeOff,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import PostModal from './PostModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const POST_TYPE_META: Record<PostType, { label: string; Icon: React.ElementType; color: string }> = {
  announcement:  { label: 'Comunicado',  Icon: Megaphone,    color: 'bg-blue-100 text-blue-700' },
  event:         { label: 'Evento',      Icon: CalendarDays, color: 'bg-purple-100 text-purple-700' },
  achievement:   { label: 'Logro',       Icon: Trophy,       color: 'bg-amber-100 text-amber-700' },
  news:          { label: 'Noticia',     Icon: Newspaper,    color: 'bg-slate-100 text-slate-700' },
  instagram:     { label: 'Instagram',   Icon: Share2,       color: 'bg-pink-100 text-pink-700' },
  facebook:      { label: 'Facebook',    Icon: Link2,        color: 'bg-blue-100 text-blue-800' },
  youtube:       { label: 'YouTube',     Icon: Video,        color: 'bg-red-100 text-red-700' },
  tiktok:        { label: 'TikTok',      Icon: Music2,       color: 'bg-slate-800 text-white' },
  video_youtube: { label: 'Video YT',    Icon: Video,        color: 'bg-red-100 text-red-700' },
  video_tiktok:  { label: 'Video TT',    Icon: Music2,       color: 'bg-slate-800 text-white' },
  reel_instagram:{ label: 'Reel IG',     Icon: Share2,       color: 'bg-pink-100 text-pink-700' },
  gallery_post:  { label: 'Galería',     Icon: Newspaper,    color: 'bg-green-100 text-green-700' },
};

interface FeedClientProps {
  initialPosts: InstitutionalPost[];
}

export default function FeedClient({ initialPosts }: FeedClientProps) {
  const [posts, setPosts] = useState<InstitutionalPost[]>(initialPosts);
  const [search, setSearch] = useState('');
  const [modalPost, setModalPost] = useState<InstitutionalPost | null | 'new'>('new' as unknown as null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InstitutionalPost | null>(null);

  const filtered = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.post_type.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenNew = () => {
    setModalPost(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (post: InstitutionalPost) => {
    setModalPost(post);
    setIsModalOpen(true);
  };

  const handleModalSave = (saved: InstitutionalPost) => {
    setIsModalOpen(false);
    setPosts((prev) => {
      const existing = prev.findIndex((p) => p.id === saved.id);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
  };

  const handleTogglePublish = async (post: InstitutionalPost) => {
    const newPublished = !post.published;
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, published: newPublished } : p)));

    try {
      const res = await fetch('/api/feed/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, published: newPublished }),
      });
      if (!res.ok) throw new Error();
      toast.success(newPublished ? 'Publicación publicada.' : 'Publicación ocultada.');
    } catch {
      // revert
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, published: post.published } : p)));
      toast.error('Error al actualizar el estado.');
    }
  };

  const handleTogglePin = async (post: InstitutionalPost) => {
    const newPinned = !post.is_pinned;
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, is_pinned: newPinned } : p)));

    try {
      const res = await fetch('/api/feed/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, is_pinned: newPinned }),
      });
      if (!res.ok) throw new Error();
      toast.success(newPinned ? 'Publicación fijada.' : 'Publicación desfijada.');
    } catch {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, is_pinned: post.is_pinned } : p)));
      toast.error('Error al actualizar.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setPosts((prev) => prev.filter((p) => p.id !== target.id));

    try {
      const res = await fetch('/api/feed/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: target.id }),
      });
      if (!res.ok) throw new Error();
      toast.success('Publicación eliminada.');
    } catch {
      setPosts((prev) => [target, ...prev]);
      toast.error('Error al eliminar la publicación.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feed Institucional</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona comunicados, eventos y contenido de redes sociales.
          </p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Nueva Publicación
        </Button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por título o tipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: posts.length, color: 'text-foreground' },
          { label: 'Publicados', value: posts.filter((p) => p.published).length, color: 'text-green-600' },
          { label: 'Borradores', value: posts.filter((p) => !p.published).length, color: 'text-yellow-600' },
          { label: 'Fijados', value: posts.filter((p) => p.is_pinned).length, color: 'text-blue-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabla de publicaciones */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-xl bg-card">
          <Megaphone className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-foreground">
            {search ? 'Sin resultados' : 'Sin publicaciones'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            {search
              ? 'No se encontraron publicaciones con ese criterio.'
              : 'Crea tu primera publicación para el feed institucional.'}
          </p>
          {!search && (
            <Button className="mt-4 gap-2" onClick={handleOpenNew}>
              <Plus className="w-4 h-4" /> Crear publicación
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/20 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {filtered.length} publicación{filtered.length !== 1 ? 'es' : ''}
            </span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((post) => {
              const meta = POST_TYPE_META[post.post_type] ?? POST_TYPE_META.announcement;
              const Icon = meta.Icon;
              return (
                <div
                  key={post.id}
                  className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors"
                >
                  {/* Icono tipo */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm truncate">{post.title}</span>
                      {post.is_pinned && (
                        <Pin className="w-3 h-3 text-blue-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${meta.color}`}>
                        {meta.label}
                      </span>
                      <Badge
                        className={`text-[9px] px-1.5 font-bold ${
                          post.published
                            ? 'bg-green-500/15 text-green-700'
                            : 'bg-yellow-500/15 text-yellow-700'
                        }`}
                      >
                        {post.published ? 'Publicado' : 'Borrador'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString('es-MX', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleTogglePin(post)}
                      title={post.is_pinned ? 'Desfijar' : 'Fijar'}
                      className={post.is_pinned ? 'text-blue-500' : 'text-muted-foreground hover:text-blue-500'}
                    >
                      {post.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleTogglePublish(post)}
                      title={post.published ? 'Ocultar' : 'Publicar'}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {post.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleOpenEdit(post)}
                      title="Editar"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(post)}
                      title="Eliminar"
                      className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Crear/Editar */}
      {isModalOpen && (
        <PostModal
          post={modalPost as InstitutionalPost | null}
          onClose={() => setIsModalOpen(false)}
          onSave={handleModalSave}
        />
      )}

      {/* Dialog Confirmar Eliminar */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar publicación?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente <strong>&quot;{deleteTarget?.title}&quot;</strong>.
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Eliminar Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
