import React from 'react';
import { getTenantFromHeaders } from '@/lib/tenant';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardLayout({
  children,
  params: _params,
}: {
  children: React.ReactNode;
  params: { tenant_slug: string };
}) {
  const { tenant, isCustomDomain } = getTenantFromHeaders();
  if (!tenant) return redirect('/');

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // Fetch user profile from public.users to check role
  const { data: profile } = (await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()) as { data: any; error: any };

  const userRole = profile?.role || 'parent';
  const fullName = profile?.full_name || user.email?.split('@')[0] || 'Usuario';

  const prefix = isCustomDomain ? '' : `/${tenant.slug}`;

  // Navigation items based on role
  const navItems = [
    { name: 'Dashboard', href: `${prefix}/dashboard`, icon: '📊' },
    { name: 'Leads', href: `${prefix}/dashboard/leads`, icon: '👥' },
    { name: 'Alumnos', href: `${prefix}/dashboard/students`, icon: '🎓' },
    { name: 'Tours', href: `${prefix}/dashboard/tours`, icon: '📅' },
  ];

  // Editors and admins can manage content blocks
  if (userRole === 'school_admin' || userRole === 'editor' || userRole === 'superadmin') {
    navItems.push({ name: 'Contenido', href: `${prefix}/dashboard/content`, icon: '🌐' });
  }

  // Only admins can see school branding settings
  if (userRole === 'school_admin' || userRole === 'superadmin') {
    navItems.push({ name: 'Configuración', href: `${prefix}/dashboard/settings`, icon: '⚙️' });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-sm"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {tenant.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm truncate">{tenant.name}</span>
            <span className="text-xs text-muted-foreground capitalize">{tenant.plan} Plan</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* User Profile Summary */}
        <div className="p-4 border-t border-border bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
              {fullName.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{fullName}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{userRole.replace('_', ' ')}</p>
            </div>
          </div>
          <form action="/auth/logout" method="POST" className="mt-3">
            <button
              type="submit"
              className="w-full text-left text-xs font-medium text-destructive hover:underline px-3 py-1"
            >
              Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-lg md:text-xl">Panel de Administración</span>
            <span 
              className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wider"
              style={{ backgroundColor: 'var(--secondary)', color: 'var(--primary)' }}
            >
              Lumis EdTech
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href={prefix || '/'} 
              target="_blank" 
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              Ver sitio público ↗
            </Link>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
