'use client';

import React from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';

interface TestimonialItem {
  id: string;
  author: string;
  role: string;
  text: string;
  stars: number;
  avatar_url?: string;
}

interface TestimonialsEditorProps {
  data: any;
  onChange: (newData: any) => void;
  tenantId: string;
}

export default function TestimonialsEditor({ data = {}, onChange }: TestimonialsEditorProps) {
  const itemsList: TestimonialItem[] = data.items || [];

  const updateTestimonials = (newList: TestimonialItem[]) => {
    onChange({
      ...data,
      items: newList,
    });
  };

  const handleTestimonialChange = (index: number, key: keyof TestimonialItem, value: any) => {
    const updated = [...itemsList];
    updated[index] = {
      ...updated[index],
      [key]: value,
    };
    updateTestimonials(updated);
  };

  const addTestimonial = () => {
    if (itemsList.length >= 8) {
      toast.warning('Puedes configurar un máximo de 8 testimonios.');
      return;
    }
    const newId = typeof window !== 'undefined' && window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : Math.random().toString(36).substring(2, 9);

    const updated = [
      ...itemsList,
      {
        id: newId,
        author: 'Nombre del Padre/Madre',
        role: 'Mamá/Papá de alumno(a)',
        text: 'Escribe aquí la opinión sobre el colegio.',
        stars: 5,
      },
    ];
    updateTestimonials(updated);
  };

  const removeTestimonial = (index: number) => {
    const updated = itemsList.filter((_, i) => i !== index);
    updateTestimonials(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Lista de Testimonios ({itemsList.length})</h3>
        <button
          type="button"
          onClick={addTestimonial}
          disabled={itemsList.length >= 8}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:opacity-90 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" /> Agregar Testimonio
        </button>
      </div>

      <div className="space-y-4">
        {itemsList.map((test, idx) => (
          <div
            key={test.id || idx}
            className="p-4 border border-border rounded-xl bg-card space-y-3 relative group"
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => removeTestimonial(idx)}
                className="p-1.5 bg-muted hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"
                title="Eliminar testimonio"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <span className="text-[10px] font-extrabold uppercase bg-muted px-2 py-0.5 rounded border border-border text-muted-foreground">
              Testimonio #{idx + 1}
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold block">Autor (Nombre)</label>
                <input
                  type="text"
                  value={test.author || ''}
                  onChange={(e) => handleTestimonialChange(idx, 'author', e.target.value)}
                  placeholder="Ej. Sofía García"
                  className="w-full px-2.5 py-1.5 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold block">Rol / Descripción</label>
                <input
                  type="text"
                  value={test.role || ''}
                  onChange={(e) => handleTestimonialChange(idx, 'role', e.target.value)}
                  placeholder="Ej. Mamá de Mateo, 3° Primaria"
                  className="w-full px-2.5 py-1.5 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Rating Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold block">Valoración (Estrellas)</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleTestimonialChange(idx, 'stars', star)}
                    className="p-0.5 transition-colors focus:outline-none"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= (test.stars || 5)
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-muted border-none'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Text counter */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold block">Opinión</label>
                <span className={`text-[10px] ${
                  (test.text || '').length > 200 ? 'text-red-500 font-bold' : 'text-muted-foreground'
                }`}>
                  {(test.text || '').length}/200
                </span>
              </div>
              <textarea
                value={test.text || ''}
                onChange={(e) => {
                  const txt = e.target.value;
                  if (txt.length <= 200) {
                    handleTestimonialChange(idx, 'text', txt);
                  } else {
                    toast.warning('La opinión tiene un límite de 200 caracteres.');
                  }
                }}
                placeholder="Ingresa la opinión del padre o madre sobre el colegio..."
                rows={3}
                className="w-full px-2.5 py-1.5 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
