import React from 'react';
import { requireRole } from '@/lib/auth';
import { getTenantFromHeaders } from '@/lib/tenant';
import { createAdminClient } from '@/lib/supabase/admin';
import { InstitutionalPost } from '@/types/database';
import FeedClient from './FeedClient';

export default async function DashboardFeedPage() {
  await requireRole(['school_admin', 'editor', 'superadmin']);
  const { tenant } = getTenantFromHeaders();
  if (!tenant) return null;

  const supabase = createAdminClient();
  let posts: InstitutionalPost[] = [];

  try {
    const { data, error } = await (supabase as any)
      .from('institutional_posts')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      posts = data as InstitutionalPost[];
    }
  } catch (err) {
    console.error('Failed to load institutional posts:', err);
  }

  return <FeedClient initialPosts={posts} />;
}
