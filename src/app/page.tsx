import React from 'react';
import Link from 'next/link';

export default function LumisMarketingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0F1D] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0A0F1D]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-amber-500 flex items-center justify-center font-bold text-white text-xl shadow-lg">
              L
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">Lumis</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Características</a>
            <a href="#pricing" className="hover:text-white transition-colors">Precios</a>
            <a href="#about" className="hover:text-white transition-colors">Nosotros</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Iniciar Sesión
            </Link>
            <a 
              href="#contact" 
              className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-amber-500 rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20"
            >
              Demo de Colegio
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative overflow-hidden py-32 md:py-40">
          {/* Gradients */}
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center space-y-8">
            <span className="px-4 py-1.5 text-xs font-semibold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/25 rounded-full inline-block">
              SaaS Educativo Multi-tenant
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
              La plataforma de gestión escolar para <span className="bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">Colegios Privados</span> en México
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Moderniza tu colegio con web builder, CRM de admisiones, pasarela de pagos integrada, control escolar y credenciales inteligentes NFC SafeLunch. Todo bajo tu propio dominio.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a 
                href="#contact" 
                className="px-8 py-4 font-bold bg-gradient-to-r from-blue-600 to-amber-500 rounded-xl shadow-xl shadow-blue-500/10 hover:opacity-90 transition-all text-center"
              >
                Comenzar Prueba Gratuita
              </a>
              <a 
                href="#features" 
                className="px-8 py-4 font-bold border border-white/10 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-center"
              >
                Explorar Módulos
              </a>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Todo lo que tu colegio necesita</h2>
              <p className="text-slate-400 text-sm">Módulos avanzados diseñados específicamente para el ecosistema educativo mexicano.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-2xl border border-white/5 bg-[#121829] space-y-4">
                <span className="text-3xl">🌐</span>
                <h3 className="text-xl font-bold">Custom Domains & CMS</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Cada colegio cuenta con su propio subdominio o dominio propio (ej. colegio.edu.mx). Modifica los contenidos del sitio público desde el panel institucional de forma visual.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-2xl border border-white/5 bg-[#121829] space-y-4">
                <span className="text-3xl">💳</span>
                <h3 className="text-xl font-bold">SafeLunch NFC</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Integración exclusiva de credenciales inteligentes NFC para alumnos. Permite a los padres recargar saldo para la cafetería escolar y controlar la dieta diaria de sus hijos.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-2xl border border-white/5 bg-[#121829] space-y-4">
                <span className="text-3xl">🤖</span>
                <h3 className="text-xl font-bold">CRM & n8n Automatizaciones</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Funnel de inscripciones integrado con alertas instantáneas de WhatsApp y calendarios sincronizados gracias al soporte nativo de flujos n8n self-hosted.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p>© {new Date().getFullYear()} Lumis EdTech SaaS. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:underline">Aviso de Privacidad</a>
            <a href="#" className="hover:underline">Contacto de Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
