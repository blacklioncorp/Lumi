import React from 'react';
import { getTenantFromHeaders } from '@/lib/tenant';
import Link from 'next/link';

export default function TenantHomePage() {
  const { tenant } = getTenantFromHeaders();

  if (!tenant) return null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="h-8 w-auto object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white" style={{ backgroundColor: 'var(--primary)' }}>
                {tenant.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-lg tracking-tight">{tenant.name}</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/about" className="hover:text-primary transition-colors">Nosotros</Link>
            <Link href="/admissions" className="hover:text-primary transition-colors">Admisiones</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Contacto</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Portal Institucional
            </Link>
            <Link 
              href="/contact" 
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90 shadow-md"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Agendar Visita
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-24 md:py-32">
          {/* Subtle decorative background circles */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--primary)' }} />
          <div className="absolute top-1/3 right-10 w-[300px] h-[300px] rounded-full opacity-10 blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--secondary)' }} />

          <div className="max-w-7xl mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6 text-left">
              <span 
                className="self-start px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full"
                style={{ backgroundColor: 'var(--secondary)', color: 'var(--primary)' }}
              >
                Admisiones Abiertas
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                Forjando a los líderes del mañana
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                En {tenant.name} combinamos excelencia académica, valores éticos y el desarrollo de competencias tecnológicas de vanguardia para brindar una educación del más alto nivel en México.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <Link 
                  href="/contact" 
                  className="px-6 py-3 font-semibold text-white rounded-lg text-center transition-all hover:opacity-90 shadow-lg"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  Conoce Nuestra Oferta
                </Link>
                <Link 
                  href="/about" 
                  className="px-6 py-3 font-semibold border border-border rounded-lg text-center bg-card hover:bg-accent transition-colors"
                >
                  Sobre Nosotros
                </Link>
              </div>
            </div>

            {/* Visual Frame */}
            <div className="relative aspect-video md:aspect-square w-full bg-muted/40 rounded-2xl border border-border shadow-2xl flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent" />
              <div className="flex flex-col items-center gap-2 text-center p-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg" style={{ backgroundColor: 'var(--primary)' }}>
                  {tenant.name.substring(0, 1).toUpperCase()}
                </div>
                <h3 className="font-bold text-xl mt-2">{tenant.name}</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Educación Integral de Excelencia</p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values / Pillar Section */}
        <section className="py-20 border-t border-border bg-card/20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Nuestros Pilares Educativos</h2>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">Diseñados para incentivar el desarrollo cognitivo, emocional y social de nuestros alumnos.</p>

            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="p-8 rounded-xl border border-border bg-card/60 backdrop-blur-sm flex flex-col items-start text-left hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white mb-6 font-bold" style={{ backgroundColor: 'var(--primary)' }}>
                  A
                </div>
                <h3 className="font-bold text-lg">Excelencia Académica</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  Programas educativos modernos alineados a estándares internacionales con enfoque bilingüe y crítico.
                </p>
              </div>

              <div className="p-8 rounded-xl border border-border bg-card/60 backdrop-blur-sm flex flex-col items-start text-left hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white mb-6 font-bold" style={{ backgroundColor: 'var(--secondary)' }}>
                  B
                </div>
                <h3 className="font-bold text-lg">Tecnología & Innovación</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  Acceso a laboratorios digitales, robótica y desarrollo de pensamiento lógico-matemático.
                </p>
              </div>

              <div className="p-8 rounded-xl border border-border bg-card/60 backdrop-blur-sm flex flex-col items-start text-left hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white mb-6 font-bold" style={{ backgroundColor: 'var(--primary)' }}>
                  C
                </div>
                <h3 className="font-bold text-lg">Formación en Valores</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  Fomentamos la empatía, el respeto, la responsabilidad y el liderazgo en comunidad.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card/40">
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
