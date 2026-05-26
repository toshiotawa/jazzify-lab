-- Ear Training chord_voicing: composite phrase boss (sources by phrase_id + DB BGM)

ALTER TABLE public.ear_training_stages
  ADD COLUMN IF NOT EXISTS chord_voicing_composite_phrase boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.ear_training_stages.chord_voicing_composite_phrase IS
  'chord_voicing で複数フレーズを並列出題しロック後に逐次入力するモード';

CREATE TABLE IF NOT EXISTS public.ear_training_composite_phrase_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL UNIQUE REFERENCES public.ear_training_stages(id) ON DELETE CASCADE,
  bgm_url text NOT NULL,
  key_fifths smallint NOT NULL DEFAULT 0 CHECK (key_fifths >= -7 AND key_fifths <= 7),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ear_training_composite_phrase_config IS 'EarTraining composite phrase: loop BGM URL and key signature';

CREATE TABLE IF NOT EXISTS public.ear_training_composite_phrase_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid NOT NULL REFERENCES public.ear_training_composite_phrase_config(id) ON DELETE CASCADE,
  source_phrase_id uuid NOT NULL REFERENCES public.ear_training_phrases(id) ON DELETE CASCADE,
  sort_order smallint NOT NULL CHECK (sort_order >= 0),
  UNIQUE (config_id, source_phrase_id)
);

COMMENT ON TABLE public.ear_training_composite_phrase_sources IS 'Ordered candidate phrases referenced by composite ear training stages';

CREATE OR REPLACE FUNCTION public.set_ear_training_composite_phrase_config_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ear_training_composite_phrase_config_updated_at
  ON public.ear_training_composite_phrase_config;
CREATE TRIGGER trg_ear_training_composite_phrase_config_updated_at
  BEFORE UPDATE ON public.ear_training_composite_phrase_config
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ear_training_composite_phrase_config_updated_at();

ALTER TABLE public.ear_training_composite_phrase_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ear_training_composite_phrase_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ear_training_composite_phrase_config_select_all ON public.ear_training_composite_phrase_config;
CREATE POLICY ear_training_composite_phrase_config_select_all
  ON public.ear_training_composite_phrase_config FOR SELECT USING (true);

DROP POLICY IF EXISTS ear_training_composite_phrase_sources_select_all ON public.ear_training_composite_phrase_sources;
CREATE POLICY ear_training_composite_phrase_sources_select_all
  ON public.ear_training_composite_phrase_sources FOR SELECT USING (true);

DROP POLICY IF EXISTS ear_training_composite_phrase_config_insert_admin ON public.ear_training_composite_phrase_config;
CREATE POLICY ear_training_composite_phrase_config_insert_admin
  ON public.ear_training_composite_phrase_config FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS ear_training_composite_phrase_config_update_admin ON public.ear_training_composite_phrase_config;
CREATE POLICY ear_training_composite_phrase_config_update_admin
  ON public.ear_training_composite_phrase_config FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS ear_training_composite_phrase_config_delete_admin ON public.ear_training_composite_phrase_config;
CREATE POLICY ear_training_composite_phrase_config_delete_admin
  ON public.ear_training_composite_phrase_config FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS ear_training_composite_phrase_sources_insert_admin ON public.ear_training_composite_phrase_sources;
CREATE POLICY ear_training_composite_phrase_sources_insert_admin
  ON public.ear_training_composite_phrase_sources FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS ear_training_composite_phrase_sources_update_admin ON public.ear_training_composite_phrase_sources;
CREATE POLICY ear_training_composite_phrase_sources_update_admin
  ON public.ear_training_composite_phrase_sources FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS ear_training_composite_phrase_sources_delete_admin ON public.ear_training_composite_phrase_sources;
CREATE POLICY ear_training_composite_phrase_sources_delete_admin
  ON public.ear_training_composite_phrase_sources FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

GRANT SELECT ON public.ear_training_composite_phrase_config TO anon, authenticated;
GRANT SELECT ON public.ear_training_composite_phrase_sources TO anon, authenticated;

-- Demo composite stage + phrases (deterministic IDs)
DO $$
DECLARE
  v_stage uuid := uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-composite-stage');
  v_phrase_a uuid := uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-composite-phrase-a');
  v_phrase_b uuid := uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-composite-phrase-b');
  v_cfg uuid;
BEGIN
  INSERT INTO public.ear_training_stages (
    id,
    slug,
    title,
    title_en,
    description,
    description_en,
    bpm,
    beats_per_measure,
    beat_type,
    loop_measures,
    max_loops_per_phrase,
    count_in_beats,
    time_limit_sec,
    player_hp,
    enemy_hp,
    per_correct_note_damage,
    good_completion_damage,
    great_completion_damage,
    perfect_completion_damage,
    miss_damage,
    fail_damage,
    perfect_max_misses,
    great_max_misses,
    background_theme,
    is_active,
    is_demo,
    mode,
    chord_voicing_self_paced,
    chord_voicing_composite_phrase
  ) VALUES (
    v_stage,
    'dev-chord-voicing-composite-test',
    'コード複合フレーズ（開発テスト）',
    'Composite chord phrases (dev test)',
    '2 ソースフレーズの並列出題・セルフペース・ドラムのみ BGM。',
    'Parallel phrases, selfpaced, drum BGM.',
    100,
    4,
    4,
    4,
    16,
    0,
    999,
    100,
    8000,
    2,
    12,
    18,
    24,
    8,
    12,
    4,
    8,
    'blue_club',
    true,
    true,
    'chord_voicing',
    true,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    chord_voicing_self_paced = EXCLUDED.chord_voicing_self_paced,
    chord_voicing_composite_phrase = EXCLUDED.chord_voicing_composite_phrase,
    is_demo = EXCLUDED.is_demo,
    updated_at = now();

  INSERT INTO public.ear_training_phrases (
    id,
    stage_id,
    order_index,
    title,
    title_en,
    music_xml_url,
    audio_url,
    loop_duration_sec,
    audio_duration_sec,
    note_count,
    key_fifths
  ) VALUES
    (
      v_phrase_a,
      v_stage,
      0,
      'ソースA（Am7・1音ずつ）',
      'Source A',
      NULL,
      '',
      1,
      1,
      0,
      0
    ),
    (
      v_phrase_b,
      v_stage,
      1,
      'ソースB（Dm7・1音ずつ）',
      'Source B',
      NULL,
      '',
      1,
      1,
      0,
      0
    )
  ON CONFLICT (id) DO UPDATE SET
    stage_id = EXCLUDED.stage_id,
    order_index = EXCLUDED.order_index,
    audio_url = EXCLUDED.audio_url,
    key_fifths = EXCLUDED.key_fifths,
    updated_at = now();

  DELETE FROM public.ear_training_phrase_chords WHERE phrase_id IN (v_phrase_a, v_phrase_b);

  INSERT INTO public.ear_training_phrase_chords (
    id,
    phrase_id,
    order_index,
    chord_name,
    measure_number,
    beat_offset,
    duration_beats,
    start_time_sec,
    end_time_sec,
    voicing,
    voicing_staves
  ) VALUES
    (
      uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-comp-a-ch0'),
      v_phrase_a,
      0,
      'Am7',
      1,
      1,
      4,
      0,
      4,
      ARRAY['C4', 'E4', 'G4', 'B4']::text[],
      ARRAY[1, 1, 1, 1]::smallint[]
    ),
    (
      uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-comp-b-ch0'),
      v_phrase_b,
      0,
      'Dm7',
      1,
      1,
      4,
      0,
      4,
      ARRAY['C4', 'F4', 'A4']::text[],
      ARRAY[1, 1, 1]::smallint[]
    );

  DELETE FROM public.ear_training_composite_phrase_sources WHERE config_id IN (
    SELECT id FROM public.ear_training_composite_phrase_config WHERE stage_id = v_stage
  );
  DELETE FROM public.ear_training_composite_phrase_config WHERE stage_id = v_stage;

  INSERT INTO public.ear_training_composite_phrase_config (stage_id, bgm_url, key_fifths)
  VALUES (
    v_stage,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    0
  )
  RETURNING id INTO v_cfg;

  INSERT INTO public.ear_training_composite_phrase_sources (config_id, source_phrase_id, sort_order) VALUES
    (v_cfg, v_phrase_a, 0),
    (v_cfg, v_phrase_b, 1);
END $$;
