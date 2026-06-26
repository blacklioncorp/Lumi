import React from 'react';
import { getTenantFromHeaders } from '@/lib/tenant';
import { createClient } from '@/lib/supabase/server';
import LeadsTableClient from './leads-table-client';
import { Lead } from '@/types/database';

export default async function DashboardLeadsPage() {
  const { tenant } = getTenantFromHeaders();
  if (!tenant) return null;

  const supabase = createClient();
  let leads: Lead[] = [];

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      leads = data as Lead[];
    } else if (error) {
      console.error('Supabase error loading leads:', error);
    }
  } catch (err) {
    console.error('Failed to load leads:', err);
  }

  return (
    <LeadsTableClient leads={leads} tenant={tenant} />
  );
}
