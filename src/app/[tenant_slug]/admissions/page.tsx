import React from 'react';
import { getTenantFromHeaders } from '@/lib/tenant';
import Link from 'next/link';

export default function TenantAdmissionsPage() {
  const { tenant } = getTenantFromHeaders();

  if (!tenant) return null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              {tenant.logo_url ? (
                <img src={tenant.logo_url} alt={tenant.name} className="h-8 w-auto object-contain" />
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white" style={{ backgroundColor: 'var(--primary)' }}>
                  {tenant.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className="font-semibold text-lg tracking-tight">{tenant.name}</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/about" className="hover:text-primary transition-colors">Nosotros</Link>
            <Link href="/admissions" className="text-primary transition-colors">Admisiones</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Contacto</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Portal Institucional</Link>
            <Link href="/contact" className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90 shadow-md" style={{ backgroundColor: 'var(--primary)' }}>Agendar Visita</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight">Proceso de Admisión</h1>
          <p className="text-muted-foreground mt-4 text-lg">Únete a la familia de {tenant.name}. Conoce los pasos para inscribir a tus hijos.</p>
        </div>

        <section className="space-y-12">
          <div className="grid gap-8">
            <div className="flex gap-6 items-start p-6 rounded-xl border border-border bg-card">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ backgroundColor: 'var(--primary)' }}>1</div>
              <div>
                <h3 className="font-bold text-lg">Solicitud en Línea</h3>
                <p className="text-muted-foreground mt-1 text-sm">Completa nuestro formulario de contacto en la sección de Contacto para iniciar tu proceso.</p>
              </div>
            </div>

            <div className="flex gap-6 items-start p-6 rounded-xl border border-border bg-card">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ backgroundColor: 'var(--secondary)' }}>2</div>
              <div>
                <h3 className="font-bold text-lg">Agendar una Visita / Tour</h3>
                <p className="text-muted-foreground mt-1 text-sm">Programa un recorrido por nuestro campus para conocer las instalaciones y platicar con la dirección académica.</p>
              </div>
            </div>

            <div className="flex gap-6 items-start p-6 rounded-xl border border-border bg-card">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ backgroundColor: 'var(--primary)' }}>3</div>
              <div>
                <h3 className="font-bold text-lg">Evaluación Diagnóstica</h3>
                <p className="text-muted-foreground mt-1 text-sm">Realizamos una prueba psicopedagógica amigable para comprender el nivel de madurez y conocimientos del aspirante.</p>
              </div>
            </div>

            <div className="flex gap-6 items-start p-6 rounded-xl border border-border bg-card">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ backgroundColor: 'var(--secondary)' }}>4</div>
              <div>
                <h3 className="font-bold text-lg">Inscripción</h3>
                <p className="text-muted-foreground mt-1 text-sm">Entrega de documentación requerida (acta de nacimiento, boletas previas, CURP) y pago de inscripción para asegurar su lugar.</p>
              </div>
            </div>
          </div>

          <div className="text-center pt-8">
            <Link href="/contact" className="inline-block px-8 py-4 font-bold text-white rounded-lg shadow-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: 'var(--primary)' }}>
              Iniciar Proceso de Admisión Ahora
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card/40 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {tenant.name}. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:underline">Aviso de Privacidad</Link>
            <Link href="/terms" className="hover:underline">Términos de Servicio</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
