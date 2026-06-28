'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { LandingComponentProps } from '@/types/tenant';

const NAV_LINKS = [
  { label: 'Nosotros',   href: '#nosotros'  },
  { label: 'Niveles',    href: '#niveles'   },
  { label: 'Galería',    href: '#galeria'   },
  { label: 'Testimonios',href: '#testimonios'},
  { label: 'Ubicación',  href: '#ubicacion' },
];

export default function Navbar({ config, hasInstitutionalContent }: LandingComponentProps & { hasInstitutionalContent?: boolean }) {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    const el = document.querySelector(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const dynamicNavLinks = [...NAV_LINKS];
  if (hasInstitutionalContent) {
    dynamicNavLinks.push({ label: 'Vida Escolar', href: '#vida-escolar' });
  }

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => scrollTo('#hero')}
            className="flex items-center gap-2.5 focus:outline-none"
          >
            {config.logo_url ? (
              <Image
                src={config.logo_url}
                alt={config.name}
                width={120}
                height={40}
                className="h-9 w-auto object-contain"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm select-none"
                style={{ backgroundColor: config.primary_color }}
              >
                {config.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span
              className={`hidden sm:block font-semibold text-base tracking-tight transition-colors ${
                scrolled ? 'text-gray-900' : 'text-white'
              }`}
            >
              {config.name}
            </span>
          </button>

          {/* Links desktop */}
          <ul className="hidden md:flex items-center gap-6">
            {dynamicNavLinks.map((l) => (
              <li key={l.href}>
                <button
                  onClick={() => scrollTo(l.href)}
                  className={`text-sm font-medium transition-colors hover:opacity-70 ${
                    scrolled ? 'text-gray-700' : 'text-white/90'
                  }`}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>

          {/* CTA + hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => scrollTo('#contacto')}
              className="hidden sm:inline-flex text-sm font-semibold px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: config.primary_color }}
            >
              Agendar visita
            </button>

            {/* Hamburger — mobile only */}
            <button
              className={`md:hidden p-2 rounded-md transition-colors ${
                scrolled ? 'text-gray-700' : 'text-white'
              }`}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menú"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Drawer mobile */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              className="fixed top-0 right-0 h-full w-72 z-50 bg-white shadow-xl flex flex-col pt-20 px-6 gap-6"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.28 }}
            >
              {dynamicNavLinks.map((l) => (
                <button
                  key={l.href}
                  onClick={() => scrollTo(l.href)}
                  className="text-left text-lg font-medium text-gray-800 hover:text-tenant-primary transition-colors"
                >
                  {l.label}
                </button>
              ))}
              <button
                onClick={() => scrollTo('#contacto')}
                className="mt-4 text-sm font-semibold px-4 py-3 rounded-lg text-white text-center transition-opacity hover:opacity-90"
                style={{ backgroundColor: config.primary_color }}
              >
                Agendar visita
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
