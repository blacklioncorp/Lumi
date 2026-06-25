'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface StatItem {
  value: string | number;
  label: string;
  suffix?: string;
}

interface StatsEditorProps {
  data: any;
  onChange: (newData: any) => void;
  tenantId: string;
}

export default function StatsEditor({ data = {}, onChange }: StatsEditorProps) {
  const statsList: StatItem[] = data.stats || [];

  const updateStats = (newList: StatItem[]) => {
    onChange({
      ...data,
      stats: newList,
    });
  };

  const handleStatChange = (index: number, key: keyof StatItem, value: any) => {
    const updated = [...statsList];
    updated[index] = {
      ...updated[index],
      [key]: value,
    };
    updateStats(updated);
  };

  const addStat = () => {
    if (statsList.length >= 6) {
      toast.warning('Puedes configurar un máximo de 6 estadísticas.');
      return;
    }
    const updated = [
      ...statsList,
      { value: '10', label: 'Nueva Estadística', suffix: '' },
    ];
    updateStats(updated);
  };

  const removeStat = (index: number) => {
    if (statsList.length <= 2) {
      toast.warning('Debes mantener al menos 2 estadísticas configuradas.');
      return;
    }
    const updated = statsList.filter((_, i) => i !== index);
    updateStats(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Lista de Estadísticas ({statsList.length})</h3>
        <button
          type="button"
          onClick={addStat}
          disabled={statsList.length >= 6}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:opacity-90 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" /> Agregar Stat
        </button>
      </div>

      <div className="space-y-4">
        {statsList.map((stat, idx) => (
          <div
            key={idx}
            className="p-4 border border-border rounded-xl bg-card space-y-3 relative group"
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => removeStat(idx)}
                className="p-1.5 bg-muted hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"
                title="Eliminar estadística"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <span className="text-[10px] font-extrabold uppercase bg-muted px-2 py-0.5 rounded border border-border text-muted-foreground">
              Estadística #{idx + 1}
            </span>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold block">Valor numérico</label>
                <input
                  type="text"
                  value={stat.value ?? ''}
                  onChange={(e) => handleStatChange(idx, 'value', e.target.value)}
                  placeholder="Ej. 100, 25, 1,500"
                  className="w-full px-2.5 py-1.5 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold block">Sufijo (Opcional)</label>
                <input
                  type="text"
                  value={stat.suffix ?? ''}
                  onChange={(e) => handleStatChange(idx, 'suffix', e.target.value)}
                  placeholder="Ej. %, +, años"
                  className="w-full px-2.5 py-1.5 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1 col-span-1">
                {/* empty block to align delete button space if layout needs */}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold block">Etiqueta explicativa (Label)</label>
              <input
                type="text"
                value={stat.label || ''}
                onChange={(e) => handleStatChange(idx, 'label', e.target.value)}
                placeholder="Ej. Docentes Certificados, Años de Experiencia"
                className="w-full px-2.5 py-1.5 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
