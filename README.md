# Lumis

Plataforma EdTech SaaS para colegios privados en México.

## Stack Tecnológico
- Next.js 14 con App Router y TypeScript estricto
- Supabase (Auth, PostgreSQL con RLS, Storage, Realtime)
- Vercel (soporte de custom domains por tenant)
- Tailwind CSS + shadcn/ui

## Arquitectura Multi-tenant
- Basada en dominio/subdominio (resolución en Middleware)
- Branding dinámico mediante variables CSS inyectadas (`--tenant-primary`, `--tenant-secondary`)
- Aislamiento de datos con Row Level Security (RLS) en Supabase

## Configuración Local
1. Clona el repositorio
2. Instala dependencias con `npm install`
3. Copia `.env.local.example` a `.env.local` y configura tus variables de entorno de Supabase.
4. Ejecuta el servidor de desarrollo: `npm run dev`

## Despliegue (Vercel)
Asegúrate de configurar las variables de entorno en Vercel, especialmente `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, y `SUPABASE_SERVICE_ROLE_KEY`.
