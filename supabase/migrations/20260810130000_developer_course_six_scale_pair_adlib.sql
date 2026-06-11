-- 開発者テストコース「6音スケール」: Dm7 単コード・ペアアドリブ 7 レッスン（ペア段階追加）
-- BPM 160 / drums160 ループ / 約2分クリア想定バランス

BEGIN;

DO $$
DECLARE
  v_ns uuid := 'a0000000-0000-4000-8000-000000000001'::uuid;
  v_course uuid := uuid_generate_v5(v_ns, 'course-developer-test');
  v_drums160 text := 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3';
  v_key_fifths smallint := 0;
  v_block_number integer := 60;
  v_base_order integer;
  v_lesson integer;
  v_group uuid;
  v_stage uuid;
  v_phrase uuid;
  v_cfg uuid;
  v_lesson_id uuid;
  v_lsong_id uuid;
  v_stage_slug text;
  v_group_slug text;
  v_lesson_slug text;
  v_lsong_slug text;
  v_title_ja text;
  v_title_en text;
  v_desc_ja text;
  v_desc_en text;
BEGIN
  SELECT COALESCE(MAX(order_index), 0) INTO v_base_order
  FROM public.lessons
  WHERE course_id = v_course;

  FOR v_lesson IN 1..7 LOOP
    v_group_slug := 'dev-six-scale-pair-group-l' || v_lesson::text;
    v_stage_slug := 'dev-six-scale-pair-adlib-l' || v_lesson::text;
    v_lesson_slug := 'dev-six-scale-lesson-' || v_lesson::text;
    v_lsong_slug := 'dev-six-scale-lsong-' || v_lesson::text;
    v_group := uuid_generate_v5(v_ns, v_group_slug);
    v_stage := uuid_generate_v5(v_ns, v_stage_slug);
    v_phrase := uuid_generate_v5(v_ns, v_stage_slug || '-phrase');
    v_lesson_id := uuid_generate_v5(v_ns, v_lesson_slug);
    v_lsong_id := uuid_generate_v5(v_ns, v_lsong_slug);

    CASE v_lesson
      WHEN 1 THEN
        v_title_ja := '6音スケール L1: A/B/C';
        v_title_en := 'Six-note scale L1: A/B/C';
        v_desc_ja := 'Dm7 上の基本ペア A・B・C のみ。';
        v_desc_en := 'Basic A, B, and C pairs on Dm7 only.';
      WHEN 2 THEN
        v_title_ja := '6音スケール L2: A'' 追加';
        v_title_en := 'Six-note scale L2: add A''';
        v_desc_ja := 'A/B/C に A''（E-C#→D）を追加。';
        v_desc_en := 'Adds A'' (E-C#→D) to A/B/C.';
      WHEN 3 THEN
        v_title_ja := '6音スケール L3: A'''' 追加';
        v_title_en := 'Six-note scale L3: add A''''';
        v_desc_ja := 'A'' に A''''（C#-E-E♭-C#→D）を追加。';
        v_desc_en := 'Adds A'''' (C#-E-Eb-C#→D) to prior pairs.';
      WHEN 4 THEN
        v_title_ja := '6音スケール L4: D ペア';
        v_title_en := 'Six-note scale L4: D pair';
        v_desc_ja := 'D ペア（A-F / F-A）を追加。';
        v_desc_en := 'Adds D pair (A-F / F-A).';
      WHEN 5 THEN
        v_title_ja := '6音スケール L5: E ペア';
        v_title_en := 'Six-note scale L5: E pair';
        v_desc_ja := 'E ペア（E→F 一方通行）を追加。';
        v_desc_en := 'Adds E pair (E→F one-way).';
      WHEN 6 THEN
        v_title_ja := '6音スケール L6: B'' ペア';
        v_title_en := 'Six-note scale L6: B'' pair';
        v_desc_ja := 'B''（G-E→F / E-G→F / G-G♭-F）を追加。';
        v_desc_en := 'Adds B'' (G-E→F / E-G→F / G-Gb-F).';
      ELSE
        v_title_ja := '6音スケール L7: 全ペア';
        v_title_en := 'Six-note scale L7: all pairs';
        v_desc_ja := 'B''''（E-G-G♭-E→F）を含む全ペア。';
        v_desc_en := 'All pairs including B'''' (E-G-Gb-E→F).';
    END CASE;

    INSERT INTO public.ear_training_adlib_pattern_groups (id, name, label, key_fifths)
    VALUES (
      v_group,
      'Dm6Scale-L' || v_lesson::text,
      'Six-note scale pairs (lesson ' || v_lesson::text || ')',
      v_key_fifths
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      label = EXCLUDED.label,
      key_fifths = EXCLUDED.key_fifths,
      updated_at = now();

    DELETE FROM public.ear_training_adlib_patterns WHERE group_id = v_group;

    -- L1: A, B, C
    INSERT INTO public.ear_training_adlib_patterns (
      group_id, label, pcs, family_id, carry_tail_length, priority, sort_order,
      voicing, voicing_staves
    ) VALUES
      (v_group, 'A', ARRAY[5, 7]::smallint[], 'Dm6-A', 0, 0, 0,
        ARRAY['F4', 'G4']::text[], ARRAY[1, 1]::smallint[]),
      (v_group, 'A', ARRAY[7, 5]::smallint[], 'Dm6-A', 0, 0, 1,
        ARRAY['G4', 'F4']::text[], ARRAY[1, 1]::smallint[]),
      (v_group, 'B', ARRAY[9, 0]::smallint[], 'Dm6-B', 0, 0, 2,
        ARRAY['A4', 'C4']::text[], ARRAY[1, 1]::smallint[]),
      (v_group, 'B', ARRAY[0, 9]::smallint[], 'Dm6-B', 0, 0, 3,
        ARRAY['C4', 'A4']::text[], ARRAY[1, 1]::smallint[]),
      (v_group, 'C', ARRAY[2, 4]::smallint[], 'Dm6-C', 0, 0, 4,
        ARRAY['D4', 'E4']::text[], ARRAY[1, 1]::smallint[]),
      (v_group, 'C', ARRAY[4, 2]::smallint[], 'Dm6-C', 0, 0, 5,
        ARRAY['E4', 'D4']::text[], ARRAY[1, 1]::smallint[]);

    IF v_lesson >= 2 THEN
      INSERT INTO public.ear_training_adlib_patterns (
        group_id, label, pcs, family_id, carry_tail_length, priority, sort_order,
        voicing, voicing_staves
      ) VALUES
        (v_group, 'A''', ARRAY[4, 1, 2]::smallint[], 'Dm6-Ap', 1, 0, 6,
          ARRAY['E4', 'C#4', 'D4']::text[], ARRAY[1, 1, 1]::smallint[]),
        (v_group, 'A''', ARRAY[1, 4, 2]::smallint[], 'Dm6-Ap', 1, 0, 7,
          ARRAY['C#4', 'E4', 'D4']::text[], ARRAY[1, 1, 1]::smallint[]);
    END IF;

    IF v_lesson >= 3 THEN
      INSERT INTO public.ear_training_adlib_patterns (
        group_id, label, pcs, family_id, carry_tail_length, priority, sort_order,
        voicing, voicing_staves
      ) VALUES
        (v_group, 'A''''', ARRAY[1, 4, 3, 1, 2]::smallint[], 'Dm6-App', 1, 0, 8,
          ARRAY['C#4', 'E4', 'Eb4', 'C#4', 'D4']::text[], ARRAY[1, 1, 1, 1, 1]::smallint[]);
    END IF;

    IF v_lesson >= 4 THEN
      INSERT INTO public.ear_training_adlib_patterns (
        group_id, label, pcs, family_id, carry_tail_length, priority, sort_order,
        voicing, voicing_staves
      ) VALUES
        (v_group, 'D', ARRAY[9, 5]::smallint[], 'Dm6-D', 0, 0, 9,
          ARRAY['A4', 'F4']::text[], ARRAY[1, 1]::smallint[]),
        (v_group, 'D', ARRAY[5, 9]::smallint[], 'Dm6-D', 0, 0, 10,
          ARRAY['F4', 'A4']::text[], ARRAY[1, 1]::smallint[]);
    END IF;

    IF v_lesson >= 5 THEN
      INSERT INTO public.ear_training_adlib_patterns (
        group_id, label, pcs, family_id, carry_tail_length, priority, sort_order,
        voicing, voicing_staves
      ) VALUES
        (v_group, 'E', ARRAY[4, 5]::smallint[], 'Dm6-E', 1, 0, 11,
          ARRAY['E4', 'F4']::text[], ARRAY[1, 1]::smallint[]);
    END IF;

    IF v_lesson >= 6 THEN
      INSERT INTO public.ear_training_adlib_patterns (
        group_id, label, pcs, family_id, carry_tail_length, priority, sort_order,
        voicing, voicing_staves
      ) VALUES
        (v_group, 'B''', ARRAY[7, 4, 5]::smallint[], 'Dm6-Bp', 1, 0, 12,
          ARRAY['G4', 'E4', 'F4']::text[], ARRAY[1, 1, 1]::smallint[]),
        (v_group, 'B''', ARRAY[4, 7, 5]::smallint[], 'Dm6-Bp', 1, 0, 13,
          ARRAY['E4', 'G4', 'F4']::text[], ARRAY[1, 1, 1]::smallint[]),
        (v_group, 'B''', ARRAY[7, 6, 5]::smallint[], 'Dm6-Bp', 1, 0, 14,
          ARRAY['G4', 'Gb4', 'F4']::text[], ARRAY[1, 1, 1]::smallint[]);
    END IF;

    IF v_lesson >= 7 THEN
      INSERT INTO public.ear_training_adlib_patterns (
        group_id, label, pcs, family_id, carry_tail_length, priority, sort_order,
        voicing, voicing_staves
      ) VALUES
        (v_group, 'B''''', ARRAY[4, 7, 6, 4, 5]::smallint[], 'Dm6-Bpp', 1, 0, 15,
          ARRAY['E4', 'G4', 'Gb4', 'E4', 'F4']::text[], ARRAY[1, 1, 1, 1, 1]::smallint[]);
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
      v_desc_ja || ' Dm7 単コード・160 BPM ドラムループ。',
      v_desc_en || ' Single-chord Dm7, 160 BPM drum loop.',
      160, 4, 4, 4, 16, 0,
      120, 500, 8000,
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
      (v_cfg, 0, 'Dm7', v_group, 1, 0, 1.5, false),
      (v_cfg, 1, 'Dm7', v_group, 2, 1.5, 3, false),
      (v_cfg, 2, 'Dm7', v_group, 3, 3, 4.5, false),
      (v_cfg, 3, 'Dm7', v_group, 4, 4.5, 6, false);

    INSERT INTO public.lessons (
      id, course_id, title, title_en, description, description_en,
      premium_only, order_index, block_number, block_name, block_name_en,
      nav_links, assignment_description, assignment_description_en
    ) VALUES (
      v_lesson_id,
      v_course,
      v_title_ja,
      v_title_en,
      v_desc_ja,
      v_desc_en,
      false,
      v_base_order + v_lesson,
      v_block_number,
      '6音スケール',
      'Six-note scale',
      '[]'::jsonb,
      v_title_ja || ' のペアアドリブでランクB以上を1回クリアしてください。',
      'Clear the phrase-pair adlib boss once at rank B or better: ' || v_title_en || '.'
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

    INSERT INTO public.lesson_songs (
      id, lesson_id, song_id, order_index, clear_conditions,
      is_fantasy, is_survival, is_ear_training, is_ear_training_tutorial,
      ear_training_tutorial_script_id, ear_training_stage_id,
      title, title_en, is_clear_required
    ) VALUES (
      v_lsong_id,
      v_lesson_id,
      NULL,
      0,
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
      is_ear_training = EXCLUDED.is_ear_training,
      ear_training_stage_id = EXCLUDED.ear_training_stage_id,
      title = EXCLUDED.title,
      title_en = EXCLUDED.title_en,
      clear_conditions = EXCLUDED.clear_conditions,
      is_clear_required = EXCLUDED.is_clear_required;
  END LOOP;
END $$;

COMMIT;
