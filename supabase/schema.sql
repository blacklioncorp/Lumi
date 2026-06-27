-- =============================================================================
-- PASO 2 — EJECUTA ESTO DESPUÉS del paso 1
-- LUMIS EDTECH SAAS — Schema completo v1.1
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── TIPOS ───────────────────────────────────────────────────────────────────
CREATE TYPE public.plan_type       AS ENUM ('basic', 'intermediate', 'premium');
CREATE TYPE public.user_role       AS ENUM ('superadmin', 'school_admin', 'editor', 'parent', 'student');
CREATE TYPE public.lead_source     AS ENUM ('web', 'whatsapp', 'instagram', 'facebook', 'google', 'referral', 'walk_in', 'other');
CREATE TYPE public.lead_status     AS ENUM ('new', 'contacted', 'visited', 'enrolled', 'lost');
CREATE TYPE public.education_level AS ENUM ('maternal', 'preescolar', 'primaria', 'secundaria', 'preparatoria');
CREATE TYPE public.student_status  AS ENUM ('active', 'inactive', 'graduated', 'transferred');
CREATE TYPE public.tour_status     AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.block_type      AS ENUM ('hero','text','image','gallery','video','cta','testimonial','faq','stats','team','pricing','map','form','custom');
CREATE TYPE public.page_slug       AS ENUM ('home','about','admissions','academics','campus','blog','events','contact','portal');

-- ─── FUNCIONES HELPER ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT COALESCE((current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid, NULL); $$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT COALESCE(current_setting('request.jwt.claims', true)::json ->> 'user_role', NULL); $$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

-- ─── TENANTS ─────────────────────────────────────────────────────────────────
CREATE TABLE public.tenants (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            text NOT NULL,
  slug            text NOT NULL UNIQUE,
  custom_domain   text UNIQUE,
  plan            public.plan_type NOT NULL DEFAULT 'basic',
  active_modules  jsonb NOT NULL DEFAULT '[]'::jsonb,
  logo_url        text,
  primary_color   text DEFAULT '#1E40AF',
  secondary_color text DEFAULT '#F59E0B',
  timezone        text NOT NULL DEFAULT 'America/Mexico_City',
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT NOW(),
  updated_at      timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tenants_slug          ON public.tenants (slug);
CREATE INDEX idx_tenants_custom_domain ON public.tenants (custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_tenants_is_active     ON public.tenants (is_active);
CREATE TRIGGER set_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role        public.user_role NOT NULL DEFAULT 'parent',
  full_name   text NOT NULL,
  email       text NOT NULL,
  phone       text,
  avatar_url  text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT NOW(),
  updated_at  timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_tenant_id ON public.users (tenant_id);
CREATE INDEX idx_users_email     ON public.users (email);
CREATE INDEX idx_users_role      ON public.users (tenant_id, role);
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── LEADS ───────────────────────────────────────────────────────────────────
CREATE TABLE public.leads (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name      text NOT NULL,
  email          text,
  phone          text,
  whatsapp       text,
  children_count integer DEFAULT 1 CHECK (children_count > 0),
  level_interest public.education_level,
  source         public.lead_source NOT NULL DEFAULT 'web',
  status         public.lead_status NOT NULL DEFAULT 'new',
  notes          text,
  utm_source     text,
  utm_medium     text,
  utm_campaign   text,
  assigned_to    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT NOW(),
  updated_at     timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_leads_tenant_id  ON public.leads (tenant_id);
CREATE INDEX idx_leads_status     ON public.leads (tenant_id, status);
CREATE INDEX idx_leads_source     ON public.leads (tenant_id, source);
CREATE INDEX idx_leads_created_at ON public.leads (tenant_id, created_at DESC);
CREATE INDEX idx_leads_email      ON public.leads (tenant_id, email) WHERE email IS NOT NULL;
CREATE TRIGGER set_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── STUDENTS ────────────────────────────────────────────────────────────────
CREATE TABLE public.students (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name      text NOT NULL,
  grade          text NOT NULL,
  group_name     text,
  nfc_id         text,
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  date_of_birth  date,
  enrolled_at    timestamptz NOT NULL DEFAULT NOW(),
  status         public.student_status NOT NULL DEFAULT 'active',
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT NOW(),
  updated_at     timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_students_tenant_id ON public.students (tenant_id);
CREATE INDEX idx_students_parent    ON public.students (parent_user_id);
CREATE INDEX idx_students_user_id   ON public.students (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_students_nfc       ON public.students (nfc_id) WHERE nfc_id IS NOT NULL;
CREATE INDEX idx_students_status    ON public.students (tenant_id, status);
CREATE INDEX idx_students_grade     ON public.students (tenant_id, grade);
CREATE TRIGGER set_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── CONTENT_BLOCKS ──────────────────────────────────────────────────────────
CREATE TABLE public.content_blocks (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  page        public.page_slug NOT NULL DEFAULT 'home',
  block_type  public.block_type NOT NULL DEFAULT 'text',
  order_index integer NOT NULL DEFAULT 0,
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  published   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT NOW(),
  updated_at  timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_content_blocks_tenant_id ON public.content_blocks (tenant_id);
CREATE INDEX idx_content_blocks_page      ON public.content_blocks (tenant_id, page, order_index);
CREATE INDEX idx_content_blocks_published ON public.content_blocks (tenant_id, published);
CREATE UNIQUE INDEX idx_content_blocks_unique_order ON public.content_blocks (tenant_id, page, order_index) WHERE published = true;
CREATE TRIGGER set_content_blocks_updated_at BEFORE UPDATE ON public.content_blocks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── TOURS ───────────────────────────────────────────────────────────────────
CREATE TABLE public.tours (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id          uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  scheduled_at     timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  google_event_id  text,
  status           public.tour_status NOT NULL DEFAULT 'scheduled',
  assigned_to      uuid REFERENCES public.users(id) ON DELETE SET NULL,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  updated_at       timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tours_tenant_id    ON public.tours (tenant_id);
CREATE INDEX idx_tours_lead_id      ON public.tours (lead_id);
CREATE INDEX idx_tours_scheduled_at ON public.tours (tenant_id, scheduled_at);
CREATE INDEX idx_tours_status       ON public.tours (tenant_id, status);
CREATE TRIGGER set_tours_updated_at BEFORE UPDATE ON public.tours FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── NFC_BALANCES ────────────────────────────────────────────────────────────
CREATE TABLE public.nfc_balances (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id     uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  nfc_id         text NOT NULL,
  balance        numeric(10,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  currency       text NOT NULL DEFAULT 'MXN',
  last_reload_at timestamptz,
  created_at     timestamptz NOT NULL DEFAULT NOW(),
  updated_at     timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, nfc_id)
);
CREATE INDEX idx_nfc_balances_tenant  ON public.nfc_balances (tenant_id);
CREATE INDEX idx_nfc_balances_student ON public.nfc_balances (student_id);
CREATE INDEX idx_nfc_balances_nfc_id  ON public.nfc_balances (nfc_id);
CREATE TRIGGER set_nfc_balances_updated_at BEFORE UPDATE ON public.nfc_balances FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── NFC_TRANSACTIONS ────────────────────────────────────────────────────────
CREATE TABLE public.nfc_transactions (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id    uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  nfc_id        text NOT NULL,
  type          text NOT NULL CHECK (type IN ('reload','purchase','refund')),
  amount        numeric(10,2) NOT NULL,
  balance_after numeric(10,2) NOT NULL,
  description   text,
  payment_ref   text,
  created_at    timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_nfc_tx_tenant  ON public.nfc_transactions (tenant_id);
CREATE INDEX idx_nfc_tx_student ON public.nfc_transactions (student_id, created_at DESC);
CREATE INDEX idx_nfc_tx_nfc_id  ON public.nfc_transactions (nfc_id);

-- ─── ACCESS_LOGS ─────────────────────────────────────────────────────────────
CREATE TABLE public.access_logs (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  nfc_id      text NOT NULL,
  event_type  text NOT NULL CHECK (event_type IN ('entry','exit','denied')),
  location    text,
  device_id   text,
  created_at  timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_access_logs_tenant  ON public.access_logs (tenant_id);
CREATE INDEX idx_access_logs_student ON public.access_logs (student_id, created_at DESC);
CREATE INDEX idx_access_logs_date    ON public.access_logs (tenant_id, created_at DESC);

-- ─── SOCIAL_POSTS ────────────────────────────────────────────────────────────
CREATE TABLE public.social_posts (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  platforms    text[] NOT NULL,
  content_text text NOT NULL,
  media_urls   text[],
  media_type   text CHECK (media_type IN ('image','video')),
  status       text NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','published','failed','scheduled')),
  scheduled_at timestamptz,
  published_at timestamptz,
  n8n_job_id   text,
  error_message text,
  created_by   uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT NOW(),
  updated_at   timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_social_posts_tenant     ON public.social_posts (tenant_id);
CREATE INDEX idx_social_posts_status     ON public.social_posts (tenant_id, status);
CREATE INDEX idx_social_posts_scheduled  ON public.social_posts (scheduled_at) WHERE status = 'scheduled';
CREATE TRIGGER set_social_posts_updated_at BEFORE UPDATE ON public.social_posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE public.tenants          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfc_balances     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfc_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts     ENABLE ROW LEVEL SECURITY;

-- TENANTS
CREATE POLICY "superadmin_tenants_all"      ON public.tenants FOR ALL TO authenticated USING (public.get_my_role()='superadmin') WITH CHECK (public.get_my_role()='superadmin');
CREATE POLICY "school_admin_tenants_select" ON public.tenants FOR SELECT TO authenticated USING (id=public.get_my_tenant_id());
CREATE POLICY "school_admin_tenants_update" ON public.tenants FOR UPDATE TO authenticated USING (id=public.get_my_tenant_id() AND public.get_my_role()='school_admin') WITH CHECK (id=public.get_my_tenant_id() AND public.get_my_role()='school_admin');
CREATE POLICY "public_tenants_resolve"      ON public.tenants FOR SELECT TO anon USING (is_active=true);

-- USERS
CREATE POLICY "superadmin_users_all"        ON public.users FOR ALL TO authenticated USING (public.get_my_role()='superadmin') WITH CHECK (public.get_my_role()='superadmin');
CREATE POLICY "users_select_self"           ON public.users FOR SELECT TO authenticated USING (id=auth.uid());
CREATE POLICY "users_update_self"           ON public.users FOR UPDATE TO authenticated USING (id=auth.uid()) WITH CHECK (id=auth.uid() AND tenant_id=(SELECT tenant_id FROM public.users WHERE id=auth.uid()) AND role=(SELECT role FROM public.users WHERE id=auth.uid()));
CREATE POLICY "school_admin_users_select"   ON public.users FOR SELECT TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role() IN ('school_admin','editor'));
CREATE POLICY "school_admin_users_insert"   ON public.users FOR INSERT TO authenticated WITH CHECK (tenant_id=public.get_my_tenant_id() AND public.get_my_role()='school_admin');
CREATE POLICY "school_admin_users_update"   ON public.users FOR UPDATE TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role()='school_admin') WITH CHECK (tenant_id=public.get_my_tenant_id() AND public.get_my_role()='school_admin');
CREATE POLICY "school_admin_users_delete"   ON public.users FOR DELETE TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role()='school_admin');

-- LEADS
CREATE POLICY "superadmin_leads_all"        ON public.leads FOR ALL TO authenticated USING (public.get_my_role()='superadmin') WITH CHECK (public.get_my_role()='superadmin');
CREATE POLICY "staff_leads_select"          ON public.leads FOR SELECT TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role() IN ('school_admin','editor'));
CREATE POLICY "staff_leads_insert"          ON public.leads FOR INSERT TO authenticated WITH CHECK (tenant_id=public.get_my_tenant_id() AND public.get_my_role() IN ('school_admin','editor'));
CREATE POLICY "staff_leads_update"          ON public.leads FOR UPDATE TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role() IN ('school_admin','editor')) WITH CHECK (tenant_id=public.get_my_tenant_id() AND public.get_my_role() IN ('school_admin','editor'));
CREATE POLICY "school_admin_leads_delete"   ON public.leads FOR DELETE TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role()='school_admin');
CREATE POLICY "anon_leads_insert"           ON public.leads FOR INSERT TO anon WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE is_active=true));

-- STUDENTS
CREATE POLICY "superadmin_students_all"          ON public.students FOR ALL TO authenticated USING (public.get_my_role()='superadmin') WITH CHECK (public.get_my_role()='superadmin');
CREATE POLICY "staff_students_select"            ON public.students FOR SELECT TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role() IN ('school_admin','editor'));
CREATE POLICY "school_admin_students_insert"     ON public.students FOR INSERT TO authenticated WITH CHECK (tenant_id=public.get_my_tenant_id() AND public.get_my_role()='school_admin');
CREATE POLICY "school_admin_students_update"     ON public.students FOR UPDATE TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role()='school_admin') WITH CHECK (tenant_id=public.get_my_tenant_id() AND public.get_my_role()='school_admin');
CREATE POLICY "school_admin_students_delete"     ON public.students FOR DELETE TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role()='school_admin');
CREATE POLICY "parent_students_select"           ON public.students FOR SELECT TO authenticated USING (parent_user_id=auth.uid() AND public.get_my_role()='parent');
CREATE POLICY "student_self_select"              ON public.students FOR SELECT TO authenticated USING (user_id=auth.uid() AND public.get_my_role()='student');

-- CONTENT_BLOCKS
CREATE POLICY "superadmin_content_all"      ON public.content_blocks FOR ALL TO authenticated USING (public.get_my_role()='superadmin') WITH CHECK (public.get_my_role()='superadmin');
CREATE POLICY "public_content_select"       ON public.content_blocks FOR SELECT TO anon USING (published=true);
CREATE POLICY "tenant_content_select"       ON public.content_blocks FOR SELECT TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role() IN ('school_admin','editor'));
CREATE POLICY "staff_content_insert"        ON public.content_blocks FOR INSERT TO authenticated WITH CHECK (tenant_id=public.get_my_tenant_id() AND public.get_my_role() IN ('school_admin','editor'));
CREATE POLICY "staff_content_update"        ON public.content_blocks FOR UPDATE TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role() IN ('school_admin','editor')) WITH CHECK (tenant_id=public.get_my_tenant_id() AND public.get_my_role() IN ('school_admin','editor'));
CREATE POLICY "school_admin_content_delete" ON public.content_blocks FOR DELETE TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role()='school_admin');

-- TOURS
CREATE POLICY "superadmin_tours_all"        ON public.tours FOR ALL TO authenticated USING (public.get_my_role()='superadmin') WITH CHECK (public.get_my_role()='superadmin');
CREATE POLICY "staff_tours_select"          ON public.tours FOR SELECT TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role() IN ('school_admin','editor'));
CREATE POLICY "staff_tours_insert"          ON public.tours FOR INSERT TO authenticated WITH CHECK (tenant_id=public.get_my_tenant_id() AND public.get_my_role() IN ('school_admin','editor'));
CREATE POLICY "staff_tours_update"          ON public.tours FOR UPDATE TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role() IN ('school_admin','editor')) WITH CHECK (tenant_id=public.get_my_tenant_id() AND public.get_my_role() IN ('school_admin','editor'));
CREATE POLICY "school_admin_tours_delete"   ON public.tours FOR DELETE TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role()='school_admin');

-- NFC_BALANCES
CREATE POLICY "superadmin_nfc_balances"     ON public.nfc_balances FOR ALL TO authenticated USING (public.get_my_role()='superadmin') WITH CHECK (public.get_my_role()='superadmin');
CREATE POLICY "staff_nfc_balances_select"   ON public.nfc_balances FOR SELECT TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role() IN ('school_admin','editor'));
CREATE POLICY "staff_nfc_balances_insert"   ON public.nfc_balances FOR INSERT TO authenticated WITH CHECK (tenant_id=public.get_my_tenant_id() AND public.get_my_role()='school_admin');
CREATE POLICY "staff_nfc_balances_update"   ON public.nfc_balances FOR UPDATE TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role()='school_admin') WITH CHECK (tenant_id=public.get_my_tenant_id() AND public.get_my_role()='school_admin');
CREATE POLICY "parent_nfc_balance_select"   ON public.nfc_balances FOR SELECT TO authenticated USING (public.get_my_role()='parent' AND student_id IN (SELECT id FROM public.students WHERE parent_user_id=auth.uid()));

-- NFC_TRANSACTIONS
CREATE POLICY "superadmin_nfc_tx"           ON public.nfc_transactions FOR ALL TO authenticated USING (public.get_my_role()='superadmin') WITH CHECK (public.get_my_role()='superadmin');
CREATE POLICY "staff_nfc_tx_select"         ON public.nfc_transactions FOR SELECT TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role() IN ('school_admin','editor'));
CREATE POLICY "staff_nfc_tx_insert"         ON public.nfc_transactions FOR INSERT TO authenticated WITH CHECK (tenant_id=public.get_my_tenant_id() AND public.get_my_role()='school_admin');
CREATE POLICY "parent_nfc_tx_select"        ON public.nfc_transactions FOR SELECT TO authenticated USING (public.get_my_role()='parent' AND student_id IN (SELECT id FROM public.students WHERE parent_user_id=auth.uid()));

-- ACCESS_LOGS
CREATE POLICY "superadmin_access_logs"      ON public.access_logs FOR ALL TO authenticated USING (public.get_my_role()='superadmin') WITH CHECK (public.get_my_role()='superadmin');
CREATE POLICY "staff_access_logs_select"    ON public.access_logs FOR SELECT TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role() IN ('school_admin','editor'));
CREATE POLICY "parent_access_logs_select"   ON public.access_logs FOR SELECT TO authenticated USING (public.get_my_role()='parent' AND student_id IN (SELECT id FROM public.students WHERE parent_user_id=auth.uid()));

-- SOCIAL_POSTS
CREATE POLICY "superadmin_social_posts_all" ON public.social_posts FOR ALL TO authenticated USING (public.get_my_role()='superadmin') WITH CHECK (public.get_my_role()='superadmin');
CREATE POLICY "staff_social_posts_select" ON public.social_posts FOR SELECT TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role() IN ('school_admin','editor'));
CREATE POLICY "staff_social_posts_insert" ON public.social_posts FOR INSERT TO authenticated WITH CHECK (tenant_id=public.get_my_tenant_id() AND public.get_my_role() IN ('school_admin','editor'));
CREATE POLICY "school_admin_social_posts_update" ON public.social_posts FOR UPDATE TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role()='school_admin') WITH CHECK (tenant_id=public.get_my_tenant_id() AND public.get_my_role()='school_admin');
CREATE POLICY "school_admin_social_posts_delete" ON public.social_posts FOR DELETE TO authenticated USING (tenant_id=public.get_my_tenant_id() AND public.get_my_role()='school_admin');

-- =============================================================================
-- FUNCIONES AUXILIARES
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  _tenant_id uuid;
  _role      public.user_role;
  _full_name text;
BEGIN
  _tenant_id := (NEW.raw_user_meta_data ->> 'tenant_id')::uuid;
  _role      := COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'parent');
  _full_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1));
  IF _tenant_id IS NOT NULL THEN
    INSERT INTO public.users (id, tenant_id, role, full_name, email)
    VALUES (NEW.id, _tenant_id, _role, _full_name, NEW.email);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  claims     jsonb;
  _user_id   uuid;
  _tenant_id uuid;
  _role      text;
BEGIN
  _user_id := (event ->> 'user_id')::uuid;
  SELECT u.tenant_id, u.role::text INTO _tenant_id, _role FROM public.users u WHERE u.id = _user_id;
  claims := event -> 'claims';
  IF _tenant_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(_tenant_id::text));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(_role));
  END IF;
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_tenant_dashboard_stats(p_tenant_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_leads',     (SELECT COUNT(*) FROM public.leads    WHERE tenant_id=p_tenant_id),
    'new_leads',       (SELECT COUNT(*) FROM public.leads    WHERE tenant_id=p_tenant_id AND status='new'),
    'active_students', (SELECT COUNT(*) FROM public.students WHERE tenant_id=p_tenant_id AND status='active'),
    'upcoming_tours',  (SELECT COUNT(*) FROM public.tours    WHERE tenant_id=p_tenant_id AND status='scheduled' AND scheduled_at>NOW()),
    'total_users',     (SELECT COUNT(*) FROM public.users    WHERE tenant_id=p_tenant_id),
    'conversion_rate', (SELECT ROUND(CASE WHEN COUNT(*)=0 THEN 0 ELSE (COUNT(*) FILTER (WHERE status='enrolled')::numeric/COUNT(*)::numeric)*100 END,2) FROM public.leads WHERE tenant_id=p_tenant_id)
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.reload_nfc_balance(p_tenant_id uuid, p_nfc_id text, p_amount numeric, p_payment_ref text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  _student_id  uuid;
  _new_balance numeric;
BEGIN
  SELECT student_id INTO _student_id FROM public.nfc_balances WHERE tenant_id=p_tenant_id AND nfc_id=p_nfc_id;
  IF _student_id IS NULL THEN RETURN jsonb_build_object('success',false,'error','NFC no encontrado'); END IF;
  UPDATE public.nfc_balances SET balance=balance+p_amount, last_reload_at=NOW() WHERE tenant_id=p_tenant_id AND nfc_id=p_nfc_id RETURNING balance INTO _new_balance;
  INSERT INTO public.nfc_transactions (tenant_id,student_id,nfc_id,type,amount,balance_after,description,payment_ref) VALUES (p_tenant_id,_student_id,p_nfc_id,'reload',p_amount,_new_balance,'Recarga de saldo',p_payment_ref);
  RETURN jsonb_build_object('success',true,'new_balance',_new_balance);
END;
$$;

-- =============================================================================
-- STORAGE
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('tenant-assets','tenant-assets',true,5242880,ARRAY['image/jpeg','image/png','image/webp','image/svg+xml','image/gif'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('tenant-documents','tenant-documents',false,10485760,ARRAY['application/pdf','image/jpeg','image/png','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_asset_select" ON storage.objects FOR SELECT TO public    USING (bucket_id='tenant-assets');
CREATE POLICY "staff_asset_insert"  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='tenant-assets' AND (storage.foldername(name))[1]=public.get_my_tenant_id()::text AND public.get_my_role() IN ('superadmin','school_admin','editor'));
CREATE POLICY "staff_asset_delete"  ON storage.objects FOR DELETE TO authenticated USING (bucket_id='tenant-assets' AND (storage.foldername(name))[1]=public.get_my_tenant_id()::text AND public.get_my_role() IN ('superadmin','school_admin','editor'));
CREATE POLICY "staff_docs_select"   ON storage.objects FOR SELECT TO authenticated USING (bucket_id='tenant-documents' AND (storage.foldername(name))[1]=public.get_my_tenant_id()::text AND public.get_my_role() IN ('superadmin','school_admin'));
CREATE POLICY "staff_docs_insert"   ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='tenant-documents' AND (storage.foldername(name))[1]=public.get_my_tenant_id()::text AND public.get_my_role() IN ('superadmin','school_admin'));

-- =============================================================================
-- GRANTS
-- =============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.tenants        TO anon;
GRANT SELECT ON public.content_blocks TO anon;
GRANT INSERT ON public.leads          TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- =============================================================================
-- SEED DATA
-- =============================================================================
INSERT INTO public.tenants (name, slug, plan, active_modules, primary_color, secondary_color)
VALUES ('Colegio Demo','demo','premium','["crm","website","whatsapp","google_calendar","social_media","payments","parent_portal","pwa","nfc_access","safelunch","analytics"]'::jsonb,'#1E40AF','#F59E0B')
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- ⚠️  ACCIÓN MANUAL REQUERIDA:
--  Supabase Dashboard → Authentication → Hooks
--  → Activar "Custom Access Token Hook"
--  → Seleccionar: public.custom_access_token_hook
-- =============================================================================

-- ========================================================
-- 9. Tenant Integrations
-- ========================================================
CREATE TABLE IF NOT EXISTS public.tenant_integrations (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  whatsapp_number text,
  whatsapp_message_template text,
  google_calendar_token text,      -- encriptado
  google_calendar_email text,
  facebook_url    text,
  instagram_url   text,
  tiktok_url      text,
  youtube_url     text,
  created_at      timestamptz NOT NULL DEFAULT NOW(),
  updated_at      timestamptz NOT NULL DEFAULT NOW()
);

-- RLS: solo school_admin y superadmin de ese tenant
ALTER TABLE public.tenant_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_integrations_select_admin" ON public.tenant_integrations
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('school_admin', 'superadmin')
  );

CREATE POLICY "tenant_integrations_insert_admin" ON public.tenant_integrations
  FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('school_admin', 'superadmin')
  );

CREATE POLICY "tenant_integrations_update_admin" ON public.tenant_integrations
  FOR UPDATE
  USING (
    tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('school_admin', 'superadmin')
  );

-- 9.A — BASE DE DATOS: FEED INSTITUCIONAL

CREATE TABLE IF NOT EXISTS public.institutional_posts (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) 
                ON DELETE CASCADE,
  title         text NOT NULL,
  content       text,
  post_type     text NOT NULL CHECK (post_type IN (
                  'announcement',  -- comunicado institucional
                  'event',         -- evento del colegio
                  'achievement',   -- logro o reconocimiento
                  'video_youtube', -- video de YouTube
                  'video_tiktok',  -- video de TikTok
                  'reel_instagram',-- reel de Instagram
                  'gallery_post'   -- galería de fotos del evento
                )),
  media_url     text,    -- URL del video/reel embebido
  thumbnail_url text,    -- imagen de portada del post
  images        text[],  -- para gallery_post
  embed_code    text,    -- iframe embed de YouTube/TikTok/IG
  cta_label     text,    -- texto del botón CTA (opcional)
  cta_url       text,    -- URL del botón CTA (opcional)
  tags          text[],  -- etiquetas: "deportes","arte","academia"
  is_pinned     boolean NOT NULL DEFAULT false,
  published     boolean NOT NULL DEFAULT false,
  published_at  timestamptz,
  scheduled_at  timestamptz,  -- para publicación programada
  created_by    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT NOW(),
  updated_at    timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inst_posts_tenant 
  ON public.institutional_posts (tenant_id);
CREATE INDEX idx_inst_posts_published 
  ON public.institutional_posts (tenant_id, published, published_at DESC);
CREATE INDEX idx_inst_posts_type 
  ON public.institutional_posts (tenant_id, post_type);
CREATE INDEX idx_inst_posts_pinned 
  ON public.institutional_posts (tenant_id, is_pinned) 
  WHERE is_pinned = true;

CREATE TRIGGER set_inst_posts_updated_at
  BEFORE UPDATE ON public.institutional_posts FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.institutional_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_inst_posts" 
  ON public.institutional_posts FOR ALL TO authenticated
  USING (public.get_my_role()='superadmin')
  WITH CHECK (public.get_my_role()='superadmin');

CREATE POLICY "staff_inst_posts_select" 
  ON public.institutional_posts FOR SELECT TO authenticated
  USING (tenant_id=public.get_my_tenant_id() 
    AND public.get_my_role() IN ('school_admin','editor'));

CREATE POLICY "staff_inst_posts_insert" 
  ON public.institutional_posts FOR INSERT TO authenticated
  WITH CHECK (tenant_id=public.get_my_tenant_id() 
    AND public.get_my_role() IN ('school_admin','editor'));

CREATE POLICY "staff_inst_posts_update" 
  ON public.institutional_posts FOR UPDATE TO authenticated
  USING (tenant_id=public.get_my_tenant_id() 
    AND public.get_my_role() IN ('school_admin','editor'))
  WITH CHECK (tenant_id=public.get_my_tenant_id() 
    AND public.get_my_role() IN ('school_admin','editor'));

CREATE POLICY "school_admin_inst_posts_delete" 
  ON public.institutional_posts FOR DELETE TO authenticated
  USING (tenant_id=public.get_my_tenant_id() 
    AND public.get_my_role()='school_admin');

-- Público puede leer posts publicados
CREATE POLICY "public_inst_posts_select" 
  ON public.institutional_posts FOR SELECT TO anon
  USING (published=true);

GRANT SELECT ON public.institutional_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE 
  ON public.institutional_posts TO authenticated;
GRANT ALL ON public.institutional_posts TO service_role;
