-- Defense mode: stages, phrases, difficulty levels, clears
BEGIN;

CREATE TABLE IF NOT EXISTS public.defense_difficulty_levels (
  level smallint PRIMARY KEY CHECK (level >= 1 AND level <= 10),
  enemy_hp smallint NOT NULL CHECK (enemy_hp > 0),
  spawn_interval_sec numeric NOT NULL CHECK (spawn_interval_sec > 0),
  max_enemies smallint NOT NULL CHECK (max_enemies > 0),
  enemy_speed_px_per_sec numeric NOT NULL CHECK (enemy_speed_px_per_sec > 0),
  enemy_damage smallint NOT NULL CHECK (enemy_damage > 0),
  attack_interval_sec numeric NOT NULL CHECK (attack_interval_sec > 0),
  attack_range_px numeric NOT NULL CHECK (attack_range_px > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.defense_difficulty_levels IS 'Defense mode difficulty presets (10 levels).';

CREATE TABLE IF NOT EXISTS public.defense_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  stage_number integer NOT NULL CHECK (stage_number > 0) UNIQUE,
  title text NOT NULL,
  title_en text NOT NULL DEFAULT '',
  bpm numeric NOT NULL CHECK (bpm > 0),
  beats_per_bar smallint NOT NULL DEFAULT 4 CHECK (beats_per_bar > 0),
  phrase_bars smallint NOT NULL DEFAULT 2 CHECK (phrase_bars > 0 AND phrase_bars <= 4),
  staff_layout text NOT NULL DEFAULT 'treble'
    CHECK (staff_layout IN ('treble', 'grand')),
  key_fifths smallint NOT NULL DEFAULT 0 CHECK (key_fifths >= -7 AND key_fifths <= 7),
  required_completion_count smallint NOT NULL DEFAULT 1 CHECK (required_completion_count > 0),
  difficulty_level smallint NOT NULL REFERENCES public.defense_difficulty_levels(level),
  survive_seconds smallint NOT NULL DEFAULT 120 CHECK (survive_seconds > 0),
  player_hp smallint NOT NULL DEFAULT 5 CHECK (player_hp > 0),
  production_staff_hint_mode text NOT NULL DEFAULT 'fade_15s'
    CHECK (production_staff_hint_mode IN ('fade_15s', 'always', 'hidden_until_pressed')),
  production_keyboard_hint_mode text NOT NULL DEFAULT 'fade_15s'
    CHECK (production_keyboard_hint_mode IN ('fade_15s', 'always', 'hidden_until_pressed')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.defense_stages IS 'Defense mode stage metadata.';

CREATE TABLE IF NOT EXISTS public.defense_phrases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES public.defense_stages(id) ON DELETE CASCADE,
  order_index smallint NOT NULL CHECK (order_index >= 0),
  title text NOT NULL DEFAULT '',
  audio_url text NOT NULL,
  key_fifths smallint CHECK (key_fifths >= -7 AND key_fifths <= 7),
  required_completion_count smallint CHECK (required_completion_count > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stage_id, order_index)
);

COMMENT ON TABLE public.defense_phrases IS 'Defense mode backing track + phrase content per stage.';

CREATE TABLE IF NOT EXISTS public.defense_phrase_chords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phrase_id uuid NOT NULL REFERENCES public.defense_phrases(id) ON DELETE CASCADE,
  order_index smallint NOT NULL CHECK (order_index >= 0),
  chord_name text NOT NULL DEFAULT '',
  measure_number smallint NOT NULL CHECK (measure_number > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (phrase_id, order_index)
);

COMMENT ON TABLE public.defense_phrase_chords IS 'One chord chunk per measure within a defense phrase.';

CREATE TABLE IF NOT EXISTS public.defense_phrase_chord_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chord_id uuid NOT NULL REFERENCES public.defense_phrase_chords(id) ON DELETE CASCADE,
  order_index smallint NOT NULL CHECK (order_index >= 0),
  pitch_midi smallint NOT NULL CHECK (pitch_midi >= 0 AND pitch_midi <= 127),
  pitch_class smallint NOT NULL CHECK (pitch_class >= 0 AND pitch_class <= 11),
  note_name text NOT NULL,
  staff smallint NOT NULL DEFAULT 1 CHECK (staff IN (1, 2)),
  step_index smallint CHECK (step_index >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chord_id, order_index)
);

COMMENT ON TABLE public.defense_phrase_chord_notes IS 'Sequential notes within a defense phrase chunk. Same step_index = simultaneous chord.';

CREATE TABLE IF NOT EXISTS public.defense_stage_clears (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES public.defense_stages(id) ON DELETE CASCADE,
  best_survive_sec smallint NOT NULL DEFAULT 0,
  best_enemies_defeated integer NOT NULL DEFAULT 0,
  cleared_at timestamptz NOT NULL DEFAULT now(),
  clear_count integer NOT NULL DEFAULT 1 CHECK (clear_count >= 1),
  UNIQUE (user_id, stage_id)
);

COMMENT ON TABLE public.defense_stage_clears IS 'Defense mode stage clear records.';

CREATE OR REPLACE FUNCTION public.set_defense_stages_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_defense_stages_updated_at ON public.defense_stages;
CREATE TRIGGER trg_defense_stages_updated_at
  BEFORE UPDATE ON public.defense_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_defense_stages_updated_at();

CREATE OR REPLACE FUNCTION public.set_defense_phrases_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_defense_phrases_updated_at ON public.defense_phrases;
CREATE TRIGGER trg_defense_phrases_updated_at
  BEFORE UPDATE ON public.defense_phrases
  FOR EACH ROW
  EXECUTE FUNCTION public.set_defense_phrases_updated_at();

ALTER TABLE public.defense_difficulty_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defense_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defense_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defense_phrase_chords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defense_phrase_chord_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defense_stage_clears ENABLE ROW LEVEL SECURITY;

CREATE POLICY defense_difficulty_levels_select_all ON public.defense_difficulty_levels
  FOR SELECT USING (true);

CREATE POLICY defense_stages_select_all ON public.defense_stages
  FOR SELECT USING (true);

CREATE POLICY defense_phrases_select_all ON public.defense_phrases
  FOR SELECT USING (true);

CREATE POLICY defense_phrase_chords_select_all ON public.defense_phrase_chords
  FOR SELECT USING (true);

CREATE POLICY defense_phrase_chord_notes_select_all ON public.defense_phrase_chord_notes
  FOR SELECT USING (true);

CREATE POLICY defense_stage_clears_select_own ON public.defense_stage_clears
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY defense_stage_clears_insert_own ON public.defense_stage_clears
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY defense_stage_clears_update_own ON public.defense_stage_clears
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY defense_difficulty_levels_admin ON public.defense_difficulty_levels
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

CREATE POLICY defense_stages_admin ON public.defense_stages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

CREATE POLICY defense_phrases_admin ON public.defense_phrases
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

CREATE POLICY defense_phrase_chords_admin ON public.defense_phrase_chords
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

CREATE POLICY defense_phrase_chord_notes_admin ON public.defense_phrase_chord_notes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

GRANT SELECT ON public.defense_difficulty_levels TO anon, authenticated;
GRANT SELECT ON public.defense_stages TO anon, authenticated;
GRANT SELECT ON public.defense_phrases TO anon, authenticated;
GRANT SELECT ON public.defense_phrase_chords TO anon, authenticated;
GRANT SELECT ON public.defense_phrase_chord_notes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.defense_stage_clears TO authenticated;

-- Difficulty levels 1-10 (linear interpolation)
INSERT INTO public.defense_difficulty_levels (
  level, enemy_hp, spawn_interval_sec, max_enemies,
  enemy_speed_px_per_sec, enemy_damage, attack_interval_sec, attack_range_px
) VALUES
  (1, 1, 4.0, 3, 40, 1, 3.0, 48),
  (2, 1, 3.6, 4, 46, 1, 2.8, 48),
  (3, 2, 3.2, 4, 52, 1, 2.6, 50),
  (4, 2, 2.8, 5, 58, 2, 2.4, 50),
  (5, 3, 2.4, 6, 64, 2, 2.2, 52),
  (6, 3, 2.0, 7, 70, 2, 2.0, 52),
  (7, 4, 1.8, 8, 76, 2, 1.8, 54),
  (8, 5, 1.5, 9, 82, 3, 1.5, 54),
  (9, 5, 1.3, 9, 86, 3, 1.3, 56),
  (10, 6, 1.2, 10, 90, 3, 1.2, 56)
ON CONFLICT (level) DO UPDATE SET
  enemy_hp = EXCLUDED.enemy_hp,
  spawn_interval_sec = EXCLUDED.spawn_interval_sec,
  max_enemies = EXCLUDED.max_enemies,
  enemy_speed_px_per_sec = EXCLUDED.enemy_speed_px_per_sec,
  enemy_damage = EXCLUDED.enemy_damage,
  attack_interval_sec = EXCLUDED.attack_interval_sec,
  attack_range_px = EXCLUDED.attack_range_px;

COMMIT;
