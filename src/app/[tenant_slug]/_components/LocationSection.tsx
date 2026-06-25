'use client';

import { LandingComponentProps } from '@/types/tenant';
import { ContentBlock } from '@/types/database';
import { MapPin, Phone, Mail, Clock, ExternalLink } from 'lucide-react';

interface ContactInfo {
  address?:    string;
  phone?:      string;
  email?:      string;
  schedule?:   string;
  maps_embed?: string;   // URL de iframe de Google Maps
  maps_link?:  string;   // URL de Google Maps para abrir
}

const DEFAULT_CONTACT: ContactInfo = {
  address:  'Av. Insurgentes Norte 1234, Col. Residencial, CDMX, C.P. 06000',
  phone:    '+52 55 1234 5678',
  email:    'admisiones@colegio.edu.mx',
  schedule: 'Lunes a Viernes: 7:30 a.m. – 5:00 p.m.',
};

export default function LocationSection({ config, blocks }: LandingComponentProps) {
  const mapBlock  = blocks.find((b: ContentBlock) => b.block_type === 'map');
  const contactInfo: ContactInfo = (mapBlock?.data as ContactInfo | undefined) ?? DEFAULT_CONTACT;

  const googleMapsUrl = contactInfo.maps_link
    ?? `https://maps.google.com/?q=${encodeURIComponent(contactInfo.address ?? config.name)}`;

  return (
    <section id="ubicacion" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="text-center mb-12">
          <span
            className="text-xs font-bold tracking-widest uppercase mb-3 inline-block"
            style={{ color: config.primary_color }}
          >
            Visítanos
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            ¿Dónde estamos?
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Info de contacto */}
          <div className="flex flex-col gap-6">
            {contactInfo.address && (
              <div className="flex gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${config.primary_color}15` }}
                >
                  <MapPin size={20} style={{ color: config.primary_color }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-0.5">Dirección</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{contactInfo.address}</p>
                </div>
              </div>
            )}

            {contactInfo.phone && (
              <div className="flex gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${config.primary_color}15` }}
                >
                  <Phone size={20} style={{ color: config.primary_color }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-0.5">Teléfono</p>
                  <a
                    href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                    className="text-sm transition-colors hover:underline"
                    style={{ color: config.primary_color }}
                  >
                    {contactInfo.phone}
                  </a>
                </div>
              </div>
            )}

            {contactInfo.email && (
              <div className="flex gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${config.primary_color}15` }}
                >
                  <Mail size={20} style={{ color: config.primary_color }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-0.5">Correo</p>
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="text-sm transition-colors hover:underline"
                    style={{ color: config.primary_color }}
                  >
                    {contactInfo.email}
                  </a>
                </div>
              </div>
            )}

            {contactInfo.schedule && (
              <div className="flex gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${config.primary_color}15` }}
                >
                  <Clock size={20} style={{ color: config.primary_color }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-0.5">Horario de atención</p>
                  <p className="text-gray-500 text-sm">{contactInfo.schedule}</p>
                </div>
              </div>
            )}

            {/* Botón Cómo llegar */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 hover:shadow-lg self-start"
              style={{ backgroundColor: config.primary_color }}
            >
              <MapPin size={16} />
              Cómo llegar
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Mapa embed o placeholder */}
          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm h-80 lg:h-full min-h-64">
            {contactInfo.maps_embed ? (
              <iframe
                src={contactInfo.maps_embed}
                title={`Mapa de ${config.name}`}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              // Placeholder cuando no hay URL de embed configurada
              <div
                className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-8"
                style={{ backgroundColor: `${config.primary_color}08` }}
              >
                <MapPin size={40} style={{ color: config.primary_color }} />
                <p className="text-gray-600 font-medium text-sm max-w-xs">
                  {contactInfo.address ?? 'Dirección del colegio'}
                </p>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold hover:underline"
                  style={{ color: config.primary_color }}
                >
                  Ver en Google Maps →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
