import React from 'react';
import { requireRole } from '@/lib/auth';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  School, 
  Puzzle, 
  CreditCard, 
  BarChart2, 
  Settings
} from 'lucide-react';

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Component-level protection for superadmin paths
  const user = await requireRole(['superadmin']);

  const navItems = [
    { name: 'Dashboard', href: '/superadmin/dashboard', icon: LayoutDashboard, active: true },
    { name: 'Colegios', href: '/superadmin/dashboard', icon: School },
    { name: 'Módulos', href: '/superadmin/dashboard', icon: Puzzle },
    { name: 'Facturación', href: '/superadmin/dashboard', icon: CreditCard },
    { name: 'Analytics', href: '/superadmin/dashboard', icon: BarChart2 },
    { name: 'Configuración', href: '/superadmin/dashboard', icon: Settings },
  ];

  const userEmail = user?.email || 'admin@lumis.app';
  const initialLetters = userEmail.substring(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {/* Fixed Sidebar */}
      <aside className="w-60 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div className="flex flex-col flex-1">
          {/* Header Branding */}
          <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7.5 h-7.5 rounded-lg bg-white flex items-center justify-center font-bold text-slate-900 text-base shadow-sm">
                L
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Lumis</span>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-black text-red-100 bg-red-600/90 rounded-md tracking-wider">
              SUPERADMIN
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    item.active
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-sm">
              {initialLetters}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{userEmail}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Global Admin</p>
            </div>
          </div>
          <form action="/auth/logout" method="POST" className="mt-3">
            <button
              type="submit"
              className="w-full text-center text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 py-2 rounded-xl transition-all"
            >
              Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-slate-900 text-lg">Superadministración</h1>
            <span className="h-4.5 w-px bg-slate-200" />
            <span className="text-sm font-semibold text-slate-500">Panel de Control</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              PRODUCTION
            </span>
          </div>
        </header>

        {/* Sub-page Outlet */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
