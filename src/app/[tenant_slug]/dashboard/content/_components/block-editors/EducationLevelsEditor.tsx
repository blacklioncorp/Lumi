'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Baby, Smile, BookOpen, GraduationCap, FlaskConical, Globe, Music, Trophy, Plus, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface EducationLevelsEditorProps {
  data: any;
  onChange: (newData: any) => void;
  tenantId: string;
}

const DEFAULT_LEVELS = [
  { id: 'maternal', active: false, name: 'Maternal', description: 'Atención integral temprana.', icon: 'Baby', color: '#1E40AF' },
  { id: 'preescolar', active: false, name: 'Preescolar', description: 'Primeros pasos en el aprendizaje.', icon: 'Smile', color: '#1E40AF' },
  { id: 'primaria', active: true, name: 'Primaria', description: 'Formación básica y valores.', icon: 'BookOpen', color: '#1E40AF' },
  { id: 'secundaria', active: true, name: 'Secundaria', description: 'Desarrollo académico y personal.', icon: 'FlaskConical', color: '#1E40AF' },
  { id: 'preparatoria', active: false, name: 'Preparatoria', description: 'Preparación preuniversitaria.', icon: 'GraduationCap', color: '#1E40AF' }
];

const AVAILABLE_ICONS = [
  { id: 'Baby', label: 'Bebé', icon: Baby },
  { id: 'Smile', label: 'Sonrisa', icon: Smile },
  { id: 'BookOpen', label: 'Libro', icon: BookOpen },
  { id: 'GraduationCap', label: 'Graduación', icon: GraduationCap },
  { id: 'FlaskConical', label: 'Ciencia', icon: FlaskConical },
  { id: 'Globe', label: 'Mundo', icon: Globe },
  { id: 'Music', label: 'Música', icon: Music },
  { id: 'Trophy', label: 'Trofeo', icon: Trophy }
];

export default function EducationLevelsEditor({ data, onChange, tenantId }: EducationLevelsEditorProps) {
  const currentLevels = (data?.levels && Array.isArray(data.levels) && data.levels.length > 0) 
    ? data.levels 
    : DEFAULT_LEVELS;

  const handleLevelChange = (id: string, field: string, value: any) => {
    const updatedLevels = currentLevels.map((lvl: any) => 
      lvl.id === id ? { ...lvl, [field]: value } : lvl
    );
    onChange({ ...data, levels: updatedLevels });
  };

  const handleToggleActive = (id: string, checked: boolean) => {
    handleLevelChange(id, 'active', checked);
  };

  const handleAddCustom = () => {
    const newId = `custom_${Date.now()}`;
    const newLevel = {
      id: newId,
      active: true,
      name: 'Nuevo Nivel',
      description: 'Descripción corta del nivel.',
      icon: 'GraduationCap',
      color: '#1E40AF'
    };
    onChange({ ...data, levels: [...currentLevels, newLevel] });
  };

  const handleRemoveLevel = (id: string) => {
    const updatedLevels = currentLevels.filter((lvl: any) => lvl.id !== id);
    onChange({ ...data, levels: updatedLevels });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Niveles Educativos</h3>
          <p className="text-sm text-muted-foreground">Activa y personaliza los niveles que ofrece tu colegio.</p>
        </div>
        <Button onClick={handleAddCustom} variant="outline" size="sm" className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Agregar nivel personalizado
        </Button>
      </div>

      <div className="space-y-4">
        {currentLevels.map((level: any) => (
          <div key={level.id} className="border border-border rounded-lg p-4 bg-muted/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Switch 
                  id={`active-${level.id}`}
                  checked={level.active} 
                  onCheckedChange={(checked) => handleToggleActive(level.id, checked)} 
                />
                <Label htmlFor={`active-${level.id}`} className="font-semibold cursor-pointer">
                  {level.name}
                </Label>
              </div>
              {level.id.startsWith('custom_') && (
                <Button variant="ghost" size="icon-sm" onClick={() => handleRemoveLevel(level.id)} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {level.active && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <Label>Nombre del nivel</Label>
                  <Input 
                    value={level.name} 
                    onChange={(e) => handleLevelChange(level.id, 'name', e.target.value)}
                    placeholder="Ej. Primaria Bilingüe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ícono representativo</Label>
                  <Select value={level.icon} onValueChange={(val) => handleLevelChange(level.id, 'icon', val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un ícono" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_ICONS.map(opt => {
                        const IconComp = opt.icon;
                        return (
                          <SelectItem key={opt.id} value={opt.id}>
                            <div className="flex items-center gap-2">
                              <IconComp className="w-4 h-4" />
                              <span>{opt.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Descripción corta (máx 120 caracteres)</Label>
                  <Textarea 
                    value={level.description} 
                    onChange={(e) => handleLevelChange(level.id, 'description', e.target.value)}
                    placeholder="Formación integral..."
                    maxLength={120}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color de acento</Label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={level.color} 
                      onChange={(e) => handleLevelChange(level.id, 'color', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                    <Input 
                      value={level.color} 
                      onChange={(e) => handleLevelChange(level.id, 'color', e.target.value)}
                      className="font-mono text-xs w-24 uppercase"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
