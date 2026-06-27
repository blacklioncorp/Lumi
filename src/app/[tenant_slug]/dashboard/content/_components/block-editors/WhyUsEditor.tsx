import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Point {
  icon: string;
  title: string;
  description: string;
}

interface WhyUsData {
  section: string;
  points: Point[];
  title?: string;
}

interface WhyUsEditorProps {
  data: Record<string, any>;
  onChange: (newData: Record<string, any>) => void;
  tenantId: string;
}

const AVAILABLE_ICONS = [
  { value: 'languages', label: 'Idiomas (Languages)' },
  { value: 'trophy', label: 'Deportes / Logros (Trophy)' },
  { value: 'laptop', label: 'Tecnología (Laptop)' },
  { value: 'star', label: 'Destacado (Star)' },
  { value: 'shield', label: 'Seguridad (Shield)' },
  { value: 'users', label: 'Comunidad (Users)' },
  { value: 'heart', label: 'Valores (Heart)' },
  { value: 'book-open', label: 'Académico (Book)' },
  { value: 'globe', label: 'Global (Globe)' },
];

export default function WhyUsEditor({ data, onChange, tenantId }: WhyUsEditorProps) {
  const points: Point[] = Array.isArray(data.points) ? data.points : [];

  const updatePoint = (index: number, field: keyof Point, value: string) => {
    const newPoints = [...points];
    newPoints[index] = { ...newPoints[index], [field]: value };
    onChange({ ...data, points: newPoints });
  };

  const removePoint = (index: number) => {
    const newPoints = [...points];
    newPoints.splice(index, 1);
    onChange({ ...data, points: newPoints });
  };

  const addPoint = () => {
    const newPoints = [
      ...points,
      { icon: 'star', title: 'Nuevo Punto', description: 'Descripción breve' },
    ];
    onChange({ ...data, points: newPoints });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">Puntos a Destacar</h3>
        <Button variant="outline" size="sm" onClick={addPoint} className="gap-2">
          <Plus className="w-4 h-4" /> Agregar Punto
        </Button>
      </div>

      <div className="space-y-4">
        {points.map((point: Point, index: number) => (
          <div key={index} className="p-4 border rounded-xl bg-card space-y-4 relative group">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="destructive"
                size="icon-xs"
                onClick={() => removePoint(index)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título del Punto</Label>
                <Input
                  value={point.title}
                  onChange={(e) => updatePoint(index, 'title', e.target.value)}
                  placeholder="Ej: Educación Bilingüe"
                />
              </div>
              <div className="space-y-2">
                <Label>Icono</Label>
                <Select
                  value={point.icon}
                  onValueChange={(val) => updatePoint(index, 'icon', val || '')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un icono" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ICONS.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        {icon.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={point.description}
                onChange={(e) => updatePoint(index, 'description', e.target.value)}
                placeholder="Breve descripción del punto destacado..."
                className="resize-none"
                rows={2}
              />
            </div>
          </div>
        ))}

        {points.length === 0 && (
          <div className="text-center p-8 border border-dashed rounded-xl text-muted-foreground">
            No has agregado ningún punto.
          </div>
        )}
      </div>
    </div>
  );
}
