'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  LayoutTemplate,
  BarChart3,
  MessageSquare,
  Image,
  MapPin,
  GraduationCap,
  Award,
  Code,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react';
import { ContentBlock } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Mapeo de íconos según block_type
const BLOCK_ICONS: Record<string, React.ElementType> = {
  hero: LayoutTemplate,
  stats: BarChart3,
  testimonial: MessageSquare,
  gallery: Image,
  contact: MapPin,
  custom: Code,
};

interface BlockCardProps {
  block: ContentBlock;
  isSelected: boolean;
  onSelect: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
}

export default function BlockCard({
  block,
  isSelected,
  onSelect,
  onTogglePublish,
  onDelete,
  onRename,
}: BlockCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // dnd-kit sortable integration
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  // Resolver ícono y nombre dinámicamente según sub-sección en custom o tipo de bloque
  let IconComponent = BLOCK_ICONS[block.block_type] || Code;
  let defaultName = `Sección ${block.block_type.replace('_', ' ')}`;

  if (block.block_type === 'custom') {
    if (block.data?.section === 'levels') {
      IconComponent = GraduationCap;
      defaultName = 'Niveles Educativos';
    } else if (block.data?.section === 'why_us') {
      IconComponent = Award;
      defaultName = '¿Por qué elegirnos?';
    }
  } else if (block.block_type === 'testimonial') {
    IconComponent = MessageSquare;
    defaultName = 'Testimonios';
  }

  const displayName = block.data?.title || defaultName;
  const [editedName, setEditedName] = useState(displayName);

  const handleSaveRename = () => {
    if (editedName.trim() && editedName !== displayName) {
      onRename(editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRename();
    if (e.key === 'Escape') {
      setEditedName(displayName);
      setIsEditingName(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-xl transition-all flex items-center justify-between p-4 bg-card ${
        isSelected
          ? 'border-primary ring-1 ring-primary/30 shadow-md'
          : 'border-border hover:border-muted-foreground/30 shadow-sm'
      }`}
    >
      {/* Lado izquierdo: Grip + Icon + Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Grip Handle para drag and drop */}
        <div
          {...attributes}
          {...listeners}
          style={{ touchAction: 'none' }}
          className="cursor-grab text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Icono del Bloque */}
        <div
          onClick={onSelect}
          className={`p-2.5 rounded-lg cursor-pointer ${
            isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          }`}
        >
          <IconComponent className="w-4 h-4" />
        </div>

        {/* Info y nombre editable */}
        <div className="min-w-0 flex-1 pr-2">
          {isEditingName ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-full max-w-[180px] px-2 py-0.5 text-sm font-semibold border border-primary rounded bg-background focus:outline-none"
              />
              <button
                onClick={handleSaveRename}
                className="p-1 text-green-600 hover:bg-muted rounded"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span
                onDoubleClick={() => setIsEditingName(true)}
                onClick={onSelect}
                className="font-semibold text-sm truncate cursor-pointer hover:underline flex-1"
                title="Doble clic para editar nombre"
              >
                {displayName}
              </span>
              <button
                onClick={() => setIsEditingName(true)}
                className="p-1 opacity-0 hover:opacity-100 group-hover:opacity-100 text-muted-foreground rounded hover:bg-muted"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Badges */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">
              {block.block_type}
            </span>
            <Badge
              variant={block.published ? 'default' : 'secondary'}
              className={`text-[9px] px-1.5 py-0.25 font-bold ${
                block.published
                  ? 'bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/20'
                  : 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20'
              }`}
            >
              {block.published ? 'Publicado' : 'Borrador'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Lado derecho: Acciones */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Toggle Ocultar/Mostrar */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onTogglePublish}
          title={block.published ? 'Despublicar (Ocultar)' : 'Publicar (Mostrar)'}
          className="text-muted-foreground hover:text-foreground"
        >
          {block.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </Button>

        {/* Editar */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onSelect}
          title="Editar detalles"
          className={isSelected ? 'text-primary' : 'text-muted-foreground hover:text-primary'}
        >
          <Edit2 className="w-4 h-4" />
        </Button>

        {/* Eliminar */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsDeleteDialogOpen(true)}
          title="Eliminar bloque"
          className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Dialogo de Confirmación para Eliminar */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar bloque de contenido?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará de forma permanente el bloque **{displayName}** de tu landing page.
              Los datos configurados dentro de esta sección se perderán y no se pueden recuperar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete();
                setIsDeleteDialogOpen(false);
              }}
            >
              Eliminar Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
