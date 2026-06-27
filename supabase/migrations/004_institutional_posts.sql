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
