ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS community_points integer NOT NULL DEFAULT 0;

UPDATE public.profiles SET community_points = COALESCE(points, 0);

CREATE TABLE IF NOT EXISTS public.point_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  source_key text,
  balance_after integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS point_transactions_source_key_uniq
  ON public.point_transactions (user_id, source_key)
  WHERE source_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS point_transactions_user_created_idx
  ON public.point_transactions (user_id, created_at DESC);

GRANT SELECT ON public.point_transactions TO authenticated;
GRANT ALL ON public.point_transactions TO service_role;

ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own point transactions" ON public.point_transactions;
CREATE POLICY "Users can view their own point transactions"
  ON public.point_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.award_points(
  _user_id uuid,
  _amount integer,
  _reason text,
  _source_key text DEFAULT NULL
)
RETURNS TABLE (balance integer, awarded boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _balance integer;
BEGIN
  IF _source_key IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.point_transactions t
    WHERE t.user_id = _user_id AND t.source_key = _source_key
  ) THEN
    SELECT p.community_points INTO _balance FROM public.profiles p WHERE p.id = _user_id;
    RETURN QUERY SELECT COALESCE(_balance, 0), false;
    RETURN;
  END IF;

  UPDATE public.profiles
     SET community_points = GREATEST(0, community_points + _amount),
         points = GREATEST(0, community_points + _amount),
         updated_at = now()
   WHERE id = _user_id
   RETURNING community_points INTO _balance;

  IF _balance IS NULL THEN
    RETURN QUERY SELECT 0, false;
    RETURN;
  END IF;

  INSERT INTO public.point_transactions (user_id, amount, reason, source_key, balance_after)
  VALUES (_user_id, _amount, _reason, _source_key, _balance);

  RETURN QUERY SELECT _balance, true;
END;
$$;

REVOKE ALL ON FUNCTION public.award_points(uuid, integer, text, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_points(uuid, integer, text, text) TO service_role;

ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.point_transactions REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.point_transactions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;