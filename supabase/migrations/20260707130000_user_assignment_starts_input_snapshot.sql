-- 課題開始時の入力環境スナップショット（初回 INSERT 時のみ保持。リトライでは上書きしない）
ALTER TABLE user_assignment_starts
  ADD COLUMN IF NOT EXISTS input_method text
    CHECK (input_method IS NULL OR input_method IN ('midi', 'voice')),
  ADD COLUMN IF NOT EXISTS midi_api_available boolean,
  ADD COLUMN IF NOT EXISTS midi_device_count int
    CHECK (midi_device_count IS NULL OR midi_device_count >= 0),
  ADD COLUMN IF NOT EXISTS midi_connected boolean;

CREATE OR REPLACE FUNCTION record_assignment_start(
  p_user_id uuid,
  p_lesson_song_id uuid,
  p_lesson_id uuid,
  p_platform text,
  p_is_practice boolean DEFAULT false,
  p_input_method text DEFAULT NULL,
  p_midi_api_available boolean DEFAULT NULL,
  p_midi_device_count int DEFAULT NULL,
  p_midi_connected boolean DEFAULT NULL
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

  IF p_input_method IS NOT NULL AND p_input_method NOT IN ('midi', 'voice') THEN
    RAISE EXCEPTION 'invalid input_method: %', p_input_method;
  END IF;

  IF p_midi_device_count IS NOT NULL AND p_midi_device_count < 0 THEN
    RAISE EXCEPTION 'invalid midi_device_count: %', p_midi_device_count;
  END IF;

  INSERT INTO user_assignment_starts (
    user_id,
    lesson_song_id,
    lesson_id,
    platform,
    is_practice,
    input_method,
    midi_api_available,
    midi_device_count,
    midi_connected
  )
  VALUES (
    p_user_id,
    p_lesson_song_id,
    p_lesson_id,
    p_platform,
    p_is_practice,
    p_input_method,
    p_midi_api_available,
    p_midi_device_count,
    p_midi_connected
  )
  ON CONFLICT (user_id, lesson_song_id) DO UPDATE SET
    last_started_at = now(),
    start_count = user_assignment_starts.start_count + 1,
    platform = EXCLUDED.platform;
END;
$$;
