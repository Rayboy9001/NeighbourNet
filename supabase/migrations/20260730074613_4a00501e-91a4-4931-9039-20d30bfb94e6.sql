-- Language preferences on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS auto_translate boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_original_first boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS language_onboarded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recent_languages text[] NOT NULL DEFAULT '{}'::text[];

-- Original language + english reference copy on user content
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS original_language text,
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS is_emergency boolean NOT NULL DEFAULT false;

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS original_language text;

-- Shared translation cache
CREATE TABLE IF NOT EXISTS public.translation_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_hash text NOT NULL,
  target_lang text NOT NULL,
  source_lang text,
  source_text text NOT NULL,
  translated_text text NOT NULL,
  approximate boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_hash, target_lang)
);

CREATE INDEX IF NOT EXISTS translation_cache_lookup_idx
  ON public.translation_cache (source_hash, target_lang);

GRANT SELECT ON public.translation_cache TO anon;
GRANT SELECT ON public.translation_cache TO authenticated;
GRANT ALL ON public.translation_cache TO service_role;

ALTER TABLE public.translation_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS translation_cache_select_all ON public.translation_cache;
CREATE POLICY translation_cache_select_all
  ON public.translation_cache FOR SELECT
  USING (true);

-- Reported translation problems
CREATE TABLE IF NOT EXISTS public.translation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_text text NOT NULL,
  translated_text text NOT NULL,
  target_lang text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.translation_reports TO authenticated;
GRANT ALL ON public.translation_reports TO service_role;

ALTER TABLE public.translation_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS translation_reports_insert_own ON public.translation_reports;
CREATE POLICY translation_reports_insert_own
  ON public.translation_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS translation_reports_select_own ON public.translation_reports;
CREATE POLICY translation_reports_select_own
  ON public.translation_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));