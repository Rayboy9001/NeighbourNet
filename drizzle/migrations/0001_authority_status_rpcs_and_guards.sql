-- ============================================================
-- Authority-controlled writes: guards + atomic RPCs
-- ============================================================

-- 1. Residents may edit their own report content, but never the
--    authority-controlled fields. Only the SECURITY DEFINER functions below
--    (which set app.authority_action) may touch them.
CREATE OR REPLACE FUNCTION public.guard_report_authority_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(current_setting('app.authority_action', true), '') = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.organisation_id IS DISTINCT FROM OLD.organisation_id
     OR NEW.priority IS DISTINCT FROM OLD.priority
     OR NEW.resolved_at IS DISTINCT FROM OLD.resolved_at
     OR NEW.closed_at IS DISTINCT FROM OLD.closed_at
     OR NEW.incident_id IS DISTINCT FROM OLD.incident_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
  THEN
    RAISE EXCEPTION 'Authority-controlled report fields can only be changed through authority functions';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reports_guard_authority_fields ON public.reports;
CREATE TRIGGER reports_guard_authority_fields
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.guard_report_authority_fields();

-- 2. Status history is append-only.
CREATE OR REPLACE FUNCTION public.deny_write()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RAISE EXCEPTION 'Audit records are immutable';
END;
$$;

DROP TRIGGER IF EXISTS report_status_history_immutable ON public.report_status_history;
CREATE TRIGGER report_status_history_immutable
  BEFORE UPDATE OR DELETE ON public.report_status_history
  FOR EACH ROW EXECUTE FUNCTION public.deny_write();

-- 3. Allowed lifecycle transitions.
CREATE OR REPLACE FUNCTION public.is_valid_status_transition(_old public.report_status, _new public.report_status)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _old::text
    WHEN 'reported'             THEN _new::text IN ('verified','assigned','rejected','duplicate','awaiting_information')
    WHEN 'verified'             THEN _new::text IN ('assigned','awaiting_information','rejected','duplicate')
    WHEN 'assigned'             THEN _new::text IN ('in_progress','awaiting_information','verified','rejected','duplicate')
    WHEN 'in_progress'          THEN _new::text IN ('resolved','awaiting_information','assigned')
    WHEN 'awaiting_information' THEN _new::text IN ('verified','assigned','in_progress','rejected','duplicate')
    WHEN 'resolved'             THEN _new::text IN ('closed','reopened')
    WHEN 'reopened'             THEN _new::text IN ('assigned','in_progress','awaiting_information')
    WHEN 'closed'               THEN _new::text IN ('reopened')
    WHEN 'rejected'             THEN _new::text IN ('reopened')
    WHEN 'duplicate'            THEN _new::text IN ('reopened')
    ELSE false
  END;
$$;

-- 4. Atomic authority status change: authn + role + org + transition + audit.
CREATE OR REPLACE FUNCTION public.authority_update_report_status(
  _report_id uuid,
  _new_status public.report_status,
  _reason text DEFAULT ''
)
RETURNS public.report_status
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _org uuid;
  _old public.report_status;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT r.status INTO _old FROM public.reports r WHERE r.id = _report_id;
  IF _old IS NULL THEN RAISE EXCEPTION 'Report not found'; END IF;

  _org := public.report_handling_organisation(_report_id);
  IF _org IS NULL THEN RAISE EXCEPTION 'Report is not assigned to an organisation'; END IF;

  IF NOT (public.has_authority_role(_uid, _org, 'organisation_admin')
       OR public.has_authority_role(_uid, _org, 'case_manager')
       OR public.has_authority_role(_uid, _org, 'field_officer')) THEN
    RAISE EXCEPTION 'Forbidden: not an authorised member of the handling organisation';
  END IF;

  IF NOT public.is_valid_status_transition(_old, _new_status) THEN
    RAISE EXCEPTION 'Invalid status transition % -> %', _old, _new_status;
  END IF;

  PERFORM set_config('app.authority_action', 'on', true);

  UPDATE public.reports
     SET status = _new_status,
         resolved_at = CASE WHEN _new_status::text = 'resolved' THEN now()
                            WHEN _new_status::text = 'reopened' THEN NULL
                            ELSE resolved_at END,
         closed_at   = CASE WHEN _new_status::text = 'closed' THEN now()
                            WHEN _new_status::text = 'reopened' THEN NULL
                            ELSE closed_at END,
         updated_at = now()
   WHERE id = _report_id;

  INSERT INTO public.report_status_history (report_id, old_status, new_status, changed_by, organisation_id, reason)
  VALUES (_report_id, _old, _new_status, _uid, _org, COALESCE(left(_reason, 1000), ''));

  PERFORM set_config('app.authority_action', 'off', true);
  RETURN _new_status;
END;
$$;

-- 5. Atomic assignment / reassignment.
CREATE OR REPLACE FUNCTION public.authority_assign_report(
  _report_id uuid,
  _organisation_id uuid,
  _department_id uuid DEFAULT NULL,
  _assigned_to uuid DEFAULT NULL,
  _note text DEFAULT ''
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _current uuid;
  _old public.report_status;
  _new_id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF NOT (public.has_authority_role(_uid, _organisation_id, 'organisation_admin')
       OR public.has_authority_role(_uid, _organisation_id, 'case_manager')) THEN
    RAISE EXCEPTION 'Forbidden: assignment requires organisation_admin or case_manager';
  END IF;

  SELECT r.status INTO _old FROM public.reports r WHERE r.id = _report_id;
  IF _old IS NULL THEN RAISE EXCEPTION 'Report not found'; END IF;

  _current := public.report_handling_organisation(_report_id);
  IF _current IS NOT NULL AND _current <> _organisation_id
     AND NOT public.has_authority_role(_uid, _current, 'organisation_admin')
     AND NOT public.has_authority_role(_uid, _current, 'case_manager') THEN
    RAISE EXCEPTION 'Forbidden: report is handled by another organisation';
  END IF;

  IF _department_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.departments d WHERE d.id = _department_id AND d.organisation_id = _organisation_id
  ) THEN RAISE EXCEPTION 'Department does not belong to this organisation'; END IF;

  IF _assigned_to IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.authority_members m
    WHERE m.id = _assigned_to AND m.organisation_id = _organisation_id AND m.active
  ) THEN RAISE EXCEPTION 'Assignee is not an active member of this organisation'; END IF;

  UPDATE public.report_assignments
     SET active = false, unassigned_at = now()
   WHERE report_id = _report_id AND active;

  INSERT INTO public.report_assignments
    (report_id, organisation_id, department_id, assigned_to, assigned_by, assignment_note)
  VALUES (_report_id, _organisation_id, _department_id, _assigned_to, _uid, COALESCE(left(_note, 1000), ''))
  RETURNING id INTO _new_id;

  PERFORM set_config('app.authority_action', 'on', true);
  UPDATE public.reports SET organisation_id = _organisation_id, updated_at = now() WHERE id = _report_id;

  IF public.is_valid_status_transition(_old, 'assigned'::public.report_status) THEN
    UPDATE public.reports SET status = 'assigned', updated_at = now() WHERE id = _report_id;
    INSERT INTO public.report_status_history (report_id, old_status, new_status, changed_by, organisation_id, reason)
    VALUES (_report_id, _old, 'assigned', _uid, _organisation_id, 'Assigned to organisation');
  END IF;
  PERFORM set_config('app.authority_action', 'off', true);

  RETURN _new_id;
END;
$$;

-- 6. Unassign (keeps the audit trail).
CREATE OR REPLACE FUNCTION public.authority_unassign_report(_report_id uuid, _reason text DEFAULT '')
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _org uuid := public.report_handling_organisation(_report_id);
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _org IS NULL THEN RETURN false; END IF;
  IF NOT (public.has_authority_role(_uid, _org, 'organisation_admin')
       OR public.has_authority_role(_uid, _org, 'case_manager')) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.report_assignments SET active = false, unassigned_at = now()
   WHERE report_id = _report_id AND active;

  PERFORM set_config('app.authority_action', 'on', true);
  UPDATE public.reports SET organisation_id = NULL, updated_at = now() WHERE id = _report_id;
  PERFORM set_config('app.authority_action', 'off', true);
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.authority_update_report_status(uuid, public.report_status, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.authority_assign_report(uuid, uuid, uuid, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.authority_unassign_report(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.guard_report_authority_fields() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deny_write() FROM anon, authenticated;
