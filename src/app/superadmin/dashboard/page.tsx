import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { Tenant } from '@/types/database';
import ModulesToggle from './modules-toggle';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Superadmin Dashboard | Lumis',
};

export default async function SuperadminDashboardPage() {
  // Proteger ruta a nivel componente
  await requireRole(['superadmin']);

  const supabase = createClient();
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tenants:', error);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Superadmin</h1>
          <p className="text-sm text-gray-500">Gestión de Colegios (Tenants) en Lumis</p>
        </div>
        <Button>+ Nuevo Colegio</Button>
      </div>

      <div className="space-y-8">
        {tenants?.map((tenant: Tenant) => (
          <div key={tenant.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{tenant.name}</h2>
                <p className="text-sm text-gray-500">
                  Slug: {tenant.slug} | Plan: <span className="uppercase font-medium">{tenant.plan}</span>
                </p>
              </div>
              <div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tenant.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {tenant.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            <div className="p-6">
              <ModulesToggle
                tenantId={tenant.id}
                initialModules={tenant.active_modules as string[]}
              />
            </div>
          </div>
        ))}

        {(!tenants || tenants.length === 0) && (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed">
            <p className="text-gray-500">No hay colegios registrados aún.</p>
          </div>
        )}
      </div>
    </div>
  );
}
