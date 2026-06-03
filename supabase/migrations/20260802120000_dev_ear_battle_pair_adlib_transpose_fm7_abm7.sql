-- 開発者コース ペアアドリブ: 表示コードは Dm7→G7→CM7(休)→CM7 のまま、
-- 内部のペア群（pcs = 絶対ピッチクラス, C=0）を移調して差し替える。
--   step0 Dm7 : CM7 ペア群を +5（C→F）した FM7 ペア群でマッチング
--   step1 G7  : CM7 ペア群を +8（C→Ab）した AbM7 ペア群でマッチング
--   step2 CM7 : 休み（input_disabled）。CM7 群のまま
--   step3 CM7 : CM7 群のまま
-- pcs は単なる整数のピッチクラスなので、移調は (pc + n) % 12 の剰余演算で済み Tonal は不要。

BEGIN;

DO $$
DECLARE
  v_ns uuid := 'a0000000-0000-4000-8000-000000000001'::uuid;

  v_pair_stage uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-pair-adlib-stage');
  v_fm7_group uuid := uuid_generate_v5(v_ns, 'dev-phrase-pair-fm7-group');
  v_abm7_group uuid := uuid_generate_v5(v_ns, 'dev-phrase-pair-abm7-group');

  v_pair_cfg uuid;
BEGIN
  -- FM7 ペア群（CM7 を +5 移調 / 表示は Dm7 のまま）。key_fifths=-1（F）。
  INSERT INTO public.ear_training_adlib_pattern_groups (id, name, label, key_fifths)
  VALUES (v_fm7_group, 'FM7', 'FM7 phrase pairs (CM7 +5)', -1)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, label = EXCLUDED.label, updated_at = now();

  -- AbM7 ペア群（CM7 を +8 移調 / 表示は G7 のまま）。key_fifths=-4（Ab）。
  INSERT INTO public.ear_training_adlib_pattern_groups (id, name, label, key_fifths)
  VALUES (v_abm7_group, 'AbM7', 'AbM7 phrase pairs (CM7 +8)', -4)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, label = EXCLUDED.label, updated_at = now();

  DELETE FROM public.ear_training_adlib_patterns WHERE group_id = v_fm7_group;
  DELETE FROM public.ear_training_adlib_patterns WHERE group_id = v_abm7_group;

  -- FM7 = CM7 pcs + 5 (mod 12)
  INSERT INTO public.ear_training_adlib_patterns (
    group_id, label, pcs, family_id, carry_tail_length, priority, sort_order
  ) VALUES
    (v_fm7_group, 'A',     ARRAY[5, 7]::smallint[],          'FM7-A',   0, 0, 0),
    (v_fm7_group, 'A',     ARRAY[7, 5]::smallint[],          'FM7-A',   0, 0, 1),
    (v_fm7_group, 'B',     ARRAY[9, 0]::smallint[],          'FM7-B',   0, 0, 2),
    (v_fm7_group, 'B',     ARRAY[0, 9]::smallint[],          'FM7-B',   0, 0, 3),
    (v_fm7_group, 'C',     ARRAY[2, 4]::smallint[],          'FM7-C',   0, 0, 4),
    (v_fm7_group, 'C',     ARRAY[4, 2]::smallint[],          'FM7-C',   0, 0, 5),
    (v_fm7_group, 'D',     ARRAY[4, 5]::smallint[],          'FM7-D',   1, 0, 6),
    (v_fm7_group, 'A''',   ARRAY[7, 4, 5]::smallint[],       'FM7-Ap',  1, 0, 7),
    (v_fm7_group, 'A''',   ARRAY[4, 7, 5]::smallint[],       'FM7-Ap',  1, 0, 8),
    (v_fm7_group, 'A''''', ARRAY[4, 7, 6, 4, 5]::smallint[], 'FM7-App', 1, 0, 9);

  -- AbM7 = CM7 pcs + 8 (mod 12)
  INSERT INTO public.ear_training_adlib_patterns (
    group_id, label, pcs, family_id, carry_tail_length, priority, sort_order
  ) VALUES
    (v_abm7_group, 'A',     ARRAY[8, 10]::smallint[],          'AbM7-A',   0, 0, 0),
    (v_abm7_group, 'A',     ARRAY[10, 8]::smallint[],          'AbM7-A',   0, 0, 1),
    (v_abm7_group, 'B',     ARRAY[0, 3]::smallint[],           'AbM7-B',   0, 0, 2),
    (v_abm7_group, 'B',     ARRAY[3, 0]::smallint[],           'AbM7-B',   0, 0, 3),
    (v_abm7_group, 'C',     ARRAY[5, 7]::smallint[],           'AbM7-C',   0, 0, 4),
    (v_abm7_group, 'C',     ARRAY[7, 5]::smallint[],           'AbM7-C',   0, 0, 5),
    (v_abm7_group, 'D',     ARRAY[7, 8]::smallint[],           'AbM7-D',   1, 0, 6),
    (v_abm7_group, 'A''',   ARRAY[10, 7, 8]::smallint[],       'AbM7-Ap',  1, 0, 7),
    (v_abm7_group, 'A''',   ARRAY[7, 10, 8]::smallint[],       'AbM7-Ap',  1, 0, 8),
    (v_abm7_group, 'A''''', ARRAY[7, 10, 9, 7, 8]::smallint[], 'AbM7-App', 1, 0, 9);

  -- ステップのペア群を差し替え（表示コード chord_name はそのまま）
  SELECT id INTO v_pair_cfg
  FROM public.ear_training_phrase_pair_adlib_config
  WHERE stage_id = v_pair_stage
  LIMIT 1;

  IF v_pair_cfg IS NOT NULL THEN
    UPDATE public.ear_training_phrase_pair_adlib_steps
    SET pattern_group_id = v_fm7_group
    WHERE config_id = v_pair_cfg AND order_index = 0;

    UPDATE public.ear_training_phrase_pair_adlib_steps
    SET pattern_group_id = v_abm7_group
    WHERE config_id = v_pair_cfg AND order_index = 1;
  END IF;
END $$;

COMMIT;
