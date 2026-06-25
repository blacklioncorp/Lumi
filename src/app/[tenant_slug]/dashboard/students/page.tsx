import React from 'react';
import { getTenantFromHeaders } from '@/lib/tenant';
import { createClient } from '@/lib/supabase/server';
import { Student } from '@/types/database';

export default async function DashboardStudentsPage() {
  const { tenant } = getTenantFromHeaders();
  if (!tenant) return null;

  const supabase = createClient();
  let students: Student[] = [];

  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('full_name', { ascending: true });

    if (!error && data) {
      students = data;
    }
  } catch (err) {
    console.error('Failed to load students:', err);
  }

  // Fallback mock data if DB is empty
  const displayStudents = students.length > 0 ? students : [
    {
      id: '1',
      tenant_id: tenant.id,
      full_name: 'Santiago Hernández González',
      grade: '3° Primaria',
      group_name: 'A',
      nfc_id: 'SL-8849-0092',
      status: 'active',
      enrolled_at: new Date().toISOString(),
    },
    {
      id: '2',
      tenant_id: tenant.id,
      full_name: 'Mateo Beltrán Ruiz',
      grade: '1° Secundaria',
      group_name: 'B',
      nfc_id: 'SL-7463-1120',
      status: 'active',
      enrolled_at: new Date().toISOString(),
    },
    {
      id: '3',
      tenant_id: tenant.id,
      full_name: 'Sofía Castro Medina',
      grade: 'Kínder 3',
      group_name: 'A',
      nfc_id: null,
      status: 'active',
      enrolled_at: new Date().toISOString(),
    }
  ] as unknown as Student[];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Control Escolar</h1>
          <p className="text-muted-foreground mt-1">Expedientes de alumnos y tarjetas NFC (SafeLunch).</p>
        </div>
        <button 
          className="self-start px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90 shadow-md flex items-center gap-2"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          <span>+</span> Inscribir Alumno
        </button>
      </div>

      {/* Students Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                <th className="p-4">Nombre Completo</th>
                <th className="p-4">Grado y Grupo</th>
                <th className="p-4">NFC ID (SafeLunch)</th>
                <th className="p-4">Estatus</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayStudents.map((student) => (
                <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 font-medium">{student.full_name}</td>
                  <td className="p-4">
                    {student.grade} - {student.group_name || 'Sin grupo'}
                  </td>
                  <td className="p-4">
                    {student.nfc_id ? (
                      <span className="font-mono text-xs bg-muted border border-border px-2 py-1 rounded select-all">
                        🔑 {student.nfc_id}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        No vinculada
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 capitalize">
                      {student.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="text-xs font-semibold text-primary hover:underline">
                      Asignar Tarjeta NFC
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
