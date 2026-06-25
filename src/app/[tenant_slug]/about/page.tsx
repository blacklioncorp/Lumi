import React from 'react';
import { getTenantFromHeaders } from '@/lib/tenant';
import Link from 'next/link';

export default function TenantAboutPage() {
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
            <Link href="/about" className="text-primary transition-colors">Nosotros</Link>
            <Link href="/admissions" className="hover:text-primary transition-colors">Admisiones</Link>
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
          <h1 className="text-4xl font-extrabold tracking-tight">Nuestra Historia y Filosofía</h1>
          <p className="text-muted-foreground mt-4 text-lg">Conoce más sobre la institución educativa líder de nuestra comunidad.</p>
        </div>

        <section className="space-y-12">
          <div className="prose prose-neutral max-w-none">
            <h2 className="text-2xl font-bold text-foreground">¿Quiénes Somos?</h2>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              En {tenant.name}, nos dedicamos a ofrecer una educación de calidad mundial, impulsando el crecimiento integral de cada alumno. Nuestro modelo psicopedagógico fomenta el aprendizaje autónomo, la creatividad y la resolución de problemas reales.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 pt-8">
            <div className="p-6 border border-border bg-card rounded-xl">
              <h3 className="font-bold text-xl mb-3">Nuestra Misión</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Formar de manera integral a niños y jóvenes con un alto nivel académico, sólidos principios éticos y las competencias globales necesarias para contribuir positivamente al desarrollo de su sociedad.
              </p>
            </div>
            <div className="p-6 border border-border bg-card rounded-xl">
              <h3 className="font-bold text-xl mb-3">Nuestra Visión</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Ser la institución educativa de referencia en la región, reconocida por su innovación pedagógica, el uso estratégico de la tecnología, la excelencia docente y el éxito personal de sus egresados.
              </p>
            </div>
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
