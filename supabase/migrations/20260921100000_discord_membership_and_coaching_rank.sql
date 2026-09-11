-- coaching ランク追加 + Discord 連携テーブル

ALTER TYPE public.membership_rank ADD VALUE IF NOT EXISTS 'coaching';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS member_rank_check;

CREATE TABLE IF NOT EXISTS public.discord_oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  guild_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS discord_oauth_states_expires_at_idx
  ON public.discord_oauth_states (expires_at);

ALTER TABLE public.discord_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.discord_memberships (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  discord_user_id text NOT NULL,
  guild_id text NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_checked_at timestamptz
);

CREATE INDEX IF NOT EXISTS discord_memberships_guild_id_idx
  ON public.discord_memberships (guild_id);

ALTER TABLE public.discord_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own discord membership"
  ON public.discord_memberships
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
