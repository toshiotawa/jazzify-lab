-- 開発用アドリブ / ペアアドリブ: 進行を Dm7 → G7 → CM7(休) → CM7、1小節ずつのハーモニックリズムに修正。

BEGIN;

DO $$
DECLARE
  v_ns uuid := 'a0000000-0000-4000-8000-000000000001'::uuid;
  v_adlib_phrase uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-adlib-phrase');
  v_pair_stage uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-pair-adlib-stage');
  v_pair_group uuid := uuid_generate_v5(v_ns, 'dev-phrase-pair-cm7-group');
  v_pair_cfg uuid;
BEGIN
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
      uuid_generate_v5(v_ns, 'dev-ear-battle-adlib-c0'),
      v_adlib_phrase,
      0,
      'Dm7',
      1,
      1,
      4,
      0,
      1,
      ARRAY['D3', 'F3', 'A3', 'C4']::text[],
      ARRAY[2, 2, 2, 1]::smallint[],
      false
    ),
    (
      uuid_generate_v5(v_ns, 'dev-ear-battle-adlib-c1'),
      v_adlib_phrase,
      1,
      'G7',
      2,
      1,
      4,
      1,
      2,
      ARRAY['G3', 'B3', 'D4', 'F4']::text[],
      ARRAY[2, 2, 1, 1]::smallint[],
      false
    ),
    (
      uuid_generate_v5(v_ns, 'dev-ear-battle-adlib-c2'),
      v_adlib_phrase,
      2,
      'CM7',
      3,
      1,
      4,
      2,
      3,
      ARRAY[]::text[],
      ARRAY[]::smallint[],
      true
    ),
    (
      uuid_generate_v5(v_ns, 'dev-ear-battle-adlib-c3'),
      v_adlib_phrase,
      3,
      'CM7',
      4,
      1,
      4,
      3,
      4,
      ARRAY['C4', 'E4', 'G4', 'B4']::text[],
      ARRAY[1, 1, 1, 1]::smallint[],
      false
    );

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
      input_disabled
    ) VALUES
      (v_pair_cfg, 0, 'Dm7', v_pair_group, 1, 0, 1, false),
      (v_pair_cfg, 1, 'G7', v_pair_group, 2, 1, 2, false),
      (v_pair_cfg, 2, 'CM7', v_pair_group, 3, 2, 3, true),
      (v_pair_cfg, 3, 'CM7', v_pair_group, 4, 3, 4, false);
  END IF;
END $$;

COMMIT;
