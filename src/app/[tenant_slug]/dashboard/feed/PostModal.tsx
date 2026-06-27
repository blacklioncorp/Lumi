'use client';

import React, { useState } from 'react';
import { InstitutionalPost, PostType } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

const POST_TYPE_LABELS: Record<PostType, string> = {
  announcement: '📢 Comunicado',
  event:        '📅 Evento',
  achievement:  '🏆 Logro',
  news:         '📰 Noticia',
  instagram:    '📸 Instagram',
  facebook:     '👥 Facebook',
  youtube:      '▶️ YouTube',
  tiktok:       '🎵 TikTok',
  video_youtube:'🎬 Video YouTube',
  video_tiktok: '🎬 Video TikTok',
  reel_instagram:'📱 Reel Instagram',
  gallery_post: '🖼️ Galería',
};

interface PostModalProps {
  post: InstitutionalPost | null;
  onClose: () => void;
  onSave: (post: InstitutionalPost) => void;
}

export default function PostModal({ post, onClose, onSave }: PostModalProps) {
  const isNew = !post?.id;

  const [form, setForm] = useState({
    title: post?.title ?? '',
    content: post?.content ?? '',
    post_type: (post?.post_type ?? 'announcement') as PostType,
    media_url: post?.media_url ?? '',
    thumbnail_url: post?.thumbnail_url ?? '',
    embed_code: post?.embed_code ?? '',
    cta_label: post?.cta_label ?? '',
    cta_url: post?.cta_url ?? '',
    tags: (post?.tags ?? []).join(', '),
    is_pinned: post?.is_pinned ?? false,
    published: post?.published ?? false,
  });

  const [saving, setSaving] = useState(false);

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('El título es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags
          ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : null,
        media_url: form.media_url || null,
        thumbnail_url: form.thumbnail_url || null,
        embed_code: form.embed_code || null,
        cta_label: form.cta_label || null,
        cta_url: form.cta_url || null,
        ...(post?.id ? { id: post.id } : {}),
      };

      const res = await fetch('/api/feed/posts', {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Error al guardar la publicación.');
      }

      toast.success(isNew ? 'Publicación creada.' : 'Publicación actualizada.');
      onSave(result);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error desconocido.');
    } finally {
      setSaving(false);
    }
  };

  const isSocialType = ['instagram', 'facebook', 'youtube', 'tiktok'].includes(form.post_type);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Nueva Publicación' : 'Editar Publicación'}</DialogTitle>
          <DialogDescription>
            {isNew
              ? 'Completa los campos para agregar una nueva publicación al feed institucional.'
              : 'Modifica los campos de la publicación seleccionada.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de publicación</Label>
              <Select
                value={form.post_type}
                onValueChange={(val) => update('post_type', val || 'announcement')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(POST_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="Ej: Graduación de 6° grado 2025"
              />
            </div>
          </div>

          {/* Contenido */}
          <div className="space-y-2">
            <Label>Descripción / Contenido</Label>
            <Textarea
              value={form.content}
              onChange={(e) => update('content', e.target.value)}
              placeholder="Descripción completa de la publicación..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Embed o URL de media según tipo */}
          {isSocialType ? (
            <div className="space-y-2">
              <Label>Código Embed (iframe / script de la red social)</Label>
              <Textarea
                value={form.embed_code}
                onChange={(e) => update('embed_code', e.target.value)}
                placeholder='<iframe src="..." ...></iframe>'
                rows={3}
                className="resize-none font-mono text-xs"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>URL de Imagen / Video</Label>
                <Input
                  value={form.media_url}
                  onChange={(e) => update('media_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Thumbnail (miniatura)</Label>
                <Input
                  value={form.thumbnail_url}
                  onChange={(e) => update('thumbnail_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Botón CTA — Texto</Label>
              <Input
                value={form.cta_label}
                onChange={(e) => update('cta_label', e.target.value)}
                placeholder="Ej: Ver más detalles"
              />
            </div>
            <div className="space-y-2">
              <Label>Botón CTA — URL</Label>
              <Input
                value={form.cta_url}
                onChange={(e) => update('cta_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Etiquetas (separadas por coma)</Label>
            <Input
              value={form.tags}
              onChange={(e) => update('tags', e.target.value)}
              placeholder="Ej: graduación, primaria, 2025"
            />
          </div>

          {/* Switches */}
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_pinned}
                onCheckedChange={(val) => update('is_pinned', val)}
                id="is_pinned"
              />
              <Label htmlFor="is_pinned" className="cursor-pointer">📌 Fijar publicación</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.published}
                onCheckedChange={(val) => update('published', val)}
                id="published"
              />
              <Label htmlFor="published" className="cursor-pointer">🌐 Publicar ahora</Label>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="w-4 h-4 mr-1.5" /> Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : null}
            {isNew ? 'Crear Publicación' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
