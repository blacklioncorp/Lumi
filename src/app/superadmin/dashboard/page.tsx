import React from 'react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import SuperadminDashboardClient from './superadmin-dashboard-client';

export const metadata = {
  title: 'Superadmin Dashboard | Lumis',
};

export default async function SuperadminDashboardPage() {
  // Protect page level using requireRole
  await requireRole(['superadmin']);

  const supabase = createClient();

  // Fetch tenants along with lead and student counts
  const { data: tenantsData, error } = await supabase
    .from('tenants')
    .select('*, leads:leads(id), students:students(id, status)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tenants list:', error);
  }

  const tenants = (tenantsData || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    custom_domain: t.custom_domain,
    plan: t.plan,
    active_modules: t.active_modules,
    logo_url: t.logo_url,
    primary_color: t.primary_color,
    secondary_color: t.secondary_color,
    is_active: t.is_active,
    created_at: t.created_at,
    leads_count: t.leads?.length || 0,
    students_count: t.students?.filter((s: any) => s.status === 'active').length || 0
  }));

  // Fetch platform-wide counts of leads and active students
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });

  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const activeTenants = tenants.filter((t) => t.is_active);
  
  let mrr = 0;
  activeTenants.forEach((t) => {
    if (t.plan === 'basic') mrr += 800;
    else if (t.plan === 'intermediate') mrr += 2500;
    else if (t.plan === 'premium') mrr += 6000;
  });

  const stats = {
    total_tenants: tenants.length,
    active_tenants: activeTenants.length,
    mrr,
    total_leads: totalLeads || 0,
    total_students: totalStudents || 0,
  };

  return (
    <SuperadminDashboardClient initialTenants={tenants} initialStats={stats} />
  );
}
