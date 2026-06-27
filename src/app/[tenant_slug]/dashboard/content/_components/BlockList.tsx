'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Plus,
  LayoutTemplate,
  BarChart3,
  MessageSquare,
  Image,
  MapPin,
  GraduationCap,
  Award,
  Code,
  Clock,
} from 'lucide-react';
import { ContentBlock } from '@/types/database';
import BlockCard from './BlockCard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';

// Tipos de bloques disponibles para añadir
const AVAILABLE_BLOCK_TYPES = [
  { type: 'hero', label: 'Encabezado (Hero)', desc: 'Banner principal con título y llamada a la acción.', icon: LayoutTemplate },
  { type: 'stats', label: 'Estadísticas', desc: 'Métricas numéricas claves en columnas.', icon: BarChart3 },
  { type: 'schedule', label: 'Un Día en el Colegio', desc: 'Horarios, Modalidad y Actividades.', icon: Clock },
  { type: 'education_levels', label: 'Niveles Educativos', desc: 'Maternal, Preescolar, Primaria, etc.', icon: GraduationCap },
  { type: 'why_us', label: '¿Por qué elegirnos?', desc: 'Puntos clave sobre el valor del colegio.', icon: Award },
  { type: 'gallery', label: 'Galería de Fotos', desc: 'Grid de imágenes destacadas.', icon: Image },
  { type: 'testimonial', label: 'Testimonios', desc: 'Opiniones y reseñas de padres de familia.', icon: MessageSquare },
  { type: 'map', label: 'Información de Contacto', desc: 'Dirección, redes, teléfono y mapa de Google.', icon: MapPin },
  { type: 'custom', label: 'Sección Libre', desc: 'Código HTML personalizado.', icon: Code },
];

interface BlockListProps {
  blocks: ContentBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onTogglePublish: (id: string) => void;
  onDeleteBlock: (id: string) => void;
  onRenameBlock: (id: string, newName: string) => void;
  onReorderBlocks: (reordered: ContentBlock[]) => void;
  onAddBlock: (type: string) => void;
}

export default function BlockList({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onTogglePublish,
  onDeleteBlock,
  onRenameBlock,
  onReorderBlocks,
  onAddBlock,
}: BlockListProps) {
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);

  // dnd-kit sensors setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // evita drag accidental al hacer click en el grip
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);

      const reorderedList = arrayMove(blocks, oldIndex, newIndex).map(
        (block, index) => ({
          ...block,
          order_index: index,
        })
      );

      onReorderBlocks(reorderedList);
    }
  };

  const handleSelectBlockType = (type: string) => {
    onAddBlock(type);
    setIsAddBlockOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Botón superior para agregar bloque */}
      <Dialog open={isAddBlockOpen} onOpenChange={setIsAddBlockOpen}>
        <DialogTrigger
          render={
            <Button className="w-full py-6 flex items-center justify-center gap-2 border-2 border-dashed border-primary/20 hover:border-primary/50 bg-primary/5 hover:bg-primary/10 text-primary font-semibold rounded-xl transition-all">
              <Plus className="w-5 h-5" /> Agregar bloque de sección
            </Button>
          }
        />

        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Elige un tipo de sección</DialogTitle>
            <DialogDescription>
              Selecciona el tipo de contenido que deseas incorporar a la página de tu colegio.
            </DialogDescription>
          </DialogHeader>

          {/* Grid de opciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 max-h-[350px] overflow-y-auto pr-1">
            {AVAILABLE_BLOCK_TYPES.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  onClick={() => handleSelectBlockType(item.type)}
                  className="p-4 border border-border rounded-xl text-left hover:border-primary hover:bg-primary/5 transition-all flex gap-3 group"
                >
                  <div className="p-2 bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary rounded-lg self-start transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                      {item.label}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed truncate-2-lines">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lista Sortable con dnd-kit */}
      {blocks.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground">
          <p className="text-sm">No tienes secciones añadidas.</p>
          <p className="text-xs mt-1">Haz clic en el botón superior para crear una sección.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {blocks.map((block) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  onSelect={() => onSelectBlock(block.id)}
                  onTogglePublish={() => onTogglePublish(block.id)}
                  onDelete={() => onDeleteBlock(block.id)}
                  onRename={(newName) => onRenameBlock(block.id, newName)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
