-- 開発者コース耳コピ3課題（アドリブ / ペアアドリブ / 複合フレーズ）の修正:
-- - BPM160 + drums160 ループ（loop_duration_sec=6, 各コード1.5秒=1小節）
-- - 進行 Dm7 → G7 → CM7(休) → CM7
-- - セリフ（quote）投入
-- - ペアアドリブ: CM7 完全10パターン
-- - 複合フレーズ: サバイバル phrases 1〜5（Dm7・6音×5ソース）

BEGIN;

DO $$
DECLARE
  v_ns uuid := 'a0000000-0000-4000-8000-000000000001'::uuid;
  v_drums160 text := 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3';

  -- アドリブ
  v_adlib_stage uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-adlib-stage');
  v_adlib_phrase uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-adlib-phrase');
  v_adlib_c0 uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-adlib-c0');
  v_adlib_c1 uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-adlib-c1');
  v_adlib_c2 uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-adlib-c2');
  v_adlib_c3 uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-adlib-c3');

  -- ペアアドリブ
  v_pair_stage uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-pair-adlib-stage');
  v_pair_phrase uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-pair-adlib-phrase');
  v_pair_group uuid := uuid_generate_v5(v_ns, 'dev-phrase-pair-cm7-group');
  v_pair_cfg uuid;

  -- 複合フレーズ
  v_composite_stage uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-composite-lite-stage');
  v_composite_old_a uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-composite-lite-ph-a');
  v_composite_old_b uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-composite-lite-ph-b');
  v_composite_ph1 uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-composite-lite-ph-1');
  v_composite_ph2 uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-composite-lite-ph-2');
  v_composite_ph3 uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-composite-lite-ph-3');
  v_composite_ph4 uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-composite-lite-ph-4');
  v_composite_ph5 uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-composite-lite-ph-5');
  v_composite_cfg uuid;
BEGIN
  -- =========================================================================
  -- 1) アドリブ
  -- =========================================================================
  UPDATE public.ear_training_stages
  SET bpm = 160, updated_at = now()
  WHERE id = v_adlib_stage;

  UPDATE public.ear_training_phrases
  SET
    audio_url = v_drums160,
    loop_duration_sec = 6,
    audio_duration_sec = 12,
    updated_at = now()
  WHERE id = v_adlib_phrase;

  DELETE FROM public.ear_training_phrase_chord_quotes
  WHERE phrase_chord_id IN (
    SELECT id FROM public.ear_training_phrase_chords WHERE phrase_id = v_adlib_phrase
  );

  DELETE FROM public.ear_training_phrase_chords
  WHERE phrase_id = v_adlib_phrase;

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
    voicing_staves,
    input_disabled
  ) VALUES
    (
      v_adlib_c0,
      v_adlib_phrase,
      0,
      'Dm7',
      1,
      1,
      4,
      0,
      1.5,
      ARRAY['D3', 'F3', 'A3', 'C4']::text[],
      ARRAY[2, 2, 2, 1]::smallint[],
      false
    ),
    (
      v_adlib_c1,
      v_adlib_phrase,
      1,
      'G7',
      2,
      1,
      4,
      1.5,
      3,
      ARRAY['G3', 'B3', 'D4', 'F4']::text[],
      ARRAY[2, 2, 1, 1]::smallint[],
      false
    ),
    (
      v_adlib_c2,
      v_adlib_phrase,
      2,
      'CM7',
      3,
      1,
      4,
      3,
      4.5,
      ARRAY[]::text[],
      ARRAY[]::smallint[],
      true
    ),
    (
      v_adlib_c3,
      v_adlib_phrase,
      3,
      'CM7',
      4,
      1,
      4,
      4.5,
      6,
      ARRAY['C4', 'E4', 'G4', 'B4']::text[],
      ARRAY[1, 1, 1, 1]::smallint[],
      false
    );

  INSERT INTO public.ear_training_phrase_chord_quotes (phrase_chord_id, text) VALUES
    (v_adlib_c0, 'Dm7、コードトーンを狙え！'),
    (v_adlib_c1, 'G7だ、リードを続けろ'),
    (v_adlib_c2, 'ここは聴くだけ…'),
    (v_adlib_c3, 'CM7でフィニッシュ！')
  ON CONFLICT (phrase_chord_id) DO UPDATE SET
    text = EXCLUDED.text,
    updated_at = now();

  -- =========================================================================
  -- 2) ペアアドリブ
  -- =========================================================================
  UPDATE public.ear_training_stages
  SET bpm = 160, updated_at = now()
  WHERE id = v_pair_stage;

  UPDATE public.ear_training_phrases
  SET loop_duration_sec = 6, updated_at = now()
  WHERE id = v_pair_phrase;

  UPDATE public.ear_training_phrase_pair_adlib_config
  SET
    bgm_url = v_drums160,
    loop_duration_sec = 6,
    updated_at = now()
  WHERE stage_id = v_pair_stage;

  DELETE FROM public.ear_training_adlib_patterns
  WHERE group_id = v_pair_group;

  INSERT INTO public.ear_training_adlib_patterns (
    group_id,
    label,
    pcs,
    family_id,
    carry_tail_length,
    priority,
    sort_order
  ) VALUES
    (v_pair_group, 'A', ARRAY[0, 2]::smallint[], 'CM7-A', 0, 0, 0),
    (v_pair_group, 'A', ARRAY[2, 0]::smallint[], 'CM7-A', 0, 0, 1),
    (v_pair_group, 'B', ARRAY[4, 7]::smallint[], 'CM7-B', 0, 0, 2),
    (v_pair_group, 'B', ARRAY[7, 4]::smallint[], 'CM7-B', 0, 0, 3),
    (v_pair_group, 'C', ARRAY[9, 11]::smallint[], 'CM7-C', 0, 0, 4),
    (v_pair_group, 'C', ARRAY[11, 9]::smallint[], 'CM7-C', 0, 0, 5),
    (v_pair_group, 'D', ARRAY[11, 0]::smallint[], 'CM7-D', 1, 0, 6),
    (v_pair_group, 'A''', ARRAY[2, 11, 0]::smallint[], 'CM7-Ap', 1, 0, 7),
    (v_pair_group, 'A''', ARRAY[11, 2, 0]::smallint[], 'CM7-Ap', 1, 0, 8),
    (v_pair_group, 'A''''', ARRAY[11, 2, 1, 11, 0]::smallint[], 'CM7-App', 1, 0, 9);

  SELECT id INTO v_pair_cfg
  FROM public.ear_training_phrase_pair_adlib_config
  WHERE stage_id = v_pair_stage
  LIMIT 1;

  IF v_pair_cfg IS NOT NULL THEN
    DELETE FROM public.ear_training_phrase_pair_adlib_steps
    WHERE config_id = v_pair_cfg;

    INSERT INTO public.ear_training_phrase_pair_adlib_steps (
      config_id,
      order_index,
      chord_name,
      pattern_group_id,
      measure_number,
      start_time_sec,
      end_time_sec,
      input_disabled,
      quote
    ) VALUES
      (v_pair_cfg, 0, 'Dm7', v_pair_group, 1, 0, 1.5, false, 'Dm7、ペアを探せ！'),
      (v_pair_cfg, 1, 'G7', v_pair_group, 2, 1.5, 3, false, 'G7だ、ペアを続けろ'),
      (v_pair_cfg, 2, 'CM7', v_pair_group, 3, 3, 4.5, true, 'ここは聴くだけ…'),
      (v_pair_cfg, 3, 'CM7', v_pair_group, 4, 4.5, 6, false, 'CM7でペアを決めろ！');
  END IF;

  -- =========================================================================
  -- 3) 複合フレーズ（サバイバル phrases 1〜5）
  -- =========================================================================
  UPDATE public.ear_training_stages
  SET
    bpm = 160,
    loop_measures = 4,
    title = '耳コピ・複合フレーズ（開発・サバイバル1〜5）',
    title_en = 'Ear training composite phrase (dev, survival 1–5)',
    description = 'サバイバル Phrases 1〜5 の Dm7 フレーズ（各6音）を複合出題。',
    description_en = 'Five Dm7 survival phrase stages (six notes each).',
    updated_at = now()
  WHERE id = v_composite_stage;

  DELETE FROM public.ear_training_composite_phrase_sources
  WHERE config_id IN (
    SELECT id FROM public.ear_training_composite_phrase_config WHERE stage_id = v_composite_stage
  );

  DELETE FROM public.ear_training_composite_phrase_config
  WHERE stage_id = v_composite_stage;

  DELETE FROM public.ear_training_phrase_chords
  WHERE phrase_id IN (
    SELECT id FROM public.ear_training_phrases WHERE stage_id = v_composite_stage
  );

  DELETE FROM public.ear_training_phrases
  WHERE stage_id = v_composite_stage;

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
      v_composite_ph1,
      v_composite_stage,
      0,
      'Phrases I',
      'Phrases I',
      NULL,
      'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-01.mp3',
      6,
      6,
      6,
      0
    ),
    (
      v_composite_ph2,
      v_composite_stage,
      1,
      'Phrases II',
      'Phrases II',
      NULL,
      'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-02.mp3',
      6,
      6,
      6,
      0
    ),
    (
      v_composite_ph3,
      v_composite_stage,
      2,
      'Phrases III',
      'Phrases III',
      NULL,
      'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-03.mp3',
      6,
      6,
      6,
      0
    ),
    (
      v_composite_ph4,
      v_composite_stage,
      3,
      'Phrases IV',
      'Phrases IV',
      NULL,
      'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-04.mp3',
      6,
      6,
      6,
      0
    ),
    (
      v_composite_ph5,
      v_composite_stage,
      4,
      'Phrases V',
      'Phrases V',
      NULL,
      'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-05.mp3',
      6,
      6,
      6,
      0
    );

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
      uuid_generate_v5(v_ns, 'dev-ear-battle-composite-lite-c1'),
      v_composite_ph1,
      0,
      'Dm7',
      1,
      1,
      4,
      0,
      6,
      ARRAY['E5', 'D5', 'A4', 'F4', 'E4', 'D4']::text[],
      ARRAY[1, 1, 1, 1, 1, 1]::smallint[]
    ),
    (
      uuid_generate_v5(v_ns, 'dev-ear-battle-composite-lite-c2'),
      v_composite_ph2,
      0,
      'Dm7',
      1,
      1,
      4,
      0,
      6,
      ARRAY['E4', 'F4', 'A4', 'C5', 'E5', 'D5']::text[],
      ARRAY[1, 1, 1, 1, 1, 1]::smallint[]
    ),
    (
      uuid_generate_v5(v_ns, 'dev-ear-battle-composite-lite-c3'),
      v_composite_ph3,
      0,
      'Dm7',
      1,
      1,
      4,
      0,
      6,
      ARRAY['D5', 'E5', 'F5', 'G5', 'E5', 'D5']::text[],
      ARRAY[1, 1, 1, 1, 1, 1]::smallint[]
    ),
    (
      uuid_generate_v5(v_ns, 'dev-ear-battle-composite-lite-c4'),
      v_composite_ph4,
      0,
      'Dm7',
      1,
      1,
      4,
      0,
      6,
      ARRAY['E4', 'C#4', 'D4', 'E4', 'F4', 'G4']::text[],
      ARRAY[1, 1, 1, 1, 1, 1]::smallint[]
    ),
    (
      uuid_generate_v5(v_ns, 'dev-ear-battle-composite-lite-c5'),
      v_composite_ph5,
      0,
      'Dm7',
      1,
      1,
      4,
      0,
      6,
      ARRAY['A4', 'F4', 'E4', 'D4', 'G4', 'F4']::text[],
      ARRAY[1, 1, 1, 1, 1, 1]::smallint[]
    );

  INSERT INTO public.ear_training_composite_phrase_config (stage_id, bgm_url, key_fifths)
  VALUES (v_composite_stage, v_drums160, 0)
  RETURNING id INTO v_composite_cfg;

  INSERT INTO public.ear_training_composite_phrase_sources (config_id, source_phrase_id, sort_order) VALUES
    (v_composite_cfg, v_composite_ph1, 0),
    (v_composite_cfg, v_composite_ph2, 1),
    (v_composite_cfg, v_composite_ph3, 2),
    (v_composite_cfg, v_composite_ph4, 3),
    (v_composite_cfg, v_composite_ph5, 4);
END $$;

COMMIT;
