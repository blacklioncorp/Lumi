'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const AVAILABLE_MODULES = [
  'crm',
  'website',
  'whatsapp',
  'google_calendar',
  'social_media',
  'payments',
  'parent_portal',
  'pwa',
  'nfc_access',
  'safelunch',
  'analytics',
  'google_sso' // Agregado como opción de SSO
];

export default function ModulesToggle({
  tenantId,
  initialModules,
}: {
  tenantId: string;
  initialModules: string[];
}) {
  const [modules, setModules] = useState<string[]>(initialModules);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = (moduleName: string) => {
    setModules((prev) =>
      prev.includes(moduleName)
        ? prev.filter((m) => m !== moduleName)
        : [...prev, moduleName]
    );
  };

  const saveModules = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/superadmin/tenants/${tenantId}/modules`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active_modules: modules }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar módulos');
      }

      toast.success('Módulos actualizados exitosamente');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('No se pudo guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 border rounded-md shadow-sm">
      <h3 className="text-lg font-medium mb-4">Módulos Activos</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {AVAILABLE_MODULES.map((mod) => (
          <div key={mod} className="flex items-center space-x-2">
            <Switch
              id={`${tenantId}-${mod}`}
              checked={modules.includes(mod)}
              onCheckedChange={() => handleToggle(mod)}
            />
            <Label htmlFor={`${tenantId}-${mod}`} className="cursor-pointer">
              {mod}
            </Label>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={saveModules} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Módulos'}
        </Button>
      </div>
    </div>
  );
}
