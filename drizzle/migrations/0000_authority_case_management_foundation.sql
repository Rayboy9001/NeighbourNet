-- ============================================================
-- Authority / Case Management foundation
-- ============================================================

-- 1. New lifecycle states (additive; existing states untouched)
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'duplicate';
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'awaiting_information';
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'reopened';
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'closed';

DO $$ BEGIN
  CREATE TYPE public.organisation_type AS ENUM (
    'local_authority','police','fire','medical','utilities',
    'road_authority','waste_management','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.authority_role AS ENUM (
    'organisation_admin','case_manager','field_officer','viewer'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. Organisations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 2 AND 160),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{2,80}$'),
  description text NOT NULL DEFAULT '',
  organisation_type public.organisation_type NOT NULL DEFAULT 'other',
  logo_url text,
  contact_email text,
  contact_phone text,
  address text,
  area_label text NOT NULL DEFAULT '',
  verified boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS organisations_type_idx ON public.organisations(organisation_type) WHERE active;

GRANT SELECT, UPDATE ON public.organisations TO authenticated;
GRANT SELECT ON public.organisations TO anon;
GRANT ALL ON public.organisations TO service_role;
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Authority members
-- ============================================================
CREATE TABLE IF NOT EXISTS public.authority_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.authority_role NOT NULL DEFAULT 'viewer',
  active boolean NOT NULL DEFAULT true,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, user_id)
);
CREATE INDEX IF NOT EXISTS authority_members_user_idx ON public.authority_members(user_id) WHERE active;

GRANT SELECT, INSERT, UPDATE ON public.authority_members TO authenticated;
GRANT ALL ON public.authority_members TO service_role;
ALTER TABLE public.authority_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. Departments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 2 AND 120),
  description text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, name)
);
GRANT SELECT, INSERT, UPDATE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. Incident grouping foundation (multiple reports -> one incident)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.report_incidents TO authenticated, anon;
GRANT ALL ON public.report_incidents TO service_role;
ALTER TABLE public.report_incidents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. Reports: minimal authority-facing extensions
-- ============================================================
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS incident_id uuid REFERENCES public.report_incidents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS priority smallint NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.reports ADD CONSTRAINT reports_priority_range CHECK (priority BETWEEN 1 AND 5);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS reports_organisation_idx ON public.reports(organisation_id);
CREATE INDEX IF NOT EXISTS reports_incident_idx ON public.reports(incident_id);

-- ============================================================
-- 7. Report assignments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.authority_members(id) ON DELETE SET NULL,
  assigned_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_note text NOT NULL DEFAULT '',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  unassigned_at timestamptz,
  active boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX IF NOT EXISTS report_assignments_one_active
  ON public.report_assignments(report_id) WHERE active;
CREATE INDEX IF NOT EXISTS report_assignments_org_idx ON public.report_assignments(organisation_id);

GRANT SELECT, INSERT, UPDATE ON public.report_assignments TO authenticated;
GRANT ALL ON public.report_assignments TO service_role;
ALTER TABLE public.report_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. Status history (append-only audit)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  old_status public.report_status,
  new_status public.report_status NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organisation_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS report_status_history_report_idx ON public.report_status_history(report_id, created_at DESC);

GRANT SELECT ON public.report_status_history TO authenticated;
GRANT ALL ON public.report_status_history TO service_role;
ALTER TABLE public.report_status_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. Internal authority notes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.authority_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note text NOT NULL CHECK (length(btrim(note)) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS authority_notes_report_idx ON public.authority_notes(report_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.authority_notes TO authenticated;
GRANT ALL ON public.authority_notes TO service_role;
ALTER TABLE public.authority_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 10. Resolution evidence
-- ============================================================
CREATE TABLE IF NOT EXISTS public.resolution_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (file_type IN ('image/jpeg','image/png','image/webp','application/pdf'))
);
CREATE INDEX IF NOT EXISTS resolution_evidence_report_idx ON public.resolution_evidence(report_id);

GRANT SELECT, INSERT ON public.resolution_evidence TO authenticated;
GRANT ALL ON public.resolution_evidence TO service_role;
ALTER TABLE public.resolution_evidence ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. updated_at triggers
-- ============================================================
DROP TRIGGER IF EXISTS organisations_updated_at ON public.organisations;
CREATE TRIGGER organisations_updated_at BEFORE UPDATE ON public.organisations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS authority_members_updated_at ON public.authority_members;
CREATE TRIGGER authority_members_updated_at BEFORE UPDATE ON public.authority_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS departments_updated_at ON public.departments;
CREATE TRIGGER departments_updated_at BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS authority_notes_updated_at ON public.authority_notes;
CREATE TRIGGER authority_notes_updated_at BEFORE UPDATE ON public.authority_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS report_incidents_updated_at ON public.report_incidents;
CREATE TRIGGER report_incidents_updated_at BEFORE UPDATE ON public.report_incidents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 12. Authority permission functions (SECURITY DEFINER, fixed search_path)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_authority_member(_user_id uuid, _organisation_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.authority_members m
    WHERE m.user_id = _user_id AND m.organisation_id = _organisation_id
      AND m.active AND m.verified
  );
$$;

CREATE OR REPLACE FUNCTION public.has_authority_role(_user_id uuid, _organisation_id uuid, _role public.authority_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.authority_members m
    WHERE m.user_id = _user_id AND m.organisation_id = _organisation_id
      AND m.role = _role AND m.active AND m.verified
  );
$$;

-- Organisation currently handling a report (active assignment wins, else report.organisation_id)
CREATE OR REPLACE FUNCTION public.report_handling_organisation(_report_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT a.organisation_id FROM public.report_assignments a
      WHERE a.report_id = _report_id AND a.active LIMIT 1),
    (SELECT r.organisation_id FROM public.reports r WHERE r.id = _report_id)
  );
$$;

-- Can the user act on this case (manage = admin / case manager / field officer)
CREATE OR REPLACE FUNCTION public.can_manage_report(_user_id uuid, _report_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.authority_members m
    WHERE m.user_id = _user_id
      AND m.active AND m.verified
      AND m.role IN ('organisation_admin','case_manager','field_officer')
      AND m.organisation_id = public.report_handling_organisation(_report_id)
  );
$$;

-- Read-level access (includes viewers); unassigned reports are visible to any
-- verified authority member so a case can be picked up.
CREATE OR REPLACE FUNCTION public.can_view_report_case(_user_id uuid, _report_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN public.report_handling_organisation(_report_id) IS NULL THEN EXISTS (
      SELECT 1 FROM public.authority_members m
      WHERE m.user_id = _user_id AND m.active AND m.verified
    )
    ELSE EXISTS (
      SELECT 1 FROM public.authority_members m
      WHERE m.user_id = _user_id AND m.active AND m.verified
        AND m.organisation_id = public.report_handling_organisation(_report_id)
    )
  END;
$$;

REVOKE EXECUTE ON FUNCTION public.report_handling_organisation(uuid) FROM anon;

-- ============================================================
-- 13. RLS policies
-- ============================================================

-- Organisations: public directory of verified+active orgs; members see their own org.
DROP POLICY IF EXISTS organisations_select_public ON public.organisations;
CREATE POLICY organisations_select_public ON public.organisations
  FOR SELECT USING (
    (verified AND active)
    OR public.is_authority_member(auth.uid(), id)
    OR public.has_role(auth.uid(), 'admin')
  );
DROP POLICY IF EXISTS organisations_update_org_admin ON public.organisations;
CREATE POLICY organisations_update_org_admin ON public.organisations
  FOR UPDATE TO authenticated
  USING (public.has_authority_role(auth.uid(), id, 'organisation_admin'))
  WITH CHECK (public.has_authority_role(auth.uid(), id, 'organisation_admin'));
-- INSERT/DELETE intentionally have no policy: organisations are created and
-- verified only through the platform (service role) path.

-- Authority members
DROP POLICY IF EXISTS authority_members_select ON public.authority_members;
CREATE POLICY authority_members_select ON public.authority_members
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR public.is_authority_member(auth.uid(), organisation_id)
  );
DROP POLICY IF EXISTS authority_members_insert_org_admin ON public.authority_members;
CREATE POLICY authority_members_insert_org_admin ON public.authority_members
  FOR INSERT TO authenticated
  WITH CHECK (public.has_authority_role(auth.uid(), organisation_id, 'organisation_admin'));
DROP POLICY IF EXISTS authority_members_update_org_admin ON public.authority_members;
CREATE POLICY authority_members_update_org_admin ON public.authority_members
  FOR UPDATE TO authenticated
  USING (public.has_authority_role(auth.uid(), organisation_id, 'organisation_admin'))
  WITH CHECK (public.has_authority_role(auth.uid(), organisation_id, 'organisation_admin'));

-- Departments
DROP POLICY IF EXISTS departments_select ON public.departments;
CREATE POLICY departments_select ON public.departments
  FOR SELECT TO authenticated USING (public.is_authority_member(auth.uid(), organisation_id));
DROP POLICY IF EXISTS departments_insert_org_admin ON public.departments;
CREATE POLICY departments_insert_org_admin ON public.departments
  FOR INSERT TO authenticated
  WITH CHECK (public.has_authority_role(auth.uid(), organisation_id, 'organisation_admin'));
DROP POLICY IF EXISTS departments_update_org_admin ON public.departments;
CREATE POLICY departments_update_org_admin ON public.departments
  FOR UPDATE TO authenticated
  USING (public.has_authority_role(auth.uid(), organisation_id, 'organisation_admin'))
  WITH CHECK (public.has_authority_role(auth.uid(), organisation_id, 'organisation_admin'));

-- Incidents: readable by everyone signed in, written only by authority staff.
DROP POLICY IF EXISTS report_incidents_select ON public.report_incidents;
CREATE POLICY report_incidents_select ON public.report_incidents FOR SELECT USING (true);

-- Report assignments
DROP POLICY IF EXISTS report_assignments_select ON public.report_assignments;
CREATE POLICY report_assignments_select ON public.report_assignments
  FOR SELECT TO authenticated USING (
    public.is_authority_member(auth.uid(), organisation_id)
    OR EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.user_id = auth.uid())
  );
DROP POLICY IF EXISTS report_assignments_insert_authority ON public.report_assignments;
CREATE POLICY report_assignments_insert_authority ON public.report_assignments
  FOR INSERT TO authenticated WITH CHECK (
    assigned_by = auth.uid()
    AND (
      public.has_authority_role(auth.uid(), organisation_id, 'organisation_admin')
      OR public.has_authority_role(auth.uid(), organisation_id, 'case_manager')
    )
    AND (department_id IS NULL OR EXISTS (
      SELECT 1 FROM public.departments d WHERE d.id = department_id AND d.organisation_id = organisation_id
    ))
    AND (assigned_to IS NULL OR EXISTS (
      SELECT 1 FROM public.authority_members m WHERE m.id = assigned_to AND m.organisation_id = organisation_id
    ))
  );
DROP POLICY IF EXISTS report_assignments_update_authority ON public.report_assignments;
CREATE POLICY report_assignments_update_authority ON public.report_assignments
  FOR UPDATE TO authenticated
  USING (
    public.has_authority_role(auth.uid(), organisation_id, 'organisation_admin')
    OR public.has_authority_role(auth.uid(), organisation_id, 'case_manager')
  )
  WITH CHECK (
    public.has_authority_role(auth.uid(), organisation_id, 'organisation_admin')
    OR public.has_authority_role(auth.uid(), organisation_id, 'case_manager')
  );

-- Status history: readable by the reporter and by the handling organisation.
-- No INSERT/UPDATE/DELETE policy at all: written only by the SECURITY DEFINER RPC.
DROP POLICY IF EXISTS report_status_history_select ON public.report_status_history;
CREATE POLICY report_status_history_select ON public.report_status_history
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.user_id = auth.uid())
    OR public.can_view_report_case(auth.uid(), report_id)
  );

-- Internal notes: authority only, never residents.
DROP POLICY IF EXISTS authority_notes_select ON public.authority_notes;
CREATE POLICY authority_notes_select ON public.authority_notes
  FOR SELECT TO authenticated USING (
    deleted_at IS NULL AND public.is_authority_member(auth.uid(), organisation_id)
  );
DROP POLICY IF EXISTS authority_notes_insert ON public.authority_notes;
CREATE POLICY authority_notes_insert ON public.authority_notes
  FOR INSERT TO authenticated WITH CHECK (
    author_id = auth.uid()
    AND public.is_authority_member(auth.uid(), organisation_id)
    AND NOT public.has_authority_role(auth.uid(), organisation_id, 'viewer')
    AND organisation_id = COALESCE(public.report_handling_organisation(report_id), organisation_id)
  );
DROP POLICY IF EXISTS authority_notes_update_own ON public.authority_notes;
CREATE POLICY authority_notes_update_own ON public.authority_notes
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND public.is_authority_member(auth.uid(), organisation_id))
  WITH CHECK (author_id = auth.uid());

-- Resolution evidence: authority of the handling org + the reporter may read.
DROP POLICY IF EXISTS resolution_evidence_select ON public.resolution_evidence;
CREATE POLICY resolution_evidence_select ON public.resolution_evidence
  FOR SELECT TO authenticated USING (
    public.is_authority_member(auth.uid(), organisation_id)
    OR EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.user_id = auth.uid())
  );
DROP POLICY IF EXISTS resolution_evidence_insert ON public.resolution_evidence;
CREATE POLICY resolution_evidence_insert ON public.resolution_evidence
  FOR INSERT TO authenticated WITH CHECK (
    uploaded_by = auth.uid()
    AND public.can_manage_report(auth.uid(), report_id)
    AND organisation_id = public.report_handling_organisation(report_id)
  );
