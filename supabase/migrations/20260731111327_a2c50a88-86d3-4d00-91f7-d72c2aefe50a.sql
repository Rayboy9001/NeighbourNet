CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date date NOT NULL UNIQUE,
  questions jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.challenges TO authenticated;
GRANT SELECT ON public.challenges TO anon;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges_select_all" ON public.challenges FOR SELECT USING (true);

CREATE TABLE public.challenge_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  challenge_date date NOT NULL,
  score integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 15,
  avg_time_ms integer NOT NULL DEFAULT 0,
  points_earned integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_id)
);
GRANT SELECT, INSERT, UPDATE ON public.challenge_attempts TO authenticated;
GRANT SELECT ON public.challenge_attempts TO anon;
GRANT ALL ON public.challenge_attempts TO service_role;
ALTER TABLE public.challenge_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts_select_all" ON public.challenge_attempts FOR SELECT USING (true);
CREATE POLICY "attempts_insert_own" ON public.challenge_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "attempts_update_own" ON public.challenge_attempts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER challenge_attempts_updated_at BEFORE UPDATE ON public.challenge_attempts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX challenge_attempts_date_idx ON public.challenge_attempts (challenge_date DESC, score DESC);

CREATE TABLE public.challenge_streaks (
  user_id uuid PRIMARY KEY,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  streak_savers integer NOT NULL DEFAULT 0,
  last_played_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.challenge_streaks TO authenticated;
GRANT SELECT ON public.challenge_streaks TO anon;
GRANT ALL ON public.challenge_streaks TO service_role;
ALTER TABLE public.challenge_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "streaks_select_all" ON public.challenge_streaks FOR SELECT USING (true);
CREATE POLICY "streaks_insert_own" ON public.challenge_streaks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "streaks_update_own" ON public.challenge_streaks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER challenge_streaks_updated_at BEFORE UPDATE ON public.challenge_streaks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.challenge_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);
GRANT SELECT, INSERT ON public.challenge_achievements TO authenticated;
GRANT SELECT ON public.challenge_achievements TO anon;
GRANT ALL ON public.challenge_achievements TO service_role;
ALTER TABLE public.challenge_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements_select_all" ON public.challenge_achievements FOR SELECT USING (true);
CREATE POLICY "achievements_insert_own" ON public.challenge_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.challenge_duels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid NOT NULL,
  opponent_id uuid NOT NULL,
  challenge_date date NOT NULL,
  challenger_score integer,
  opponent_score integer,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenger_id, opponent_id, challenge_date)
);
GRANT SELECT, INSERT, UPDATE ON public.challenge_duels TO authenticated;
GRANT ALL ON public.challenge_duels TO service_role;
ALTER TABLE public.challenge_duels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "duels_select_participant" ON public.challenge_duels FOR SELECT TO authenticated USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);
CREATE POLICY "duels_insert_challenger" ON public.challenge_duels FOR INSERT TO authenticated WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "duels_update_participant" ON public.challenge_duels FOR UPDATE TO authenticated USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);
CREATE TRIGGER challenge_duels_updated_at BEFORE UPDATE ON public.challenge_duels FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();