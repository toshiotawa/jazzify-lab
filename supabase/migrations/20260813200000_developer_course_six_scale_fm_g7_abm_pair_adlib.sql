-- 開発者テストコース「6音スケール（Fm・G7alt・Abm）」: 1レッスン × 8課題・ペアアドリブ
-- BPM 160 / drums160 ループ / 単コード 4小節ループ

BEGIN;

DO $$
DECLARE
  v_ns uuid := 'a0000000-0000-4000-8000-000000000001'::uuid;
  v_course uuid := uuid_generate_v5(v_ns, 'course-developer-test');
  v_drums160 text := 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3';
  v_block_number integer := 61;
  v_base_order integer;
  v_assignment integer;
  v_group uuid;
  v_stage uuid;
  v_phrase uuid;
  v_cfg uuid;
  v_lesson_id uuid := uuid_generate_v5(v_ns, 'dev-six-scale-fm-g7-abm-lesson');
  v_lsong_id uuid;
  v_key_fifths smallint := 0;
  v_chord_name text;
  v_group_slug text;
  v_stage_slug text;
  v_lsong_slug text;
  v_title_ja text;
  v_title_en text;
  v_desc_ja text;
  v_desc_en text;
  v_include_approach boolean;
BEGIN
  SELECT COALESCE(MAX(order_index), 0) INTO v_base_order
  FROM public.lessons
  WHERE course_id = v_course;

  INSERT INTO public.lessons (
    id, course_id, title, title_en, description, description_en,
    premium_only, order_index, block_number, block_name, block_name_en,
    nav_links, assignment_description, assignment_description_en
  ) VALUES (
    v_lesson_id,
    v_course,
    '6音スケール（Fm・G7alt・Abm）',
    'Six-note scale (Fm / G7alt / Abm)',
    'Fm7 / G7alt / Abm7 上の6音スケール・ペアアドリブ。A/B/C と A''/B'' を段階追加。',
    'Six-note scale phrase-pair adlib on Fm7, G7alt, and Abm7. A/B/C then A''/B'' pairs.',
    false,
    v_base_order + 1,
    v_block_number,
    '6音スケール（Fm・G7alt・Abm）',
    'Six-note scale (Fm / G7alt / Abm)',
    '[]'::jsonb,
    '各課題のペアアドリブをランクB以上で1回クリアしてください。',
    'Clear each phrase-pair adlib assignment once at rank B or better.'
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    title_en = EXCLUDED.title_en,
    description = EXCLUDED.description,
    description_en = EXCLUDED.description_en,
    order_index = EXCLUDED.order_index,
    block_number = EXCLUDED.block_number,
    block_name = EXCLUDED.block_name,
    block_name_en = EXCLUDED.block_name_en,
    assignment_description = EXCLUDED.assignment_description,
    assignment_description_en = EXCLUDED.assignment_description_en;

  FOR v_assignment IN 1..8 LOOP
    v_group_slug := 'dev-six-scale-fm-g7-abm-group-a' || v_assignment::text;
    v_stage_slug := 'dev-six-scale-fm-g7-abm-adlib-a' || v_assignment::text;
    v_lsong_slug := 'dev-six-scale-fm-g7-abm-lsong-' || v_assignment::text;
    v_group := uuid_generate_v5(v_ns, v_group_slug);
    v_stage := uuid_generate_v5(v_ns, v_stage_slug);
    v_phrase := uuid_generate_v5(v_ns, v_stage_slug || '-phrase');
    v_lsong_id := uuid_generate_v5(v_ns, v_lsong_slug);

    v_include_approach := v_assignment IN (2, 4, 6, 8);

    CASE v_assignment
      WHEN 1 THEN
        v_chord_name := 'Fm7';
        v_title_ja := '課題1: Fm7 A/B/C';
        v_title_en := 'Assignment 1: Fm7 A/B/C';
        v_desc_ja := 'Fm7 上の基本ペア A・B・C のみ。';
        v_desc_en := 'Basic A, B, and C pairs on Fm7 only.';
      WHEN 2 THEN
        v_chord_name := 'Fm7';
        v_title_ja := '課題2: Fm7 + A''/B''';
        v_title_en := 'Assignment 2: Fm7 + A''/B''';
        v_desc_ja := 'A/B/C に A''（G-E→F）と B''（Bb-G→Ab）を追加。';
        v_desc_en := 'Adds A'' (G-E→F) and B'' (Bb-G→Ab) to A/B/C on Fm7.';
      WHEN 3 THEN
        v_chord_name := 'G7alt';
        v_title_ja := '課題3: G7alt A/B/C';
        v_title_en := 'Assignment 3: G7alt A/B/C';
        v_desc_ja := 'G7alt 上の A/B/C（C ペアは Cb-Eb）。';
        v_desc_en := 'A/B/C on G7alt (C pair is Cb-Eb).';
      WHEN 4 THEN
        v_chord_name := 'G7alt';
        v_title_ja := '課題4: G7alt + A''/B''';
        v_title_en := 'Assignment 4: G7alt + A''/B''';
        v_desc_ja := 'G7alt 上で A''/B'' を追加。';
        v_desc_en := 'Adds A''/B'' on G7alt.';
      WHEN 5 THEN
        v_chord_name := 'Abm7';
        v_title_ja := '課題5: Abm7 A/B/C';
        v_title_en := 'Assignment 5: Abm7 A/B/C';
        v_desc_ja := 'Abm7 上の A/B/C（Ab Bb / Cb Db / Eb Gb）。';
        v_desc_en := 'A/B/C on Abm7 (Ab Bb / Cb Db / Eb Gb).';
      WHEN 6 THEN
        v_chord_name := 'Abm7';
        v_title_ja := '課題6: Abm7 + A''/B''';
        v_title_en := 'Assignment 6: Abm7 + A''/B''';
        v_desc_ja := 'Abm7 上で A''（Bb-G→Ab）と B''（Db-Bb→Cb）を追加。';
        v_desc_en := 'Adds A'' (Bb-G→Ab) and B'' (Db-Bb→Cb) on Abm7.';
      WHEN 7 THEN
        v_chord_name := 'G7alt';
        v_title_ja := '課題7: G7alt (Abm型) A/B/C';
        v_title_en := 'Assignment 7: G7alt (Abm type) A/B/C';
        v_desc_ja := 'G7alt 上の Abm 型6音（C ペアは Eb-G）。';
        v_desc_en := 'Abm-type six notes on G7alt (C pair is Eb-G).';
      ELSE
        v_chord_name := 'G7alt';
        v_title_ja := '課題8: G7alt (Abm型) + A''/B''';
        v_title_en := 'Assignment 8: G7alt (Abm type) + A''/B''';
        v_desc_ja := 'G7alt (Abm型) 上で A''/B'' を追加。';
        v_desc_en := 'Adds A''/B'' on G7alt (Abm type).';
    END CASE;

    INSERT INTO public.ear_training_adlib_pattern_groups (id, name, label, key_fifths)
    VALUES (
      v_group,
      'SixScale-FmG7Abm-A' || v_assignment::text,
      'Six-note scale pairs (assignment ' || v_assignment::text || ')',
      v_key_fifths
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      label = EXCLUDED.label,
      key_fifths = EXCLUDED.key_fifths,
      updated_at = now();

    DELETE FROM public.ear_training_adlib_patterns WHERE group_id = v_group;

    IF v_assignment IN (1, 2, 3, 4) THEN
      -- F / G7alt(F型): A(FG) B(Ab Bb) C(C Eb) or C(Cb Eb)
      INSERT INTO public.ear_training_adlib_patterns (
        group_id, label, pcs, family_id, carry_tail_length, priority, sort_order,
        voicing, voicing_staves
      ) VALUES
        (v_group, 'A', ARRAY[5, 7]::smallint[], 'Fm6-A', 0, 0, 0,
          ARRAY['F4', 'G4']::text[], ARRAY[1, 1]::smallint[]),
        (v_group, 'A', ARRAY[7, 5]::smallint[], 'Fm6-A', 0, 0, 1,
          ARRAY['G4', 'F4']::text[], ARRAY[1, 1]::smallint[]),
        (v_group, 'B', ARRAY[8, 10]::smallint[], 'Fm6-B', 0, 0, 2,
          ARRAY['Ab4', 'Bb4']::text[], ARRAY[1, 1]::smallint[]),
        (v_group, 'B', ARRAY[10, 8]::smallint[], 'Fm6-B', 0, 0, 3,
          ARRAY['Bb4', 'Ab4']::text[], ARRAY[1, 1]::smallint[]);

      IF v_assignment IN (1, 2) THEN
        INSERT INTO public.ear_training_adlib_patterns (
          group_id, label, pcs, family_id, carry_tail_length, priority, sort_order,
          voicing, voicing_staves
        ) VALUES
          (v_group, 'C', ARRAY[0, 3]::smallint[], 'Fm6-C', 0, 0, 4,
            ARRAY['C5', 'Eb5']::text[], ARRAY[1, 1]::smallint[]),
          (v_group, 'C', ARRAY[3, 0]::smallint[], 'Fm6-C', 0, 0, 5,
            ARRAY['Eb5', 'C5']::text[], ARRAY[1, 1]::smallint[]);
      ELSE
        INSERT INTO public.ear_training_adlib_patterns (
          group_id, label, pcs, family_id, carry_tail_length, priority, sort_order,
          voicing, voicing_staves
        ) VALUES
          (v_group, 'C', ARRAY[11, 3]::smallint[], 'G7alt-C', 0, 0, 4,
            ARRAY['Cb5', 'Eb5']::text[], ARRAY[1, 1]::smallint[]),
          (v_group, 'C', ARRAY[3, 11]::smallint[], 'G7alt-C', 0, 0, 5,
            ARRAY['Eb5', 'Cb5']::text[], ARRAY[1, 1]::smallint[]);
      END IF;

      IF v_include_approach THEN
        INSERT INTO public.ear_training_adlib_patterns (
          group_id, label, pcs, family_id, carry_tail_length, priority, sort_order,
          voicing, voicing_staves
        ) VALUES
          (v_group, 'A''', ARRAY[7, 4, 5]::smallint[], 'Fm6-Ap', 1, 0, 6,
            ARRAY['G4', 'E4', 'F4']::text[], ARRAY[1, 1, 1]::smallint[]),
          (v_group, 'A''', ARRAY[4, 7, 5]::smallint[], 'Fm6-Ap', 1, 0, 7,
            ARRAY['E4', 'G4', 'F4']::text[], ARRAY[1, 1, 1]::smallint[]),
          (v_group, 'B''', ARRAY[10, 7, 8]::smallint[], 'Fm6-Bp', 1, 0, 8,
            ARRAY['Bb4', 'G4', 'Ab4']::text[], ARRAY[1, 1, 1]::smallint[]),
          (v_group, 'B''', ARRAY[7, 10, 8]::smallint[], 'Fm6-Bp', 1, 0, 9,
            ARRAY['G4', 'Bb4', 'Ab4']::text[], ARRAY[1, 1, 1]::smallint[]);
      END IF;
    ELSE
      -- Abm7 / G7alt(Abm型): A(Ab Bb) B(Cb Db) C(Eb Gb) or C(Eb G)
      INSERT INTO public.ear_training_adlib_patterns (
        group_id, label, pcs, family_id, carry_tail_length, priority, sort_order,
        voicing, voicing_staves
      ) VALUES
        (v_group, 'A', ARRAY[8, 10]::smallint[], 'Abm6-A', 0, 0, 0,
          ARRAY['Ab4', 'Bb4']::text[], ARRAY[1, 1]::smallint[]),
        (v_group, 'A', ARRAY[10, 8]::smallint[], 'Abm6-A', 0, 0, 1,
          ARRAY['Bb4', 'Ab4']::text[], ARRAY[1, 1]::smallint[]),
        (v_group, 'B', ARRAY[11, 1]::smallint[], 'Abm6-B', 0, 0, 2,
          ARRAY['Cb5', 'Db5']::text[], ARRAY[1, 1]::smallint[]),
        (v_group, 'B', ARRAY[1, 11]::smallint[], 'Abm6-B', 0, 0, 3,
          ARRAY['Db5', 'Cb5']::text[], ARRAY[1, 1]::smallint[]);

      IF v_assignment IN (5, 6) THEN
        INSERT INTO public.ear_training_adlib_patterns (
          group_id, label, pcs, family_id, carry_tail_length, priority, sort_order,
          voicing, voicing_staves
        ) VALUES
          (v_group, 'C', ARRAY[3, 6]::smallint[], 'Abm6-C', 0, 0, 4,
            ARRAY['Eb5', 'Gb5']::text[], ARRAY[1, 1]::smallint[]),
          (v_group, 'C', ARRAY[6, 3]::smallint[], 'Abm6-C', 0, 0, 5,
            ARRAY['Gb5', 'Eb5']::text[], ARRAY[1, 1]::smallint[]);
      ELSE
        INSERT INTO public.ear_training_adlib_patterns (
          group_id, label, pcs, family_id, carry_tail_length, priority, sort_order,
          voicing, voicing_staves
        ) VALUES
          (v_group, 'C', ARRAY[3, 7]::smallint[], 'G7alt-Abm6-C', 0, 0, 4,
            ARRAY['Eb5', 'G5']::text[], ARRAY[1, 1]::smallint[]),
          (v_group, 'C', ARRAY[7, 3]::smallint[], 'G7alt-Abm6-C', 0, 0, 5,
            ARRAY['G5', 'Eb5']::text[], ARRAY[1, 1]::smallint[]);
      END IF;

      IF v_include_approach THEN
        INSERT INTO public.ear_training_adlib_patterns (
          group_id, label, pcs, family_id, carry_tail_length, priority, sort_order,
          voicing, voicing_staves
        ) VALUES
          (v_group, 'A''', ARRAY[10, 7, 8]::smallint[], 'Abm6-Ap', 1, 0, 6,
            ARRAY['Bb4', 'G4', 'Ab4']::text[], ARRAY[1, 1, 1]::smallint[]),
          (v_group, 'A''', ARRAY[7, 10, 8]::smallint[], 'Abm6-Ap', 1, 0, 7,
            ARRAY['G4', 'Bb4', 'Ab4']::text[], ARRAY[1, 1, 1]::smallint[]),
          (v_group, 'B''', ARRAY[1, 10, 11]::smallint[], 'Abm6-Bp', 1, 0, 8,
            ARRAY['Db4', 'Bb4', 'Cb5']::text[], ARRAY[1, 1, 1]::smallint[]),
          (v_group, 'B''', ARRAY[10, 1, 11]::smallint[], 'Abm6-Bp', 1, 0, 9,
            ARRAY['Bb4', 'Db4', 'Cb5']::text[], ARRAY[1, 1, 1]::smallint[]);
      END IF;
    END IF;

    INSERT INTO public.ear_training_stages (
      id, slug, title, title_en, description, description_en,
      bpm, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
      count_in_beats, time_limit_sec, player_hp, enemy_hp,
      per_correct_note_damage, good_completion_damage, great_completion_damage,
      perfect_completion_damage, miss_damage, fail_damage,
      perfect_max_misses, great_max_misses, background_theme,
      is_active, is_demo, mode, show_keyboard_hints_in_battle
    ) VALUES (
      v_stage,
      v_stage_slug,
      v_title_ja,
      v_title_en,
      v_desc_ja || ' 単コード・160 BPM ドラムループ。',
      v_desc_en || ' Single-chord, 160 BPM drum loop.',
      160, 4, 4, 4, 16, 0,
      120, 500, 200,
      50, 12, 18, 24, 5, 10,
      4, 8, 'blue_club',
      true, true, 'phrase_pair_adlib', true
    )
    ON CONFLICT (id) DO UPDATE SET
      slug = EXCLUDED.slug,
      title = EXCLUDED.title,
      title_en = EXCLUDED.title_en,
      description = EXCLUDED.description,
      description_en = EXCLUDED.description_en,
      bpm = EXCLUDED.bpm,
      time_limit_sec = EXCLUDED.time_limit_sec,
      player_hp = EXCLUDED.player_hp,
      enemy_hp = EXCLUDED.enemy_hp,
      per_correct_note_damage = EXCLUDED.per_correct_note_damage,
      miss_damage = EXCLUDED.miss_damage,
      fail_damage = EXCLUDED.fail_damage,
      mode = EXCLUDED.mode,
      show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
      updated_at = now();

    INSERT INTO public.ear_training_phrases (
      id, stage_id, order_index, title, title_en,
      music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
    ) VALUES (
      v_phrase, v_stage, 0,
      'ドラムループ', 'Drum loop',
      NULL, v_drums160, 6, 6, 0, v_key_fifths
    )
    ON CONFLICT (id) DO UPDATE SET
      audio_url = EXCLUDED.audio_url,
      loop_duration_sec = EXCLUDED.loop_duration_sec,
      key_fifths = EXCLUDED.key_fifths,
      updated_at = now();

    DELETE FROM public.ear_training_phrase_pair_adlib_steps
    WHERE config_id IN (
      SELECT id FROM public.ear_training_phrase_pair_adlib_config WHERE stage_id = v_stage
    );
    DELETE FROM public.ear_training_phrase_pair_adlib_config WHERE stage_id = v_stage;

    INSERT INTO public.ear_training_phrase_pair_adlib_config (
      stage_id, bgm_url, key_fifths, loop_duration_sec
    ) VALUES (
      v_stage, v_drums160, v_key_fifths, 6
    )
    RETURNING id INTO v_cfg;

    INSERT INTO public.ear_training_phrase_pair_adlib_steps (
      config_id, order_index, chord_name, pattern_group_id,
      measure_number, start_time_sec, end_time_sec, input_disabled
    ) VALUES
      (v_cfg, 0, v_chord_name, v_group, 1, 0, 1.5, false),
      (v_cfg, 1, v_chord_name, v_group, 2, 1.5, 3, false),
      (v_cfg, 2, v_chord_name, v_group, 3, 3, 4.5, false),
      (v_cfg, 3, v_chord_name, v_group, 4, 4.5, 6, false);

    INSERT INTO public.lesson_songs (
      id, lesson_id, song_id, order_index, clear_conditions,
      is_fantasy, is_survival, is_ear_training, is_ear_training_tutorial,
      ear_training_tutorial_script_id, ear_training_stage_id,
      title, title_en, is_clear_required
    ) VALUES (
      v_lsong_id,
      v_lesson_id,
      NULL,
      v_assignment - 1,
      '{"count": 1, "rank": "B"}'::jsonb,
      false,
      false,
      true,
      false,
      NULL,
      v_stage,
      v_title_ja,
      v_title_en,
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      lesson_id = EXCLUDED.lesson_id,
      order_index = EXCLUDED.order_index,
      is_ear_training = EXCLUDED.is_ear_training,
      ear_training_stage_id = EXCLUDED.ear_training_stage_id,
      title = EXCLUDED.title,
      title_en = EXCLUDED.title_en,
      clear_conditions = EXCLUDED.clear_conditions,
      is_clear_required = EXCLUDED.is_clear_required;
  END LOOP;
END $$;

COMMIT;
