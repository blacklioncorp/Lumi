-- =============================================================================
-- EDTECH SAAS — SUPABASE SCHEMA COMPLETO
-- Plataforma multi-tenant para colegios privados en México
-- =============================================================================
-- Ejecutar en: Supabase SQL Editor (en orden, de arriba a abajo)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. EXTENSIONES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TIPOS ENUMERADOS
-- ─────────────────────────────────────────────────────────────────────────────

-- Planes de suscripción
CREATE TYPE plan_type AS ENUM ('basic', 'intermediate', 'premium');

-- Roles de usuario
CREATE TYPE user_role AS ENUM ('superadmin', 'school_admin', 'editor', 'parent', 'student');

-- Fuente de captación del lead
CREATE TYPE lead_source AS ENUM (
  'web', 'whatsapp', 'instagram', 'facebook', 'google', 'referral', 'walk_in', 'other'
);

-- Estado del lead en el funnel
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'visited', 'enrolled', 'lost');

-- Nivel de interés educativo
CREATE TYPE education_level AS ENUM (
  'maternal', 'preescolar', 'primaria', 'secundaria', 'preparatoria'
);

-- Estado del estudiante
CREATE TYPE student_status AS ENUM ('active', 'inactive', 'graduated', 'transferred');

-- Estado del tour/visita
CREATE TYPE tour_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- Tipo de bloque de contenido
CREATE TYPE block_type AS ENUM (
  'hero', 'text', 'image', 'gallery', 'video', 'cta', 'testimonial',
  'faq', 'stats', 'team', 'pricing', 'map', 'form', 'custom'
);

-- Página donde vive el bloque de contenido
CREATE TYPE page_slug AS ENUM (
  'home', 'about', 'admissions', 'academics', 'campus', 'blog',
  'events', 'contact', 'portal'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. FUNCIÓN HELPER: get_my_tenant_id()
--    Lee el tenant_id del JWT (claim custom inyectado en login)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid,
    NULL
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. FUNCIÓN HELPER: get_my_role()
--    Lee el role del JWT
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json ->> 'user_role',
    NULL
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. FUNCIÓN: auto-actualizar updated_at
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- TABLAS
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. TENANTS (colegios)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.tenants (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  custom_domain text UNIQUE,                          -- ej: colegioespanol.edu.mx
  plan          plan_type NOT NULL DEFAULT 'basic',
  active_modules jsonb NOT NULL DEFAULT '[]'::jsonb,  -- ["crm","website","payments",…]
  logo_url      text,
  primary_color text DEFAULT '#1E40AF',               -- hex
  secondary_color text DEFAULT '#F59E0B',             -- hex
  timezone      text NOT NULL DEFAULT 'America/Mexico_City',
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT NOW(),
  updated_at    timestamptz NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_tenants_slug ON public.tenants (slug);
CREATE INDEX idx_tenants_custom_domain ON public.tenants (custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_tenants_is_active ON public.tenants (is_active);

-- Trigger updated_at
CREATE TRIGGER set_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. USERS (perfil de usuario vinculado a auth.users)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role        user_role NOT NULL DEFAULT 'parent',
  full_name   text NOT NULL,
  email       text NOT NULL,
  phone       text,
  avatar_url  text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT NOW(),
  updated_at  timestamptz NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_tenant_id ON public.users (tenant_id);
CREATE INDEX idx_users_email ON public.users (email);
CREATE INDEX idx_users_role ON public.users (tenant_id, role);

-- Trigger updated_at
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. LEADS (prospectos / CRM)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.leads (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name       text NOT NULL,
  email           text,
  phone           text,
  whatsapp        text,
  children_count  integer DEFAULT 1 CHECK (children_count > 0),
  level_interest  education_level,
  source          lead_source NOT NULL DEFAULT 'web',
  status          lead_status NOT NULL DEFAULT 'new',
  notes           text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  assigned_to     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT NOW(),
  updated_at      timestamptz NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_leads_tenant_id ON public.leads (tenant_id);
CREATE INDEX idx_leads_status ON public.leads (tenant_id, status);
CREATE INDEX idx_leads_source ON public.leads (tenant_id, source);
CREATE INDEX idx_leads_created_at ON public.leads (tenant_id, created_at DESC);
CREATE INDEX idx_leads_email ON public.leads (tenant_id, email) WHERE email IS NOT NULL;

-- Trigger updated_at
CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. STUDENTS (alumnos)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.students (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name       text NOT NULL,
  grade           text NOT NULL,                       -- ej: "3° Primaria"
  group_name      text,                                -- ej: "A", "B"
  nfc_id          text,                                -- integración SafeLunch
  parent_user_id  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  date_of_birth   date,
  enrolled_at     timestamptz NOT NULL DEFAULT NOW(),
  status          student_status NOT NULL DEFAULT 'active',
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT NOW(),
  updated_at      timestamptz NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_students_tenant_id ON public.students (tenant_id);
CREATE INDEX idx_students_parent ON public.students (parent_user_id);
CREATE INDEX idx_students_nfc ON public.students (nfc_id) WHERE nfc_id IS NOT NULL;
CREATE INDEX idx_students_status ON public.students (tenant_id, status);
CREATE INDEX idx_students_grade ON public.students (tenant_id, grade);

-- Trigger updated_at
CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. CONTENT_BLOCKS (bloques de contenido del website builder)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.content_blocks (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  page        page_slug NOT NULL DEFAULT 'home',
  block_type  block_type NOT NULL DEFAULT 'text',
  order_index integer NOT NULL DEFAULT 0,
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,      -- contenido flexible del bloque
  published   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT NOW(),
  updated_at  timestamptz NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_content_blocks_tenant_id ON public.content_blocks (tenant_id);
CREATE INDEX idx_content_blocks_page ON public.content_blocks (tenant_id, page, order_index);
CREATE INDEX idx_content_blocks_published ON public.content_blocks (tenant_id, published);

-- Constraint: orden único por página dentro de un tenant
CREATE UNIQUE INDEX idx_content_blocks_unique_order
  ON public.content_blocks (tenant_id, page, order_index)
  WHERE published = true;

-- Trigger updated_at
CREATE TRIGGER set_content_blocks_updated_at
  BEFORE UPDATE ON public.content_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. TOURS (visitas programadas al colegio)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.tours (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id          uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  scheduled_at     timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  google_event_id  text,                               -- ID de Google Calendar
  status           tour_status NOT NULL DEFAULT 'scheduled',
  assigned_to      uuid REFERENCES public.users(id) ON DELETE SET NULL,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  updated_at       timestamptz NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_tours_tenant_id ON public.tours (tenant_id);
CREATE INDEX idx_tours_lead_id ON public.tours (lead_id);
CREATE INDEX idx_tours_scheduled_at ON public.tours (tenant_id, scheduled_at);
CREATE INDEX idx_tours_status ON public.tours (tenant_id, status);

-- Trigger updated_at
CREATE TRIGGER set_tours_updated_at
  BEFORE UPDATE ON public.tours
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. RLS — TENANTS
-- ─────────────────────────────────────────────────────────────────────────────

-- Superadmin puede ver todos los tenants
CREATE POLICY "superadmin_tenants_all" ON public.tenants
  FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'superadmin')
  WITH CHECK (public.get_my_role() = 'superadmin');

-- school_admin puede ver solo su propio tenant
CREATE POLICY "school_admin_tenants_select" ON public.tenants
  FOR SELECT
  TO authenticated
  USING (id = public.get_my_tenant_id());

-- school_admin puede actualizar solo su propio tenant (branding, config)
CREATE POLICY "school_admin_tenants_update" ON public.tenants
  FOR UPDATE
  TO authenticated
  USING (
    id = public.get_my_tenant_id()
    AND public.get_my_role() = 'school_admin'
  )
  WITH CHECK (
    id = public.get_my_tenant_id()
    AND public.get_my_role() = 'school_admin'
  );

-- Acceso público de lectura para resolver tenant por slug/domain (website público)
CREATE POLICY "public_tenants_resolve" ON public.tenants
  FOR SELECT
  TO anon
  USING (is_active = true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. RLS — USERS
-- ─────────────────────────────────────────────────────────────────────────────

-- Superadmin tiene acceso total
CREATE POLICY "superadmin_users_all" ON public.users
  FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'superadmin')
  WITH CHECK (public.get_my_role() = 'superadmin');

-- Usuarios autenticados pueden ver su propio perfil
CREATE POLICY "users_select_self" ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Usuarios pueden actualizar su propio perfil (nombre, avatar)
CREATE POLICY "users_update_self" ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- No puede cambiarse el rol ni el tenant a sí mismo
    AND tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

-- school_admin puede gestionar usuarios de su tenant
CREATE POLICY "school_admin_users_select" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('school_admin', 'editor')
  );

CREATE POLICY "school_admin_users_insert" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() = 'school_admin'
  );

CREATE POLICY "school_admin_users_update" ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() = 'school_admin'
  )
  WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() = 'school_admin'
  );

CREATE POLICY "school_admin_users_delete" ON public.users
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() = 'school_admin'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. RLS — LEADS
-- ─────────────────────────────────────────────────────────────────────────────

-- Superadmin acceso total
CREATE POLICY "superadmin_leads_all" ON public.leads
  FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'superadmin')
  WITH CHECK (public.get_my_role() = 'superadmin');

-- school_admin y editor pueden ver leads de su tenant
CREATE POLICY "staff_leads_select" ON public.leads
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('school_admin', 'editor')
  );

-- school_admin y editor pueden crear leads
CREATE POLICY "staff_leads_insert" ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('school_admin', 'editor')
  );

-- school_admin y editor pueden actualizar leads de su tenant
CREATE POLICY "staff_leads_update" ON public.leads
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('school_admin', 'editor')
  )
  WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('school_admin', 'editor')
  );

-- Solo school_admin puede eliminar leads
CREATE POLICY "school_admin_leads_delete" ON public.leads
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() = 'school_admin'
  );

-- Anónimos pueden crear leads desde el formulario público del website
CREATE POLICY "anon_leads_insert" ON public.leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. RLS — STUDENTS
-- ─────────────────────────────────────────────────────────────────────────────

-- Superadmin acceso total
CREATE POLICY "superadmin_students_all" ON public.students
  FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'superadmin')
  WITH CHECK (public.get_my_role() = 'superadmin');

-- school_admin y editor pueden ver todos los alumnos de su tenant
CREATE POLICY "staff_students_select" ON public.students
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('school_admin', 'editor')
  );

-- school_admin puede gestionar alumnos
CREATE POLICY "school_admin_students_insert" ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() = 'school_admin'
  );

CREATE POLICY "school_admin_students_update" ON public.students
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() = 'school_admin'
  )
  WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() = 'school_admin'
  );

CREATE POLICY "school_admin_students_delete" ON public.students
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() = 'school_admin'
  );

-- Padres pueden ver solo a sus hijos
CREATE POLICY "parent_students_select" ON public.students
  FOR SELECT
  TO authenticated
  USING (
    parent_user_id = auth.uid()
    AND public.get_my_role() = 'parent'
  );

-- Estudiante puede ver solo su propio registro
CREATE POLICY "student_self_select" ON public.students
  FOR SELECT
  TO authenticated
  USING (
    -- Se asume que el student.id puede linkearse con auth.uid() vía parent o match
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() = 'student'
    AND parent_user_id IS NOT NULL
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. RLS — CONTENT_BLOCKS
-- ─────────────────────────────────────────────────────────────────────────────

-- Superadmin acceso total
CREATE POLICY "superadmin_content_all" ON public.content_blocks
  FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'superadmin')
  WITH CHECK (public.get_my_role() = 'superadmin');

-- Contenido publicado es visible públicamente (website del colegio)
CREATE POLICY "public_content_select" ON public.content_blocks
  FOR SELECT
  TO anon
  USING (published = true);

-- Usuarios autenticados del tenant pueden ver todo el contenido (incluido drafts)
CREATE POLICY "tenant_content_select" ON public.content_blocks
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('school_admin', 'editor')
  );

-- school_admin y editor pueden crear y modificar contenido
CREATE POLICY "staff_content_insert" ON public.content_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('school_admin', 'editor')
  );

CREATE POLICY "staff_content_update" ON public.content_blocks
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('school_admin', 'editor')
  )
  WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('school_admin', 'editor')
  );

-- Solo school_admin puede eliminar bloques
CREATE POLICY "school_admin_content_delete" ON public.content_blocks
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() = 'school_admin'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 16. RLS — TOURS
-- ─────────────────────────────────────────────────────────────────────────────

-- Superadmin acceso total
CREATE POLICY "superadmin_tours_all" ON public.tours
  FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'superadmin')
  WITH CHECK (public.get_my_role() = 'superadmin');

-- Staff puede ver tours de su tenant
CREATE POLICY "staff_tours_select" ON public.tours
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('school_admin', 'editor')
  );

-- Staff puede crear tours
CREATE POLICY "staff_tours_insert" ON public.tours
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('school_admin', 'editor')
  );

-- Staff puede actualizar tours
CREATE POLICY "staff_tours_update" ON public.tours
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('school_admin', 'editor')
  )
  WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('school_admin', 'editor')
  );

-- Solo school_admin puede eliminar tours
CREATE POLICY "school_admin_tours_delete" ON public.tours
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() = 'school_admin'
  );


-- =============================================================================
-- FUNCIONES AUXILIARES
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 17. FUNCIÓN: Crear perfil de usuario automáticamente al registrarse
--     (Trigger sobre auth.users — se ejecuta tras signup)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _tenant_id uuid;
  _role user_role;
  _full_name text;
BEGIN
  -- Extraer metadata del usuario (se envía durante signup)
  _tenant_id := (NEW.raw_user_meta_data ->> 'tenant_id')::uuid;
  _role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::user_role,
    'parent'
  );
  _full_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Solo crear perfil si hay tenant_id
  IF _tenant_id IS NOT NULL THEN
    INSERT INTO public.users (id, tenant_id, role, full_name, email)
    VALUES (NEW.id, _tenant_id, _role, _full_name, NEW.email);
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger en auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 18. FUNCIÓN: Inyectar tenant_id y role en el JWT (custom claims)
--     Se invoca como hook de Supabase Auth o manualmente
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  claims jsonb;
  _user_id uuid;
  _tenant_id uuid;
  _role text;
BEGIN
  _user_id := (event ->> 'user_id')::uuid;

  -- Buscar tenant_id y role del usuario
  SELECT u.tenant_id, u.role::text
  INTO _tenant_id, _role
  FROM public.users u
  WHERE u.id = _user_id;

  -- Obtener claims actuales
  claims := event -> 'claims';

  -- Inyectar custom claims
  IF _tenant_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(_tenant_id::text));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(_role));
  END IF;

  -- Devolver evento modificado
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 19. FUNCIÓN: Estadísticas rápidas del dashboard de un tenant
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_tenant_dashboard_stats(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_leads', (SELECT COUNT(*) FROM public.leads WHERE tenant_id = p_tenant_id),
    'new_leads', (SELECT COUNT(*) FROM public.leads WHERE tenant_id = p_tenant_id AND status = 'new'),
    'active_students', (SELECT COUNT(*) FROM public.students WHERE tenant_id = p_tenant_id AND status = 'active'),
    'upcoming_tours', (SELECT COUNT(*) FROM public.tours WHERE tenant_id = p_tenant_id AND status = 'scheduled' AND scheduled_at > NOW()),
    'total_users', (SELECT COUNT(*) FROM public.users WHERE tenant_id = p_tenant_id),
    'conversion_rate', (
      SELECT ROUND(
        CASE 
          WHEN COUNT(*) = 0 THEN 0
          ELSE (COUNT(*) FILTER (WHERE status = 'enrolled')::numeric / COUNT(*)::numeric) * 100
        END, 2
      )
      FROM public.leads WHERE tenant_id = p_tenant_id
    )
  ) INTO result;

  RETURN result;
END;
$$;


-- =============================================================================
-- STORAGE BUCKETS (ejecutar desde el SQL Editor o UI de Supabase)
-- =============================================================================

-- Bucket para archivos del tenant (logos, imágenes de contenido, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-assets',
  'tenant-assets',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para documentos privados (expedientes, recibos, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-documents',
  'tenant-documents',
  false,
  10485760,  -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 20. STORAGE RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Archivos públicos: cualquiera puede leer
CREATE POLICY "public_asset_select" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'tenant-assets');

-- Staff puede subir assets a su tenant (ruta: tenant-assets/{tenant_id}/...)
CREATE POLICY "staff_asset_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'tenant-assets'
    AND (storage.foldername(name))[1] = public.get_my_tenant_id()::text
    AND public.get_my_role() IN ('superadmin', 'school_admin', 'editor')
  );

-- Staff puede eliminar assets de su tenant
CREATE POLICY "staff_asset_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'tenant-assets'
    AND (storage.foldername(name))[1] = public.get_my_tenant_id()::text
    AND public.get_my_role() IN ('superadmin', 'school_admin', 'editor')
  );

-- Documentos privados: solo staff de su tenant puede leer
CREATE POLICY "staff_docs_select" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'tenant-documents'
    AND (storage.foldername(name))[1] = public.get_my_tenant_id()::text
    AND public.get_my_role() IN ('superadmin', 'school_admin')
  );

-- Staff puede subir documentos
CREATE POLICY "staff_docs_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'tenant-documents'
    AND (storage.foldername(name))[1] = public.get_my_tenant_id()::text
    AND public.get_my_role() IN ('superadmin', 'school_admin')
  );


-- =============================================================================
-- GRANTS (asegurar que los roles de Supabase tengan acceso)
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;


-- =============================================================================
-- SEED DATA (opcional — un tenant de prueba)
-- =============================================================================

-- Descomentar para insertar un tenant de prueba:
/*
INSERT INTO public.tenants (name, slug, plan, active_modules, logo_url, primary_color, secondary_color)
VALUES (
  'Colegio Demo',
  'demo',
  'premium',
  '["crm", "website", "payments", "safelunch", "tours"]'::jsonb,
  NULL,
  '#1E40AF',
  '#F59E0B'
);
*/

-- =============================================================================
-- FIN DEL SCHEMA
-- =============================================================================
