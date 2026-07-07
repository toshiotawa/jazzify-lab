-- 課題（lesson_songs）単位の開始記録。ファネル分析の正本。
CREATE TABLE IF NOT EXISTS user_assignment_starts (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_song_id uuid NOT NULL REFERENCES lesson_songs(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  first_started_at timestamptz NOT NULL DEFAULT now(),
  last_started_at timestamptz NOT NULL DEFAULT now(),
  start_count int NOT NULL DEFAULT 1 CHECK (start_count >= 1),
  platform text NOT NULL CHECK (platform IN ('web', 'ios')),
  is_practice boolean NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, lesson_song_id)
);

CREATE INDEX IF NOT EXISTS idx_user_assignment_starts_lesson_song
  ON user_assignment_starts (lesson_song_id);

CREATE INDEX IF NOT EXISTS idx_user_assignment_starts_first_started_at
  ON user_assignment_starts (first_started_at);

ALTER TABLE user_assignment_starts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_assignment_starts_select_own" ON user_assignment_starts
  FOR SELECT USING (auth.uid() = user_id);

-- クライアントは RPC 経由のみ。直接 INSERT/UPDATE は許可しない。
CREATE OR REPLACE FUNCTION record_assignment_start(
  p_user_id uuid,
  p_lesson_song_id uuid,
  p_lesson_id uuid,
  p_platform text,
  p_is_practice boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_platform NOT IN ('web', 'ios') THEN
    RAISE EXCEPTION 'invalid platform: %', p_platform;
  END IF;

  INSERT INTO user_assignment_starts (
    user_id,
    lesson_song_id,
    lesson_id,
    platform,
    is_practice
  )
  VALUES (
    p_user_id,
    p_lesson_song_id,
    p_lesson_id,
    p_platform,
    p_is_practice
  )
  ON CONFLICT (user_id, lesson_song_id) DO UPDATE SET
    last_started_at = now(),
    start_count = user_assignment_starts.start_count + 1,
    platform = EXCLUDED.platform;
END;
$$;
