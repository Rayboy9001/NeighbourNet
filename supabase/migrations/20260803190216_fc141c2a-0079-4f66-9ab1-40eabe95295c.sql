-- =========================
-- Neighbourhood Square
-- =========================

CREATE TABLE public.squares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  emoji text NOT NULL DEFAULT '🏘',
  description text NOT NULL DEFAULT '',
  area_label text NOT NULL DEFAULT '',
  is_public boolean NOT NULL DEFAULT true,
  max_participants integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.squares TO authenticated;
GRANT SELECT ON public.squares TO anon;
GRANT ALL ON public.squares TO service_role;
ALTER TABLE public.squares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "squares_select_public" ON public.squares FOR SELECT USING (is_public = true);

CREATE TABLE public.square_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  square_id uuid NOT NULL REFERENCES public.squares(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT true,
  warnings integer NOT NULL DEFAULT 0,
  restricted_until timestamptz,
  suspended boolean NOT NULL DEFAULT false,
  quiet_hours_enabled boolean NOT NULL DEFAULT false,
  quiet_hours_start integer NOT NULL DEFAULT 22,
  quiet_hours_end integer NOT NULL DEFAULT 7,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (square_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.square_members TO authenticated;
GRANT ALL ON public.square_members TO service_role;
ALTER TABLE public.square_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_all" ON public.square_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "members_insert_own" ON public.square_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "members_update_own" ON public.square_members FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "members_delete_own" ON public.square_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.square_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  square_id uuid NOT NULL REFERENCES public.squares(id) ON DELETE CASCADE,
  title text NOT NULL,
  emoji text NOT NULL DEFAULT '💬',
  slug text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (square_id, slug)
);
GRANT SELECT, INSERT ON public.square_threads TO authenticated;
GRANT ALL ON public.square_threads TO service_role;
ALTER TABLE public.square_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "threads_select_all" ON public.square_threads FOR SELECT TO authenticated USING (true);
CREATE POLICY "threads_insert_member" ON public.square_threads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE TABLE public.square_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  square_id uuid NOT NULL REFERENCES public.squares(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL REFERENCES public.square_threads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_bot boolean NOT NULL DEFAULT false,
  body text NOT NULL DEFAULT '',
  image_path text,
  ai_image_warning boolean NOT NULL DEFAULT false,
  report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  reply_to_id uuid REFERENCES public.square_messages(id) ON DELETE SET NULL,
  mentions text[] NOT NULL DEFAULT '{}',
  hidden boolean NOT NULL DEFAULT false,
  moderation_reason text,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX square_messages_thread_idx ON public.square_messages (thread_id, created_at);
GRANT SELECT, UPDATE, DELETE ON public.square_messages TO authenticated;
GRANT ALL ON public.square_messages TO service_role;
ALTER TABLE public.square_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select_visible" ON public.square_messages FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (hidden = false OR auth.uid() = user_id));
CREATE POLICY "messages_update_own" ON public.square_messages FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "messages_delete_own" ON public.square_messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE public.square_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.square_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.square_reactions TO authenticated;
GRANT ALL ON public.square_reactions TO service_role;
ALTER TABLE public.square_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions_select_all" ON public.square_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "reactions_insert_own" ON public.square_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_delete_own" ON public.square_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.square_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.square_messages(id) ON DELETE CASCADE,
  question text NOT NULL,
  options text[] NOT NULL,
  closes_at timestamptz NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.square_polls TO authenticated;
GRANT ALL ON public.square_polls TO service_role;
ALTER TABLE public.square_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "polls_select_all" ON public.square_polls FOR SELECT TO authenticated USING (true);

CREATE TABLE public.square_poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.square_polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_index integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.square_poll_votes TO authenticated;
GRANT ALL ON public.square_poll_votes TO service_role;
ALTER TABLE public.square_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes_select_all" ON public.square_poll_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "votes_insert_own" ON public.square_poll_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "votes_update_own" ON public.square_poll_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "votes_delete_own" ON public.square_poll_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.square_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'block',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, blocked_user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.square_blocks TO authenticated;
GRANT ALL ON public.square_blocks TO service_role;
ALTER TABLE public.square_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks_all_own" ON public.square_blocks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.square_message_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.square_messages(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, reporter_id)
);
GRANT SELECT, INSERT ON public.square_message_reports TO authenticated;
GRANT ALL ON public.square_message_reports TO service_role;
ALTER TABLE public.square_message_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_reports_select_own" ON public.square_message_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "msg_reports_insert_own" ON public.square_message_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE TABLE public.square_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.square_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (thread_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.square_reads TO authenticated;
GRANT ALL ON public.square_reads TO service_role;
ALTER TABLE public.square_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reads_select_all" ON public.square_reads FOR SELECT TO authenticated USING (true);
CREATE POLICY "reads_write_own" ON public.square_reads FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at triggers
CREATE TRIGGER squares_updated_at BEFORE UPDATE ON public.squares
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER square_members_updated_at BEFORE UPDATE ON public.square_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER square_threads_updated_at BEFORE UPDATE ON public.square_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- realtime
ALTER TABLE public.square_messages REPLICA IDENTITY FULL;
ALTER TABLE public.square_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.square_poll_votes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.square_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.square_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.square_poll_votes;

-- seed squares + topic threads
INSERT INTO public.squares (id, name, slug, emoji, description, area_label) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Arusha Central Square', 'arusha-central', '🏘', 'Neighbours around Arusha city centre sharing local updates.', 'Arusha Central'),
  ('22222222-2222-4222-8222-222222222222', 'Kimara Square', 'kimara', '🏘', 'Kimara residents discussing roads, water and community events.', 'Kimara'),
  ('33333333-3333-4333-8333-333333333333', 'Riverside Square', 'riverside', '🏘', 'Riverside neighbours keeping each other informed and safe.', 'Riverside');

INSERT INTO public.square_threads (square_id, title, emoji, slug, sort_order)
SELECT s.id, t.title, t.emoji, t.slug, t.sort_order
FROM public.squares s
CROSS JOIN (VALUES
  ('General Chat', '☕', 'general', 10),
  ('Road Repairs', '🚧', 'road-repairs', 20),
  ('Water Outage', '💧', 'water-outage', 30),
  ('Community Garden', '🌳', 'community-garden', 40),
  ('Lost Pet', '🐶', 'lost-pet', 50)
) AS t(title, emoji, slug, sort_order);