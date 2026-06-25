import React from 'react';
import { getTenantFromHeaders } from '@/lib/tenant';
import { notFound } from 'next/navigation';

export default function TenantLayout({
  children,
  params: _params,
}: {
  children: React.ReactNode;
  params: { tenant_slug: string };
}) {
  const { tenant } = getTenantFromHeaders();

  // If no tenant was resolved by middleware for this slug, return 404
  if (!tenant) {
    notFound();
  }

  // Create branding style properties
  const brandingStyles = {
    '--tenant-primary': tenant.primary_color,
    '--tenant-secondary': tenant.secondary_color,
  } as React.CSSProperties;

  return (
    <div style={brandingStyles} className="tenant-theme min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
