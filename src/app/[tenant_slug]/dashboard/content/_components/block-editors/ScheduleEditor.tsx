'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ScheduleEditorProps {
  data: any;
  onChange: (newData: any) => void;
  tenantId: string;
}

export default function ScheduleEditor({ data, onChange, tenantId }: ScheduleEditorProps) {
  const currentData = {
    schedule: data?.schedule || 'Lunes a Viernes 7:30 - 15:00',
    modality: data?.modality || 'Presencial con refuerzo digital',
    activities: data?.activities || 'Arte, Deportes, Robótica y más',
  };

  const handleChange = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Un día en el colegio</h3>
        <p className="text-sm text-muted-foreground">Configura los textos principales para la sección de horario y actividades.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Horario Base</Label>
          <Input 
            value={currentData.schedule} 
            onChange={(e) => handleChange('schedule', e.target.value)}
            placeholder="Ej. Lunes a Viernes 7:30 - 15:00"
          />
          <p className="text-xs text-muted-foreground">Horario general de clases.</p>
        </div>
        
        <div className="space-y-2">
          <Label>Modalidad</Label>
          <Input 
            value={currentData.modality} 
            onChange={(e) => handleChange('modality', e.target.value)}
            placeholder="Ej. Presencial con refuerzo digital"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Actividades Extracurriculares / Formativas</Label>
          <Input 
            value={currentData.activities} 
            onChange={(e) => handleChange('activities', e.target.value)}
            placeholder="Ej. Arte, Deportes, Robótica y más"
          />
          <p className="text-xs text-muted-foreground">Breve lista de lo que hacen en un día típico.</p>
        </div>
      </div>
    </div>
  );
}
