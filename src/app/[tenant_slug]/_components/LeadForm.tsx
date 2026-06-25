'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { LandingComponentProps } from '@/types/tenant';

// ─── Esquema de validación Zod ────────────────────────────────────────────────
// children_count se maneja como string en el form (valor de <select>) y se convierte al hacer submit
const leadSchema = z.object({
  full_name: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(80, 'Nombre demasiado largo'),
  whatsapp: z
    .string()
    .regex(
      /^(\+52)?[0-9]{10}$/,
      'Ingresa un número de WhatsApp válido (10 dígitos o con +52)'
    ),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  level_interest: z.enum([
    'maternal', 'preescolar', 'primaria', 'secundaria', 'preparatoria',
  ]),
  children_count: z.string().min(1),
  source: z.enum(['web', 'google', 'instagram', 'facebook', 'referral', 'other']),
});

type LeadFormData = z.infer<typeof leadSchema>;

// Mapeo amigable de fuentes al enum lead_source de la BD
const SOURCE_LABELS: { value: LeadFormData['source']; label: string }[] = [
  { value: 'google',    label: 'Google'            },
  { value: 'instagram', label: 'Redes Sociales'    },
  { value: 'facebook',  label: 'Facebook'          },
  { value: 'referral',  label: 'Recomendación'     },
  { value: 'web',       label: 'Sitio web'         },
  { value: 'other',     label: 'Otro'              },
];

const LEVEL_LABELS: { value: LeadFormData['level_interest']; label: string }[] = [
  { value: 'maternal',    label: 'Maternal (1-3 años)'       },
  { value: 'preescolar',  label: 'Preescolar (3-6 años)'     },
  { value: 'primaria',    label: 'Primaria'                  },
  { value: 'secundaria',  label: 'Secundaria'                },
  { value: 'preparatoria',label: 'Preparatoria / Bachillerato'},
];

export default function LeadForm({ config }: LandingComponentProps) {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const hasWhatsapp = config.active_modules.includes('whatsapp');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<LeadFormData>({ resolver: zodResolver(leadSchema) as any, defaultValues: { children_count: '1' as any, source: 'web' } });

  const onSubmit = async (data: LeadFormData) => {
    setServerError(null);
    try {
      const res = await fetch('/api/leads', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          tenant_slug:   config.slug,
          ...data,
          // Normalizar whatsapp: quitar +52 si ya está
          whatsapp: data.whatsapp.replace(/^\+52/, ''),
          email: data.email || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? 'Error al enviar');
      }

      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado. Intenta de nuevo.';
      setServerError(message);
    }
  };

  const inputCls = (hasError: boolean) =>
    `w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 bg-white ${
      hasError
        ? 'border-red-300 focus:ring-red-200'
        : 'border-gray-200 focus:ring-blue-100 focus:border-blue-300'
    }`;

  return (
    <section
      id="contacto"
      className="py-20"
      style={{ background: `linear-gradient(160deg, ${config.primary_color}08 0%, ${config.secondary_color}10 100%)` }}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {/* Encabezado */}
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                  Da el primer paso
                </h2>
                {hasWhatsapp && (
                  <p className="text-gray-500 mt-3 text-base">
                    Te contactamos en{' '}
                    <strong className="text-gray-700">menos de 10 minutos</strong> por WhatsApp 📲
                  </p>
                )}
              </div>

              {/* Error de servidor */}
              {serverError && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                  {serverError}
                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col gap-5"
                noValidate
              >
                {/* Nombre completo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('full_name')}
                    type="text"
                    placeholder="Ej. Karla Martínez López"
                    className={inputCls(!!errors.full_name)}
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>
                  )}
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('whatsapp')}
                    type="tel"
                    placeholder="Ej. 5512345678"
                    className={inputCls(!!errors.whatsapp)}
                  />
                  {errors.whatsapp && (
                    <p className="mt-1 text-xs text-red-600">{errors.whatsapp.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Correo electrónico <span className="text-gray-400 text-xs">(opcional)</span>
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="tu@correo.com"
                    className={inputCls(!!errors.email)}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Nivel educativo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nivel de interés <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('level_interest')}
                    className={inputCls(!!errors.level_interest)}
                    defaultValue=""
                  >
                    <option value="" disabled>Selecciona un nivel…</option>
                    {LEVEL_LABELS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                  {errors.level_interest && (
                    <p className="mt-1 text-xs text-red-600">{errors.level_interest.message}</p>
                  )}
                </div>

                {/* Número de hijos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    ¿Cuántos hijos inscribirías?
                  </label>
                  <select
                    {...register('children_count')}
                    className={inputCls(!!errors.children_count)}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n === 5 ? '5 o más' : n === 1 ? '1 hijo' : `${n} hijos`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fuente / cómo nos conociste */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    ¿Cómo nos conociste?
                  </label>
                  <select
                    {...register('source')}
                    className={inputCls(!!errors.source)}
                  >
                    {SOURCE_LABELS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 hover:shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: config.primary_color }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Enviando…
                    </>
                  ) : (
                    'Quiero información →'
                  )}
                </button>

                <p className="text-center text-xs text-gray-400">
                  Al enviar, aceptas que {config.name} te contacte por WhatsApp. Sin spam.
                </p>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-center py-16 px-6 bg-white rounded-2xl shadow-sm border border-gray-100"
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"
                style={{ backgroundColor: `${config.primary_color}15` }}
              >
                🎉
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-3">
                ¡Gracias por tu interés!
              </h3>
              <p className="text-gray-500 text-base max-w-sm mx-auto">
                {hasWhatsapp
                  ? 'En breve te contactamos por WhatsApp. ¡Estamos emocionados de conocerte!'
                  : `Un asesor de ${config.name} se pondrá en contacto muy pronto.`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
