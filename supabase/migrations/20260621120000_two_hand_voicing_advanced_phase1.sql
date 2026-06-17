-- 両手ヴォイシングコース(上級) フェーズ1
-- So What m7 / M7 / 7alt + メジャー II-V-I
BEGIN;

INSERT INTO public.courses (
  id, title, title_en, description, description_en,
  premium_only, order_index, audience, is_tutorial, is_visible,
  difficulty_tier, is_developer_only, is_main_course
) SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'course-two-hand-voicing-advanced'),
  '両手ヴォイシングコース(上級)',
  'Two-Hand Voicing (Advanced)',
  'So What / UST の 5 音ヴォイシングとメジャー II-V-I を、クイズ・耳コピ・サバイバルで身につけましょう。',
  'Master So What / UST five-note voicings and major II-V-I through quiz, ear training, and survival modes.',
  true,
  COALESCE((SELECT MAX(c.order_index) FROM public.courses c
    WHERE COALESCE(c.is_developer_only, false) = false
      AND COALESCE(c.is_visible, true) = true), 0) + 1,
  'both', false, true, 'advanced', false, false
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  difficulty_tier = EXCLUDED.difficulty_tier,
  is_visible = EXCLUDED.is_visible,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (
  'thva-demo-b1-m7',
  '両手ヴォイシング デモ (So What Voicing m7)',
  'Two-hand voicing demo (So What Voicing m7)',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"So What / UST ヴォイシングでは、5 音の形を最低音から覚えるのじゃ。","en":"In So What / UST voicings, learn the five-note shape from the bottom note."},{"speaker":"fai","ja":"So What Voicing m7 の進行を確認してから、弾いてみよう。","en":"Check the progression first, then try playing."},{"speaker":"jajii","ja":"コード表記は m7 で統一じゃ。焦らず形を覚えるんじゃ。","en":"Chord symbols stay m7. Take your time learning the shapes."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (
  'thva-demo-b1-M7',
  '両手ヴォイシング デモ (So What Voicing M7)',
  'Two-hand voicing demo (So What Voicing M7)',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"So What / UST ヴォイシングでは、5 音の形を最低音から覚えるのじゃ。","en":"In So What / UST voicings, learn the five-note shape from the bottom note."},{"speaker":"fai","ja":"So What Voicing M7 の進行を確認してから、弾いてみよう。","en":"Check the progression first, then try playing."},{"speaker":"jajii","ja":"コード表記は M7 で統一じゃ。焦らず形を覚えるんじゃ。","en":"Chord symbols stay M7. Take your time learning the shapes."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (
  'thva-demo-b1-7alt',
  '両手ヴォイシング デモ (UST bVI / 7alt)',
  'Two-hand voicing demo (UST bVI / 7alt)',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"So What / UST ヴォイシングでは、5 音の形を最低音から覚えるのじゃ。","en":"In So What / UST voicings, learn the five-note shape from the bottom note."},{"speaker":"fai","ja":"UST bVI / 7alt の進行を確認してから、弾いてみよう。","en":"Check the progression first, then try playing."},{"speaker":"jajii","ja":"コード表記は 7alt で統一じゃ。焦らず形を覚えるんじゃ。","en":"Chord symbols stay 7alt. Take your time learning the shapes."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (
  'thva-demo-b1-major-ii-v-i',
  '両手ヴォイシング デモ (メジャー II-V-I)',
  'Two-hand voicing demo (Major II-V-I)',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"メジャー II-V-I では、IIm7 → V7alt → IM7 のトップラインが 6度 → ♭7/#9 → 7度 になるのじゃ。","en":"In major II-V-I, the top line moves 6th → flat 7/sharp 9 → 7th across IIm7, V7alt, and IM7."},{"speaker":"fai","ja":"メジャー II-V-I の流れを確認してから、弾いてみよう。","en":"Check the flow first, then try playing."},{"speaker":"jajii","ja":"V7alt の 3rd は b4 表記じゃ。左手2音 + 右手3音の形を覚えるんじゃ。","en":"Use flat-4 spelling for the V7alt 3rd. Learn the two-left, three-right hand shape."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1253, 'progression', 'survival',
  '両手ヴォイシング: So What Voicing m7: Cm7-Fm7-Bbm7-Ebm7',
  'Two-hand voicing: So What Voicing m7: Cm7-Fm7-Bbm7-Ebm7',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  'm7', false, NULL,
  '[{"name":"Cm7","voicing":[48,53,58,63,67],"voicing_names":["C3","F3","Bb3","Eb4","G4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"Fm7","voicing":[53,58,63,68,72],"voicing_names":["F3","Bb3","Eb4","Ab4","C5"],"key_fifths":-1,"voicing_staves":[2,2,1,1,1]},{"name":"Bbm7","voicing":[58,63,68,73,77],"voicing_names":["Bb3","Eb4","Ab4","Db5","F5"],"key_fifths":-2,"voicing_staves":[2,1,1,1,1]},{"name":"Ebm7","voicing":[51,56,61,66,70],"voicing_names":["Eb3","Ab3","Db4","Gb4","Bb4"],"key_fifths":-3,"voicing_staves":[2,2,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  block_key = EXCLUDED.block_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1254, 'progression', 'survival',
  '両手ヴォイシング: So What Voicing m7: C#m7-F#m7-Bm7-Em7',
  'Two-hand voicing: So What Voicing m7: C#m7-F#m7-Bm7-Em7',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  'm7', false, NULL,
  '[{"name":"C#m7","voicing":[49,54,59,64,68],"voicing_names":["C#3","F#3","B3","E4","G#4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]},{"name":"F#m7","voicing":[54,59,64,69,73],"voicing_names":["F#3","B3","E4","A4","C#5"],"key_fifths":4,"voicing_staves":[2,2,1,1,1]},{"name":"Bm7","voicing":[59,64,69,74,78],"voicing_names":["B3","E4","A4","D5","F#5"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]},{"name":"Em7","voicing":[52,57,62,67,71],"voicing_names":["E3","A3","D4","G4","B4"],"key_fifths":4,"voicing_staves":[2,2,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  block_key = EXCLUDED.block_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1255, 'progression', 'survival',
  '両手ヴォイシング: So What Voicing m7: Gm7-Am7-Dm7-G#m7',
  'Two-hand voicing: So What Voicing m7: Gm7-Am7-Dm7-G#m7',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  'm7', false, NULL,
  '[{"name":"Gm7","voicing":[55,60,65,70,74],"voicing_names":["G3","C4","F4","Bb4","D5"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]},{"name":"Am7","voicing":[57,62,67,72,76],"voicing_names":["A3","D4","G4","C5","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]},{"name":"Dm7","voicing":[50,55,60,65,69],"voicing_names":["D3","G3","C4","F4","A4"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]},{"name":"G#m7","voicing":[56,61,66,71,75],"voicing_names":["G#3","C#4","F#4","B4","D#5"],"key_fifths":5,"voicing_staves":[2,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  block_key = EXCLUDED.block_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1256, 'progression', 'survival',
  '両手ヴォイシング: So What Voicing m7: まとめ',
  'Two-hand voicing: So What Voicing m7: まとめ',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  'm7', false, NULL,
  '[{"name":"Cm7","voicing":[48,53,58,63,67],"voicing_names":["C3","F3","Bb3","Eb4","G4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"Fm7","voicing":[53,58,63,68,72],"voicing_names":["F3","Bb3","Eb4","Ab4","C5"],"key_fifths":-1,"voicing_staves":[2,2,1,1,1]},{"name":"Bbm7","voicing":[58,63,68,73,77],"voicing_names":["Bb3","Eb4","Ab4","Db5","F5"],"key_fifths":-2,"voicing_staves":[2,1,1,1,1]},{"name":"Ebm7","voicing":[51,56,61,66,70],"voicing_names":["Eb3","Ab3","Db4","Gb4","Bb4"],"key_fifths":-3,"voicing_staves":[2,2,1,1,1]},{"name":"C#m7","voicing":[49,54,59,64,68],"voicing_names":["C#3","F#3","B3","E4","G#4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]},{"name":"F#m7","voicing":[54,59,64,69,73],"voicing_names":["F#3","B3","E4","A4","C#5"],"key_fifths":4,"voicing_staves":[2,2,1,1,1]},{"name":"Bm7","voicing":[59,64,69,74,78],"voicing_names":["B3","E4","A4","D5","F#5"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]},{"name":"Em7","voicing":[52,57,62,67,71],"voicing_names":["E3","A3","D4","G4","B4"],"key_fifths":4,"voicing_staves":[2,2,1,1,1]},{"name":"Gm7","voicing":[55,60,65,70,74],"voicing_names":["G3","C4","F4","Bb4","D5"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]},{"name":"Am7","voicing":[57,62,67,72,76],"voicing_names":["A3","D4","G4","C5","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]},{"name":"Dm7","voicing":[50,55,60,65,69],"voicing_names":["D3","G3","C4","F4","A4"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]},{"name":"G#m7","voicing":[56,61,66,71,75],"voicing_names":["G#3","C#4","F#4","B4","D#5"],"key_fifths":5,"voicing_staves":[2,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  block_key = EXCLUDED.block_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1257, 'progression', 'survival',
  '両手ヴォイシング: So What Voicing M7: AbM7-AM7-BbM7-BM7',
  'Two-hand voicing: So What Voicing M7: AbM7-AM7-BbM7-BM7',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"AbM7","voicing":[48,53,58,64,67],"voicing_names":["C3","F3","Bb3","E4","G4"],"key_fifths":-4,"voicing_staves":[2,2,1,1,1]},{"name":"AM7","voicing":[49,54,59,65,68],"voicing_names":["C#3","F#3","B3","E#4","G#4"],"key_fifths":3,"voicing_staves":[2,2,1,1,1]},{"name":"BbM7","voicing":[50,55,60,66,69],"voicing_names":["D3","G3","C4","F#4","A4"],"key_fifths":-2,"voicing_staves":[2,2,1,1,1]},{"name":"BM7","voicing":[51,56,61,67,70],"voicing_names":["D#3","G#3","C#4","F##4","A#4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  block_key = EXCLUDED.block_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1258, 'progression', 'survival',
  '両手ヴォイシング: So What Voicing M7: CM7-DbM7-DM7-EbM7',
  'Two-hand voicing: So What Voicing M7: CM7-DbM7-DM7-EbM7',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"CM7","voicing":[52,57,62,68,71],"voicing_names":["E3","A3","D4","G#4","B4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"DbM7","voicing":[53,58,63,69,72],"voicing_names":["F3","Bb3","Eb4","A4","C5"],"key_fifths":-5,"voicing_staves":[2,2,1,1,1]},{"name":"DM7","voicing":[54,59,64,70,73],"voicing_names":["F#3","B3","E4","A#4","C#5"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]},{"name":"EbM7","voicing":[55,60,65,71,74],"voicing_names":["G3","C4","F4","B4","D5"],"key_fifths":-3,"voicing_staves":[2,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  block_key = EXCLUDED.block_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1259, 'progression', 'survival',
  '両手ヴォイシング: So What Voicing M7: EM7-FM7-GbM7-GM7',
  'Two-hand voicing: So What Voicing M7: EM7-FM7-GbM7-GM7',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"EM7","voicing":[56,61,66,72,75],"voicing_names":["G#3","C#4","F#4","B#4","D#5"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"FM7","voicing":[57,62,67,73,76],"voicing_names":["A3","D4","G4","C#5","E5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]},{"name":"GbM7","voicing":[58,63,68,74,77],"voicing_names":["Bb3","Eb4","Ab4","D5","F5"],"key_fifths":-6,"voicing_staves":[2,1,1,1,1]},{"name":"GM7","voicing":[59,64,69,75,78],"voicing_names":["B3","E4","A4","D#5","F#5"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  block_key = EXCLUDED.block_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1260, 'progression', 'survival',
  '両手ヴォイシング: So What Voicing M7: まとめ',
  'Two-hand voicing: So What Voicing M7: まとめ',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"AbM7","voicing":[48,53,58,64,67],"voicing_names":["C3","F3","Bb3","E4","G4"],"key_fifths":-4,"voicing_staves":[2,2,1,1,1]},{"name":"AM7","voicing":[49,54,59,65,68],"voicing_names":["C#3","F#3","B3","E#4","G#4"],"key_fifths":3,"voicing_staves":[2,2,1,1,1]},{"name":"BbM7","voicing":[50,55,60,66,69],"voicing_names":["D3","G3","C4","F#4","A4"],"key_fifths":-2,"voicing_staves":[2,2,1,1,1]},{"name":"BM7","voicing":[51,56,61,67,70],"voicing_names":["D#3","G#3","C#4","F##4","A#4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]},{"name":"CM7","voicing":[52,57,62,68,71],"voicing_names":["E3","A3","D4","G#4","B4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"DbM7","voicing":[53,58,63,69,72],"voicing_names":["F3","Bb3","Eb4","A4","C5"],"key_fifths":-5,"voicing_staves":[2,2,1,1,1]},{"name":"DM7","voicing":[54,59,64,70,73],"voicing_names":["F#3","B3","E4","A#4","C#5"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]},{"name":"EbM7","voicing":[55,60,65,71,74],"voicing_names":["G3","C4","F4","B4","D5"],"key_fifths":-3,"voicing_staves":[2,1,1,1,1]},{"name":"EM7","voicing":[56,61,66,72,75],"voicing_names":["G#3","C#4","F#4","B#4","D#5"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"FM7","voicing":[57,62,67,73,76],"voicing_names":["A3","D4","G4","C#5","E5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]},{"name":"GbM7","voicing":[58,63,68,74,77],"voicing_names":["Bb3","Eb4","Ab4","D5","F5"],"key_fifths":-6,"voicing_staves":[2,1,1,1,1]},{"name":"GM7","voicing":[59,64,69,75,78],"voicing_names":["B3","E4","A4","D#5","F#5"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  block_key = EXCLUDED.block_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1261, 'progression', 'survival',
  '両手ヴォイシング: UST bVI / 7alt: D7alt-D#7alt-E7alt-F7alt',
  'Two-hand voicing: UST bVI / 7alt: D7alt-D#7alt-E7alt-F7alt',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  '7alt', false, NULL,
  '[{"name":"D7alt","voicing":[48,54,58,62,65],"voicing_names":["C3","Gb3","Bb3","D4","F4"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]},{"name":"D#7alt","voicing":[49,55,59,63,66],"voicing_names":["C#3","G3","B3","D#4","F#4"],"key_fifths":4,"voicing_staves":[2,2,1,1,1]},{"name":"E7alt","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":4,"voicing_staves":[2,2,1,1,1]},{"name":"F7alt","voicing":[51,57,61,65,68],"voicing_names":["Eb3","Bbb3","Db4","F4","Ab4"],"key_fifths":-1,"voicing_staves":[2,2,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  block_key = EXCLUDED.block_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1262, 'progression', 'survival',
  '両手ヴォイシング: UST bVI / 7alt: F#7alt-G7alt-G#7alt-A7alt',
  'Two-hand voicing: UST bVI / 7alt: F#7alt-G7alt-G#7alt-A7alt',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  '7alt', false, NULL,
  '[{"name":"F#7alt","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":4,"voicing_staves":[2,2,1,1,1]},{"name":"G7alt","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":1,"voicing_staves":[2,2,1,1,1]},{"name":"G#7alt","voicing":[54,60,64,68,71],"voicing_names":["F#3","C4","E4","G#4","B4"],"key_fifths":5,"voicing_staves":[2,1,1,1,1]},{"name":"A7alt","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  block_key = EXCLUDED.block_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1263, 'progression', 'survival',
  '両手ヴォイシング: UST bVI / 7alt: Bb7alt-B7alt-C7alt-C#7alt',
  'Two-hand voicing: UST bVI / 7alt: Bb7alt-B7alt-C7alt-C#7alt',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  '7alt', false, NULL,
  '[{"name":"Bb7alt","voicing":[56,62,66,70,73],"voicing_names":["Ab3","Ebb4","Gb4","Bb4","Db5"],"key_fifths":-2,"voicing_staves":[2,1,1,1,1]},{"name":"B7alt","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":5,"voicing_staves":[2,1,1,1,1]},{"name":"C7alt","voicing":[58,64,68,72,75],"voicing_names":["Bb3","Fb4","Ab4","C5","Eb5"],"key_fifths":0,"voicing_staves":[2,1,1,1,1]},{"name":"C#7alt","voicing":[59,65,69,73,76],"voicing_names":["B3","F4","A4","C#5","E5"],"key_fifths":5,"voicing_staves":[2,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  block_key = EXCLUDED.block_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1264, 'progression', 'survival',
  '両手ヴォイシング: UST bVI / 7alt: まとめ',
  'Two-hand voicing: UST bVI / 7alt: まとめ',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  '7alt', false, NULL,
  '[{"name":"D7alt","voicing":[48,54,58,62,65],"voicing_names":["C3","Gb3","Bb3","D4","F4"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]},{"name":"D#7alt","voicing":[49,55,59,63,66],"voicing_names":["C#3","G3","B3","D#4","F#4"],"key_fifths":4,"voicing_staves":[2,2,1,1,1]},{"name":"E7alt","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":4,"voicing_staves":[2,2,1,1,1]},{"name":"F7alt","voicing":[51,57,61,65,68],"voicing_names":["Eb3","Bbb3","Db4","F4","Ab4"],"key_fifths":-1,"voicing_staves":[2,2,1,1,1]},{"name":"F#7alt","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":4,"voicing_staves":[2,2,1,1,1]},{"name":"G7alt","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":1,"voicing_staves":[2,2,1,1,1]},{"name":"G#7alt","voicing":[54,60,64,68,71],"voicing_names":["F#3","C4","E4","G#4","B4"],"key_fifths":5,"voicing_staves":[2,1,1,1,1]},{"name":"A7alt","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]},{"name":"Bb7alt","voicing":[56,62,66,70,73],"voicing_names":["Ab3","Ebb4","Gb4","Bb4","Db5"],"key_fifths":-2,"voicing_staves":[2,1,1,1,1]},{"name":"B7alt","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":5,"voicing_staves":[2,1,1,1,1]},{"name":"C7alt","voicing":[58,64,68,72,75],"voicing_names":["Bb3","Fb4","Ab4","C5","Eb5"],"key_fifths":0,"voicing_staves":[2,1,1,1,1]},{"name":"C#7alt","voicing":[59,65,69,73,76],"voicing_names":["B3","F4","A4","C#5","E5"],"key_fifths":5,"voicing_staves":[2,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  block_key = EXCLUDED.block_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1265, 'progression', 'survival',
  '両手ヴォイシング: メジャー II-V-I: Key of C & F',
  'Two-hand voicing: メジャー II-V-I: Key of C & F',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"Dm7","voicing":[50,55,60,65,69],"voicing_names":["D3","G3","C4","F4","A4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"G7alt","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"CM7","voicing":[52,57,62,68,71],"voicing_names":["E3","A3","D4","G#4","B4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"Gm7","voicing":[55,60,65,70,74],"voicing_names":["G3","C4","F4","Bb4","D5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]},{"name":"C7alt","voicing":[58,64,68,72,75],"voicing_names":["Bb3","Fb4","Ab4","C5","Eb5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]},{"name":"FM7","voicing":[57,62,67,73,76],"voicing_names":["A3","D4","G4","C#5","E5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  block_key = EXCLUDED.block_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1266, 'progression', 'survival',
  '両手ヴォイシング: メジャー II-V-I: Key of Bb & Eb',
  'Two-hand voicing: メジャー II-V-I: Key of Bb & Eb',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"Cm7","voicing":[48,53,58,63,67],"voicing_names":["C3","F3","Bb3","Eb4","G4"],"key_fifths":-2,"voicing_staves":[2,2,1,1,1]},{"name":"F7alt","voicing":[51,57,61,65,68],"voicing_names":["Eb3","Bbb3","Db4","F4","Ab4"],"key_fifths":-2,"voicing_staves":[2,2,1,1,1]},{"name":"BbM7","voicing":[50,55,60,66,69],"voicing_names":["D3","G3","C4","F#4","A4"],"key_fifths":-2,"voicing_staves":[2,2,1,1,1]},{"name":"Fm7","voicing":[53,58,63,68,72],"voicing_names":["F3","Bb3","Eb4","Ab4","C5"],"key_fifths":-3,"voicing_staves":[2,2,1,1,1]},{"name":"Bb7alt","voicing":[56,62,66,70,73],"voicing_names":["Ab3","Ebb4","Gb4","Bb4","Db5"],"key_fifths":-3,"voicing_staves":[2,1,1,1,1]},{"name":"EbM7","voicing":[55,60,65,71,74],"voicing_names":["G3","C4","F4","B4","D5"],"key_fifths":-3,"voicing_staves":[2,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  block_key = EXCLUDED.block_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1267, 'progression', 'survival',
  '両手ヴォイシング: メジャー II-V-I: Key of Ab & Db',
  'Two-hand voicing: メジャー II-V-I: Key of Ab & Db',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"Bbm7","voicing":[46,51,56,61,65],"voicing_names":["Bb2","Eb3","Ab3","Db4","F4"],"key_fifths":-4,"voicing_staves":[2,2,1,1,1]},{"name":"Eb7alt","voicing":[49,55,59,63,66],"voicing_names":["Db3","Abb3","Cb4","Eb4","Gb4"],"key_fifths":-4,"voicing_staves":[2,2,1,1,1]},{"name":"AbM7","voicing":[48,53,58,64,67],"voicing_names":["C3","F3","Bb3","E4","G4"],"key_fifths":-4,"voicing_staves":[2,2,1,1,1]},{"name":"Ebm7","voicing":[51,56,61,66,70],"voicing_names":["Eb3","Ab3","Db4","Gb4","Bb4"],"key_fifths":-5,"voicing_staves":[2,2,1,1,1]},{"name":"Ab7alt","voicing":[54,60,64,68,71],"voicing_names":["Gb3","Dbb4","Fb4","Ab4","Cb5"],"key_fifths":-5,"voicing_staves":[2,1,1,1,1]},{"name":"DbM7","voicing":[53,58,63,69,72],"voicing_names":["F3","Bb3","Eb4","A4","C5"],"key_fifths":-5,"voicing_staves":[2,2,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  block_key = EXCLUDED.block_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1268, 'progression', 'survival',
  '両手ヴォイシング: メジャー II-V-I: Key of Gb & B',
  'Two-hand voicing: メジャー II-V-I: Key of Gb & B',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"Abm7","voicing":[56,61,66,71,75],"voicing_names":["Ab3","Db4","Gb4","Cb5","Eb5"],"key_fifths":-6,"voicing_staves":[2,1,1,1,1]},{"name":"Db7alt","voicing":[59,65,69,73,76],"voicing_names":["Cb4","Gbb4","Bbb4","Db5","Fb5"],"key_fifths":-6,"voicing_staves":[2,1,1,1,1]},{"name":"GbM7","voicing":[58,63,68,74,77],"voicing_names":["Bb3","Eb4","Ab4","D5","F5"],"key_fifths":-6,"voicing_staves":[2,1,1,1,1]},{"name":"C#m7","voicing":[49,54,59,64,68],"voicing_names":["C#3","F#3","B3","E4","G#4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]},{"name":"F#7alt","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]},{"name":"BM7","voicing":[51,56,61,67,70],"voicing_names":["D#3","G#3","C#4","F##4","A#4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  block_key = EXCLUDED.block_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1269, 'progression', 'survival',
  '両手ヴォイシング: メジャー II-V-I: Key of E & A',
  'Two-hand voicing: メジャー II-V-I: Key of E & A',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"F#m7","voicing":[54,59,64,69,73],"voicing_names":["F#3","B3","E4","A4","C#5"],"key_fifths":4,"voicing_staves":[2,2,1,1,1]},{"name":"B7alt","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"EM7","voicing":[56,61,66,72,75],"voicing_names":["G#3","C#4","F#4","B#4","D#5"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"Bm7","voicing":[47,52,57,62,66],"voicing_names":["B2","E3","A3","D4","F#4"],"key_fifths":3,"voicing_staves":[2,2,1,1,1]},{"name":"E7alt","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":3,"voicing_staves":[2,2,1,1,1]},{"name":"AM7","voicing":[49,54,59,65,68],"voicing_names":["C#3","F#3","B3","E#4","G#4"],"key_fifths":3,"voicing_staves":[2,2,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  block_key = EXCLUDED.block_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1270, 'progression', 'survival',
  '両手ヴォイシング: メジャー II-V-I: Key of D & G',
  'Two-hand voicing: メジャー II-V-I: Key of D & G',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"Em7","voicing":[52,57,62,67,71],"voicing_names":["E3","A3","D4","G4","B4"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]},{"name":"A7alt","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":2,"voicing_staves":[2,1,1,1,1]},{"name":"DM7","voicing":[54,59,64,70,73],"voicing_names":["F#3","B3","E4","A#4","C#5"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]},{"name":"Am7","voicing":[57,62,67,72,76],"voicing_names":["A3","D4","G4","C5","E5"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]},{"name":"D7alt","voicing":[48,54,58,62,65],"voicing_names":["C3","Gb3","Bb3","D4","F4"],"key_fifths":1,"voicing_staves":[2,2,1,1,1]},{"name":"GM7","voicing":[59,64,69,75,78],"voicing_names":["B3","E4","A4","D#5","F#5"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  block_key = EXCLUDED.block_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1271, 'progression', 'survival',
  '両手ヴォイシング: メジャー II-V-I: まとめ',
  'Two-hand voicing: メジャー II-V-I: まとめ',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"Dm7","voicing":[50,55,60,65,69],"voicing_names":["D3","G3","C4","F4","A4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"G7alt","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"CM7","voicing":[52,57,62,68,71],"voicing_names":["E3","A3","D4","G#4","B4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"Gm7","voicing":[55,60,65,70,74],"voicing_names":["G3","C4","F4","Bb4","D5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]},{"name":"C7alt","voicing":[58,64,68,72,75],"voicing_names":["Bb3","Fb4","Ab4","C5","Eb5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]},{"name":"FM7","voicing":[57,62,67,73,76],"voicing_names":["A3","D4","G4","C#5","E5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]},{"name":"Cm7","voicing":[48,53,58,63,67],"voicing_names":["C3","F3","Bb3","Eb4","G4"],"key_fifths":-2,"voicing_staves":[2,2,1,1,1]},{"name":"F7alt","voicing":[51,57,61,65,68],"voicing_names":["Eb3","Bbb3","Db4","F4","Ab4"],"key_fifths":-2,"voicing_staves":[2,2,1,1,1]},{"name":"BbM7","voicing":[50,55,60,66,69],"voicing_names":["D3","G3","C4","F#4","A4"],"key_fifths":-2,"voicing_staves":[2,2,1,1,1]},{"name":"Fm7","voicing":[53,58,63,68,72],"voicing_names":["F3","Bb3","Eb4","Ab4","C5"],"key_fifths":-3,"voicing_staves":[2,2,1,1,1]},{"name":"Bb7alt","voicing":[56,62,66,70,73],"voicing_names":["Ab3","Ebb4","Gb4","Bb4","Db5"],"key_fifths":-3,"voicing_staves":[2,1,1,1,1]},{"name":"EbM7","voicing":[55,60,65,71,74],"voicing_names":["G3","C4","F4","B4","D5"],"key_fifths":-3,"voicing_staves":[2,1,1,1,1]},{"name":"Bbm7","voicing":[46,51,56,61,65],"voicing_names":["Bb2","Eb3","Ab3","Db4","F4"],"key_fifths":-4,"voicing_staves":[2,2,1,1,1]},{"name":"Eb7alt","voicing":[49,55,59,63,66],"voicing_names":["Db3","Abb3","Cb4","Eb4","Gb4"],"key_fifths":-4,"voicing_staves":[2,2,1,1,1]},{"name":"AbM7","voicing":[48,53,58,64,67],"voicing_names":["C3","F3","Bb3","E4","G4"],"key_fifths":-4,"voicing_staves":[2,2,1,1,1]},{"name":"Ebm7","voicing":[51,56,61,66,70],"voicing_names":["Eb3","Ab3","Db4","Gb4","Bb4"],"key_fifths":-5,"voicing_staves":[2,2,1,1,1]},{"name":"Ab7alt","voicing":[54,60,64,68,71],"voicing_names":["Gb3","Dbb4","Fb4","Ab4","Cb5"],"key_fifths":-5,"voicing_staves":[2,1,1,1,1]},{"name":"DbM7","voicing":[53,58,63,69,72],"voicing_names":["F3","Bb3","Eb4","A4","C5"],"key_fifths":-5,"voicing_staves":[2,2,1,1,1]},{"name":"Abm7","voicing":[56,61,66,71,75],"voicing_names":["Ab3","Db4","Gb4","Cb5","Eb5"],"key_fifths":-6,"voicing_staves":[2,1,1,1,1]},{"name":"Db7alt","voicing":[59,65,69,73,76],"voicing_names":["Cb4","Gbb4","Bbb4","Db5","Fb5"],"key_fifths":-6,"voicing_staves":[2,1,1,1,1]},{"name":"GbM7","voicing":[58,63,68,74,77],"voicing_names":["Bb3","Eb4","Ab4","D5","F5"],"key_fifths":-6,"voicing_staves":[2,1,1,1,1]},{"name":"C#m7","voicing":[49,54,59,64,68],"voicing_names":["C#3","F#3","B3","E4","G#4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]},{"name":"F#7alt","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]},{"name":"BM7","voicing":[51,56,61,67,70],"voicing_names":["D#3","G#3","C#4","F##4","A#4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]},{"name":"F#m7","voicing":[54,59,64,69,73],"voicing_names":["F#3","B3","E4","A4","C#5"],"key_fifths":4,"voicing_staves":[2,2,1,1,1]},{"name":"B7alt","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"EM7","voicing":[56,61,66,72,75],"voicing_names":["G#3","C#4","F#4","B#4","D#5"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"Bm7","voicing":[47,52,57,62,66],"voicing_names":["B2","E3","A3","D4","F#4"],"key_fifths":3,"voicing_staves":[2,2,1,1,1]},{"name":"E7alt","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":3,"voicing_staves":[2,2,1,1,1]},{"name":"AM7","voicing":[49,54,59,65,68],"voicing_names":["C#3","F#3","B3","E#4","G#4"],"key_fifths":3,"voicing_staves":[2,2,1,1,1]},{"name":"Em7","voicing":[52,57,62,67,71],"voicing_names":["E3","A3","D4","G4","B4"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]},{"name":"A7alt","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":2,"voicing_staves":[2,1,1,1,1]},{"name":"DM7","voicing":[54,59,64,70,73],"voicing_names":["F#3","B3","E4","A#4","C#5"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]},{"name":"Am7","voicing":[57,62,67,72,76],"voicing_names":["A3","D4","G4","C5","E5"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]},{"name":"D7alt","voicing":[48,54,58,62,65],"voicing_names":["C3","Gb3","Bb3","D4","F4"],"key_fifths":1,"voicing_staves":[2,2,1,1,1]},{"name":"GM7","voicing":[59,64,69,75,78],"voicing_names":["B3","E4","A4","D#5","F#5"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  block_key = EXCLUDED.block_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-quiz'),
  'thva-quiz-b1-m7-p1',
  'クイズ: Cm7-Fm7-Bbm7-Ebm7',
  'Quiz: Cm7-Fm7-Bbm7-Ebm7',
  '60秒以内に20問正解。Cm7-Fm7-Bbm7-Ebm7 の So What / UST ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using Cm7-Fm7-Bbm7-Ebm7 So What / UST voicings.',
  100, 0, 4, 4, 4, 4,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  60, 'sequential', true, false, 20, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_question_order = EXCLUDED.quiz_question_order,
  quiz_show_notation_in_battle = EXCLUDED.quiz_show_notation_in_battle,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-quiz'),
  0, 1, 1, 4,
  'Cm7',
  ARRAY['C3', 'F3', 'Bb3', 'Eb4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-quiz'),
  1, 2, 1, 4,
  'Fm7',
  ARRAY['F3', 'Bb3', 'Eb4', 'Ab4', 'C5']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-quiz'),
  2, 3, 1, 4,
  'Bbm7',
  ARRAY['Bb3', 'Eb4', 'Ab4', 'Db5', 'F5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-quiz'),
  3, 4, 1, 4,
  'Ebm7',
  ARRAY['Eb3', 'Ab3', 'Db4', 'Gb4', 'Bb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-voicing'),
  'thva-voicing-b1-m7-p1',
  '耳コピ: Cm7-Fm7-Bbm7-Ebm7',
  'Ear training: Cm7-Fm7-Bbm7-Ebm7',
  'BPM100・3ループ以内に進行を弾きましょう。',
  'Play the progression within 3 loops at 100 BPM.',
  100, 0, 4, 4, 4, 3,
  4, 180, 100, 90,
  2, 12, 18, 24, 3, 30, 0, 2,
  'blue_club', true, 'chord_voicing', true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  time_limit_sec = EXCLUDED.time_limit_sec,
  enemy_hp = EXCLUDED.enemy_hp,
  fail_damage = EXCLUDED.fail_damage,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-voicing'),
  0,
  'Cm7-Fm7-Bbm7-Ebm7',
  'Cm7-Fm7-Bbm7-Ebm7',
  NULL,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3',
  9.6, 57.6, 0,
  0
)
ON CONFLICT (id) DO UPDATE SET
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  updated_at = now();

INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-voicing-ph0'),
  0,
  'Cm7',
  1, 1, 4,
  0, 2.4,
  ARRAY['C3', 'F3', 'Bb3', 'Eb4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-voicing-ph0'),
  1,
  'Fm7',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['F3', 'Bb3', 'Eb4', 'Ab4', 'C5']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-voicing-ph0'),
  2,
  'Bbm7',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['Bb3', 'Eb4', 'Ab4', 'Db5', 'F5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-voicing-ph0'),
  3,
  'Ebm7',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['Eb3', 'Ab3', 'Db4', 'Gb4', 'Bb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-quiz'),
  'thva-quiz-b1-m7-p2',
  'クイズ: C#m7-F#m7-Bm7-Em7',
  'Quiz: C#m7-F#m7-Bm7-Em7',
  '60秒以内に20問正解。C#m7-F#m7-Bm7-Em7 の So What / UST ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using C#m7-F#m7-Bm7-Em7 So What / UST voicings.',
  100, 0, 4, 4, 4, 4,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  60, 'sequential', true, false, 20, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_question_order = EXCLUDED.quiz_question_order,
  quiz_show_notation_in_battle = EXCLUDED.quiz_show_notation_in_battle,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-quiz'),
  0, 1, 1, 4,
  'C#m7',
  ARRAY['C#3', 'F#3', 'B3', 'E4', 'G#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-quiz'),
  1, 2, 1, 4,
  'F#m7',
  ARRAY['F#3', 'B3', 'E4', 'A4', 'C#5']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-quiz'),
  2, 3, 1, 4,
  'Bm7',
  ARRAY['B3', 'E4', 'A4', 'D5', 'F#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-quiz'),
  3, 4, 1, 4,
  'Em7',
  ARRAY['E3', 'A3', 'D4', 'G4', 'B4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-voicing'),
  'thva-voicing-b1-m7-p2',
  '耳コピ: C#m7-F#m7-Bm7-Em7',
  'Ear training: C#m7-F#m7-Bm7-Em7',
  'BPM100・3ループ以内に進行を弾きましょう。',
  'Play the progression within 3 loops at 100 BPM.',
  100, 0, 4, 4, 4, 3,
  4, 180, 100, 90,
  2, 12, 18, 24, 3, 30, 0, 2,
  'blue_club', true, 'chord_voicing', true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  time_limit_sec = EXCLUDED.time_limit_sec,
  enemy_hp = EXCLUDED.enemy_hp,
  fail_damage = EXCLUDED.fail_damage,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-voicing'),
  0,
  'C#m7-F#m7-Bm7-Em7',
  'C#m7-F#m7-Bm7-Em7',
  NULL,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3',
  9.6, 57.6, 0,
  5
)
ON CONFLICT (id) DO UPDATE SET
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  updated_at = now();

INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-voicing-ph0'),
  0,
  'C#m7',
  1, 1, 4,
  0, 2.4,
  ARRAY['C#3', 'F#3', 'B3', 'E4', 'G#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-voicing-ph0'),
  1,
  'F#m7',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['F#3', 'B3', 'E4', 'A4', 'C#5']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-voicing-ph0'),
  2,
  'Bm7',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['B3', 'E4', 'A4', 'D5', 'F#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-voicing-ph0'),
  3,
  'Em7',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['E3', 'A3', 'D4', 'G4', 'B4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-quiz'),
  'thva-quiz-b1-m7-p3',
  'クイズ: Gm7-Am7-Dm7-G#m7',
  'Quiz: Gm7-Am7-Dm7-G#m7',
  '60秒以内に20問正解。Gm7-Am7-Dm7-G#m7 の So What / UST ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using Gm7-Am7-Dm7-G#m7 So What / UST voicings.',
  100, 0, 4, 4, 4, 4,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  60, 'sequential', true, false, 20, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_question_order = EXCLUDED.quiz_question_order,
  quiz_show_notation_in_battle = EXCLUDED.quiz_show_notation_in_battle,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-quiz'),
  0, 1, 1, 4,
  'Gm7',
  ARRAY['G3', 'C4', 'F4', 'Bb4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-quiz'),
  1, 2, 1, 4,
  'Am7',
  ARRAY['A3', 'D4', 'G4', 'C5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-quiz'),
  2, 3, 1, 4,
  'Dm7',
  ARRAY['D3', 'G3', 'C4', 'F4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-quiz'),
  3, 4, 1, 4,
  'G#m7',
  ARRAY['G#3', 'C#4', 'F#4', 'B4', 'D#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-voicing'),
  'thva-voicing-b1-m7-p3',
  '耳コピ: Gm7-Am7-Dm7-G#m7',
  'Ear training: Gm7-Am7-Dm7-G#m7',
  'BPM100・3ループ以内に進行を弾きましょう。',
  'Play the progression within 3 loops at 100 BPM.',
  100, 0, 4, 4, 4, 3,
  4, 180, 100, 90,
  2, 12, 18, 24, 3, 30, 0, 2,
  'blue_club', true, 'chord_voicing', true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  time_limit_sec = EXCLUDED.time_limit_sec,
  enemy_hp = EXCLUDED.enemy_hp,
  fail_damage = EXCLUDED.fail_damage,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-voicing'),
  0,
  'Gm7-Am7-Dm7-G#m7',
  'Gm7-Am7-Dm7-G#m7',
  NULL,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3',
  9.6, 57.6, 0,
  1
)
ON CONFLICT (id) DO UPDATE SET
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  updated_at = now();

INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-voicing-ph0'),
  0,
  'Gm7',
  1, 1, 4,
  0, 2.4,
  ARRAY['G3', 'C4', 'F4', 'Bb4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-voicing-ph0'),
  1,
  'Am7',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['A3', 'D4', 'G4', 'C5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-voicing-ph0'),
  2,
  'Dm7',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['D3', 'G3', 'C4', 'F4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-voicing-ph0'),
  3,
  'G#m7',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['G#3', 'C#4', 'F#4', 'B4', 'D#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz'),
  'thva-quiz-b1-m7-summary',
  'クイズ: 全キーまとめ',
  'Quiz: All keys',
  '60秒以内に20問正解。全キーの So What / UST ヴォイシングをランダム出題。',
  'Answer 20 questions within 60 seconds. Random So What / UST voicings in all keys.',
  100, 0, 4, 4, 4, 4,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  60, 'random', false, false, 20, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_question_order = EXCLUDED.quiz_question_order,
  quiz_show_notation_in_battle = EXCLUDED.quiz_show_notation_in_battle,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz'),
  0, 1, 1, 4,
  'Cm7',
  ARRAY['C3', 'F3', 'Bb3', 'Eb4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz'),
  1, 2, 1, 4,
  'Fm7',
  ARRAY['F3', 'Bb3', 'Eb4', 'Ab4', 'C5']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz'),
  2, 3, 1, 4,
  'Bbm7',
  ARRAY['Bb3', 'Eb4', 'Ab4', 'Db5', 'F5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz'),
  3, 4, 1, 4,
  'Ebm7',
  ARRAY['Eb3', 'Ab3', 'Db4', 'Gb4', 'Bb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz'),
  4, 5, 1, 4,
  'C#m7',
  ARRAY['C#3', 'F#3', 'B3', 'E4', 'G#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz'),
  5, 6, 1, 4,
  'F#m7',
  ARRAY['F#3', 'B3', 'E4', 'A4', 'C#5']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz'),
  6, 7, 1, 4,
  'Bm7',
  ARRAY['B3', 'E4', 'A4', 'D5', 'F#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz'),
  7, 8, 1, 4,
  'Em7',
  ARRAY['E3', 'A3', 'D4', 'G4', 'B4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz'),
  8, 9, 1, 4,
  'Gm7',
  ARRAY['G3', 'C4', 'F4', 'Bb4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz'),
  9, 10, 1, 4,
  'Am7',
  ARRAY['A3', 'D4', 'G4', 'C5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz'),
  10, 11, 1, 4,
  'Dm7',
  ARRAY['D3', 'G3', 'C4', 'F4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz'),
  11, 12, 1, 4,
  'G#m7',
  ARRAY['G#3', 'C#4', 'F#4', 'B4', 'D#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-quiz'),
  'thva-quiz-b1-M7-p1',
  'クイズ: AbM7-AM7-BbM7-BM7',
  'Quiz: AbM7-AM7-BbM7-BM7',
  '60秒以内に20問正解。AbM7-AM7-BbM7-BM7 の So What / UST ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using AbM7-AM7-BbM7-BM7 So What / UST voicings.',
  100, 0, 4, 4, 4, 4,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  60, 'sequential', true, false, 20, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_question_order = EXCLUDED.quiz_question_order,
  quiz_show_notation_in_battle = EXCLUDED.quiz_show_notation_in_battle,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-quiz'),
  0, 1, 1, 4,
  'AbM7',
  ARRAY['C3', 'F3', 'Bb3', 'E4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-quiz'),
  1, 2, 1, 4,
  'AM7',
  ARRAY['C#3', 'F#3', 'B3', 'E#4', 'G#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-quiz'),
  2, 3, 1, 4,
  'BbM7',
  ARRAY['D3', 'G3', 'C4', 'F#4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-quiz'),
  3, 4, 1, 4,
  'BM7',
  ARRAY['D#3', 'G#3', 'C#4', 'F##4', 'A#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-voicing'),
  'thva-voicing-b1-M7-p1',
  '耳コピ: AbM7-AM7-BbM7-BM7',
  'Ear training: AbM7-AM7-BbM7-BM7',
  'BPM100・3ループ以内に進行を弾きましょう。',
  'Play the progression within 3 loops at 100 BPM.',
  100, 0, 4, 4, 4, 3,
  4, 180, 100, 90,
  2, 12, 18, 24, 3, 30, 0, 2,
  'blue_club', true, 'chord_voicing', true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  time_limit_sec = EXCLUDED.time_limit_sec,
  enemy_hp = EXCLUDED.enemy_hp,
  fail_damage = EXCLUDED.fail_damage,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-voicing'),
  0,
  'AbM7-AM7-BbM7-BM7',
  'AbM7-AM7-BbM7-BM7',
  NULL,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3',
  9.6, 57.6, 0,
  -4
)
ON CONFLICT (id) DO UPDATE SET
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  updated_at = now();

INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-voicing-ph0'),
  0,
  'AbM7',
  1, 1, 4,
  0, 2.4,
  ARRAY['C3', 'F3', 'Bb3', 'E4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-voicing-ph0'),
  1,
  'AM7',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['C#3', 'F#3', 'B3', 'E#4', 'G#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-voicing-ph0'),
  2,
  'BbM7',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['D3', 'G3', 'C4', 'F#4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-voicing-ph0'),
  3,
  'BM7',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['D#3', 'G#3', 'C#4', 'F##4', 'A#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-quiz'),
  'thva-quiz-b1-M7-p2',
  'クイズ: CM7-DbM7-DM7-EbM7',
  'Quiz: CM7-DbM7-DM7-EbM7',
  '60秒以内に20問正解。CM7-DbM7-DM7-EbM7 の So What / UST ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using CM7-DbM7-DM7-EbM7 So What / UST voicings.',
  100, 0, 4, 4, 4, 4,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  60, 'sequential', true, false, 20, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_question_order = EXCLUDED.quiz_question_order,
  quiz_show_notation_in_battle = EXCLUDED.quiz_show_notation_in_battle,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-quiz'),
  0, 1, 1, 4,
  'CM7',
  ARRAY['E3', 'A3', 'D4', 'G#4', 'B4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-quiz'),
  1, 2, 1, 4,
  'DbM7',
  ARRAY['F3', 'Bb3', 'Eb4', 'A4', 'C5']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-quiz'),
  2, 3, 1, 4,
  'DM7',
  ARRAY['F#3', 'B3', 'E4', 'A#4', 'C#5']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-quiz'),
  3, 4, 1, 4,
  'EbM7',
  ARRAY['G3', 'C4', 'F4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-voicing'),
  'thva-voicing-b1-M7-p2',
  '耳コピ: CM7-DbM7-DM7-EbM7',
  'Ear training: CM7-DbM7-DM7-EbM7',
  'BPM100・3ループ以内に進行を弾きましょう。',
  'Play the progression within 3 loops at 100 BPM.',
  100, 0, 4, 4, 4, 3,
  4, 180, 100, 90,
  2, 12, 18, 24, 3, 30, 0, 2,
  'blue_club', true, 'chord_voicing', true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  time_limit_sec = EXCLUDED.time_limit_sec,
  enemy_hp = EXCLUDED.enemy_hp,
  fail_damage = EXCLUDED.fail_damage,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-voicing'),
  0,
  'CM7-DbM7-DM7-EbM7',
  'CM7-DbM7-DM7-EbM7',
  NULL,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3',
  9.6, 57.6, 0,
  0
)
ON CONFLICT (id) DO UPDATE SET
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  updated_at = now();

INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-voicing-ph0'),
  0,
  'CM7',
  1, 1, 4,
  0, 2.4,
  ARRAY['E3', 'A3', 'D4', 'G#4', 'B4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-voicing-ph0'),
  1,
  'DbM7',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['F3', 'Bb3', 'Eb4', 'A4', 'C5']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-voicing-ph0'),
  2,
  'DM7',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['F#3', 'B3', 'E4', 'A#4', 'C#5']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-voicing-ph0'),
  3,
  'EbM7',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['G3', 'C4', 'F4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-quiz'),
  'thva-quiz-b1-M7-p3',
  'クイズ: EM7-FM7-GbM7-GM7',
  'Quiz: EM7-FM7-GbM7-GM7',
  '60秒以内に20問正解。EM7-FM7-GbM7-GM7 の So What / UST ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using EM7-FM7-GbM7-GM7 So What / UST voicings.',
  100, 0, 4, 4, 4, 4,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  60, 'sequential', true, false, 20, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_question_order = EXCLUDED.quiz_question_order,
  quiz_show_notation_in_battle = EXCLUDED.quiz_show_notation_in_battle,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-quiz'),
  0, 1, 1, 4,
  'EM7',
  ARRAY['G#3', 'C#4', 'F#4', 'B#4', 'D#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-quiz'),
  1, 2, 1, 4,
  'FM7',
  ARRAY['A3', 'D4', 'G4', 'C#5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-quiz'),
  2, 3, 1, 4,
  'GbM7',
  ARRAY['Bb3', 'Eb4', 'Ab4', 'D5', 'F5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-quiz'),
  3, 4, 1, 4,
  'GM7',
  ARRAY['B3', 'E4', 'A4', 'D#5', 'F#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-voicing'),
  'thva-voicing-b1-M7-p3',
  '耳コピ: EM7-FM7-GbM7-GM7',
  'Ear training: EM7-FM7-GbM7-GM7',
  'BPM100・3ループ以内に進行を弾きましょう。',
  'Play the progression within 3 loops at 100 BPM.',
  100, 0, 4, 4, 4, 3,
  4, 180, 100, 90,
  2, 12, 18, 24, 3, 30, 0, 2,
  'blue_club', true, 'chord_voicing', true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  time_limit_sec = EXCLUDED.time_limit_sec,
  enemy_hp = EXCLUDED.enemy_hp,
  fail_damage = EXCLUDED.fail_damage,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-voicing'),
  0,
  'EM7-FM7-GbM7-GM7',
  'EM7-FM7-GbM7-GM7',
  NULL,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3',
  9.6, 57.6, 0,
  4
)
ON CONFLICT (id) DO UPDATE SET
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  updated_at = now();

INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-voicing-ph0'),
  0,
  'EM7',
  1, 1, 4,
  0, 2.4,
  ARRAY['G#3', 'C#4', 'F#4', 'B#4', 'D#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-voicing-ph0'),
  1,
  'FM7',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['A3', 'D4', 'G4', 'C#5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-voicing-ph0'),
  2,
  'GbM7',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['Bb3', 'Eb4', 'Ab4', 'D5', 'F5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-voicing-ph0'),
  3,
  'GM7',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['B3', 'E4', 'A4', 'D#5', 'F#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz'),
  'thva-quiz-b1-M7-summary',
  'クイズ: 全キーまとめ',
  'Quiz: All keys',
  '60秒以内に20問正解。全キーの So What / UST ヴォイシングをランダム出題。',
  'Answer 20 questions within 60 seconds. Random So What / UST voicings in all keys.',
  100, 0, 4, 4, 4, 4,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  60, 'random', false, false, 20, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_question_order = EXCLUDED.quiz_question_order,
  quiz_show_notation_in_battle = EXCLUDED.quiz_show_notation_in_battle,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz'),
  0, 1, 1, 4,
  'AbM7',
  ARRAY['C3', 'F3', 'Bb3', 'E4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz'),
  1, 2, 1, 4,
  'AM7',
  ARRAY['C#3', 'F#3', 'B3', 'E#4', 'G#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz'),
  2, 3, 1, 4,
  'BbM7',
  ARRAY['D3', 'G3', 'C4', 'F#4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz'),
  3, 4, 1, 4,
  'BM7',
  ARRAY['D#3', 'G#3', 'C#4', 'F##4', 'A#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz'),
  4, 5, 1, 4,
  'CM7',
  ARRAY['E3', 'A3', 'D4', 'G#4', 'B4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz'),
  5, 6, 1, 4,
  'DbM7',
  ARRAY['F3', 'Bb3', 'Eb4', 'A4', 'C5']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz'),
  6, 7, 1, 4,
  'DM7',
  ARRAY['F#3', 'B3', 'E4', 'A#4', 'C#5']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz'),
  7, 8, 1, 4,
  'EbM7',
  ARRAY['G3', 'C4', 'F4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz'),
  8, 9, 1, 4,
  'EM7',
  ARRAY['G#3', 'C#4', 'F#4', 'B#4', 'D#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz'),
  9, 10, 1, 4,
  'FM7',
  ARRAY['A3', 'D4', 'G4', 'C#5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz'),
  10, 11, 1, 4,
  'GbM7',
  ARRAY['Bb3', 'Eb4', 'Ab4', 'D5', 'F5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz'),
  11, 12, 1, 4,
  'GM7',
  ARRAY['B3', 'E4', 'A4', 'D#5', 'F#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-quiz'),
  'thva-quiz-b1-7alt-p1',
  'クイズ: D7alt-D#7alt-E7alt-F7alt',
  'Quiz: D7alt-D#7alt-E7alt-F7alt',
  '60秒以内に20問正解。D7alt-D#7alt-E7alt-F7alt の So What / UST ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using D7alt-D#7alt-E7alt-F7alt So What / UST voicings.',
  100, 0, 4, 4, 4, 4,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  60, 'sequential', true, false, 20, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_question_order = EXCLUDED.quiz_question_order,
  quiz_show_notation_in_battle = EXCLUDED.quiz_show_notation_in_battle,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-quiz'),
  0, 1, 1, 4,
  'D7alt',
  ARRAY['C3', 'Gb3', 'Bb3', 'D4', 'F4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-quiz'),
  1, 2, 1, 4,
  'D#7alt',
  ARRAY['C#3', 'G3', 'B3', 'D#4', 'F#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-quiz'),
  2, 3, 1, 4,
  'E7alt',
  ARRAY['D3', 'Ab3', 'C4', 'E4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-quiz'),
  3, 4, 1, 4,
  'F7alt',
  ARRAY['Eb3', 'Bbb3', 'Db4', 'F4', 'Ab4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-voicing'),
  'thva-voicing-b1-7alt-p1',
  '耳コピ: D7alt-D#7alt-E7alt-F7alt',
  'Ear training: D7alt-D#7alt-E7alt-F7alt',
  'BPM100・3ループ以内に進行を弾きましょう。',
  'Play the progression within 3 loops at 100 BPM.',
  100, 0, 4, 4, 4, 3,
  4, 180, 100, 90,
  2, 12, 18, 24, 3, 30, 0, 2,
  'blue_club', true, 'chord_voicing', true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  time_limit_sec = EXCLUDED.time_limit_sec,
  enemy_hp = EXCLUDED.enemy_hp,
  fail_damage = EXCLUDED.fail_damage,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-voicing'),
  0,
  'D7alt-D#7alt-E7alt-F7alt',
  'D7alt-D#7alt-E7alt-F7alt',
  NULL,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3',
  9.6, 57.6, 0,
  2
)
ON CONFLICT (id) DO UPDATE SET
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  updated_at = now();

INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-voicing-ph0'),
  0,
  'D7alt',
  1, 1, 4,
  0, 2.4,
  ARRAY['C3', 'Gb3', 'Bb3', 'D4', 'F4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-voicing-ph0'),
  1,
  'D#7alt',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['C#3', 'G3', 'B3', 'D#4', 'F#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-voicing-ph0'),
  2,
  'E7alt',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['D3', 'Ab3', 'C4', 'E4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-voicing-ph0'),
  3,
  'F7alt',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['Eb3', 'Bbb3', 'Db4', 'F4', 'Ab4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-quiz'),
  'thva-quiz-b1-7alt-p2',
  'クイズ: F#7alt-G7alt-G#7alt-A7alt',
  'Quiz: F#7alt-G7alt-G#7alt-A7alt',
  '60秒以内に20問正解。F#7alt-G7alt-G#7alt-A7alt の So What / UST ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using F#7alt-G7alt-G#7alt-A7alt So What / UST voicings.',
  100, 0, 4, 4, 4, 4,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  60, 'sequential', true, false, 20, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_question_order = EXCLUDED.quiz_question_order,
  quiz_show_notation_in_battle = EXCLUDED.quiz_show_notation_in_battle,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-quiz'),
  0, 1, 1, 4,
  'F#7alt',
  ARRAY['E3', 'Bb3', 'D4', 'F#4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-quiz'),
  1, 2, 1, 4,
  'G7alt',
  ARRAY['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-quiz'),
  2, 3, 1, 4,
  'G#7alt',
  ARRAY['F#3', 'C4', 'E4', 'G#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-quiz'),
  3, 4, 1, 4,
  'A7alt',
  ARRAY['G3', 'Db4', 'F4', 'A4', 'C5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-voicing'),
  'thva-voicing-b1-7alt-p2',
  '耳コピ: F#7alt-G7alt-G#7alt-A7alt',
  'Ear training: F#7alt-G7alt-G#7alt-A7alt',
  'BPM100・3ループ以内に進行を弾きましょう。',
  'Play the progression within 3 loops at 100 BPM.',
  100, 0, 4, 4, 4, 3,
  4, 180, 100, 90,
  2, 12, 18, 24, 3, 30, 0, 2,
  'blue_club', true, 'chord_voicing', true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  time_limit_sec = EXCLUDED.time_limit_sec,
  enemy_hp = EXCLUDED.enemy_hp,
  fail_damage = EXCLUDED.fail_damage,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-voicing'),
  0,
  'F#7alt-G7alt-G#7alt-A7alt',
  'F#7alt-G7alt-G#7alt-A7alt',
  NULL,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3',
  9.6, 57.6, 0,
  4
)
ON CONFLICT (id) DO UPDATE SET
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  updated_at = now();

INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-voicing-ph0'),
  0,
  'F#7alt',
  1, 1, 4,
  0, 2.4,
  ARRAY['E3', 'Bb3', 'D4', 'F#4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-voicing-ph0'),
  1,
  'G7alt',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-voicing-ph0'),
  2,
  'G#7alt',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['F#3', 'C4', 'E4', 'G#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-voicing-ph0'),
  3,
  'A7alt',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['G3', 'Db4', 'F4', 'A4', 'C5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-quiz'),
  'thva-quiz-b1-7alt-p3',
  'クイズ: Bb7alt-B7alt-C7alt-C#7alt',
  'Quiz: Bb7alt-B7alt-C7alt-C#7alt',
  '60秒以内に20問正解。Bb7alt-B7alt-C7alt-C#7alt の So What / UST ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using Bb7alt-B7alt-C7alt-C#7alt So What / UST voicings.',
  100, 0, 4, 4, 4, 4,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  60, 'sequential', true, false, 20, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_question_order = EXCLUDED.quiz_question_order,
  quiz_show_notation_in_battle = EXCLUDED.quiz_show_notation_in_battle,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-quiz'),
  0, 1, 1, 4,
  'Bb7alt',
  ARRAY['Ab3', 'Ebb4', 'Gb4', 'Bb4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-quiz'),
  1, 2, 1, 4,
  'B7alt',
  ARRAY['A3', 'Eb4', 'G4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-quiz'),
  2, 3, 1, 4,
  'C7alt',
  ARRAY['Bb3', 'Fb4', 'Ab4', 'C5', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-quiz'),
  3, 4, 1, 4,
  'C#7alt',
  ARRAY['B3', 'F4', 'A4', 'C#5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-voicing'),
  'thva-voicing-b1-7alt-p3',
  '耳コピ: Bb7alt-B7alt-C7alt-C#7alt',
  'Ear training: Bb7alt-B7alt-C7alt-C#7alt',
  'BPM100・3ループ以内に進行を弾きましょう。',
  'Play the progression within 3 loops at 100 BPM.',
  100, 0, 4, 4, 4, 3,
  4, 180, 100, 90,
  2, 12, 18, 24, 3, 30, 0, 2,
  'blue_club', true, 'chord_voicing', true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  time_limit_sec = EXCLUDED.time_limit_sec,
  enemy_hp = EXCLUDED.enemy_hp,
  fail_damage = EXCLUDED.fail_damage,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-voicing'),
  0,
  'Bb7alt-B7alt-C7alt-C#7alt',
  'Bb7alt-B7alt-C7alt-C#7alt',
  NULL,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3',
  9.6, 57.6, 0,
  -2
)
ON CONFLICT (id) DO UPDATE SET
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  updated_at = now();

INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-voicing-ph0'),
  0,
  'Bb7alt',
  1, 1, 4,
  0, 2.4,
  ARRAY['Ab3', 'Ebb4', 'Gb4', 'Bb4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-voicing-ph0'),
  1,
  'B7alt',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['A3', 'Eb4', 'G4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-voicing-ph0'),
  2,
  'C7alt',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['Bb3', 'Fb4', 'Ab4', 'C5', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-voicing-ph0'),
  3,
  'C#7alt',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['B3', 'F4', 'A4', 'C#5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz'),
  'thva-quiz-b1-7alt-summary',
  'クイズ: 全キーまとめ',
  'Quiz: All keys',
  '60秒以内に20問正解。全キーの So What / UST ヴォイシングをランダム出題。',
  'Answer 20 questions within 60 seconds. Random So What / UST voicings in all keys.',
  100, 0, 4, 4, 4, 4,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  60, 'random', false, false, 20, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_question_order = EXCLUDED.quiz_question_order,
  quiz_show_notation_in_battle = EXCLUDED.quiz_show_notation_in_battle,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz'),
  0, 1, 1, 4,
  'D7alt',
  ARRAY['C3', 'Gb3', 'Bb3', 'D4', 'F4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz'),
  1, 2, 1, 4,
  'D#7alt',
  ARRAY['C#3', 'G3', 'B3', 'D#4', 'F#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz'),
  2, 3, 1, 4,
  'E7alt',
  ARRAY['D3', 'Ab3', 'C4', 'E4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz'),
  3, 4, 1, 4,
  'F7alt',
  ARRAY['Eb3', 'Bbb3', 'Db4', 'F4', 'Ab4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz'),
  4, 5, 1, 4,
  'F#7alt',
  ARRAY['E3', 'Bb3', 'D4', 'F#4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz'),
  5, 6, 1, 4,
  'G7alt',
  ARRAY['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz'),
  6, 7, 1, 4,
  'G#7alt',
  ARRAY['F#3', 'C4', 'E4', 'G#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz'),
  7, 8, 1, 4,
  'A7alt',
  ARRAY['G3', 'Db4', 'F4', 'A4', 'C5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz'),
  8, 9, 1, 4,
  'Bb7alt',
  ARRAY['Ab3', 'Ebb4', 'Gb4', 'Bb4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz'),
  9, 10, 1, 4,
  'B7alt',
  ARRAY['A3', 'Eb4', 'G4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz'),
  10, 11, 1, 4,
  'C7alt',
  ARRAY['Bb3', 'Fb4', 'Ab4', 'C5', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz'),
  11, 12, 1, 4,
  'C#7alt',
  ARRAY['B3', 'F4', 'A4', 'C#5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p1-quiz'),
  'thva-quiz-b1-major-ii-v-i-p1',
  'クイズ: Key of C & F',
  'Quiz: Key of C & F',
  '60秒以内に20問正解。Key of C & F のメジャー II-V-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of C & F major II-V-I voicings.',
  100, 0, 4, 4, 6, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  60, 'sequential', true, false, 20, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_question_order = EXCLUDED.quiz_question_order,
  quiz_show_notation_in_battle = EXCLUDED.quiz_show_notation_in_battle,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p1-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p1-quiz'),
  0, 1, 1, 4,
  'Dm7',
  ARRAY['D3', 'G3', 'C4', 'F4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p1-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p1-quiz'),
  1, 2, 1, 4,
  'G7alt',
  ARRAY['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p1-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p1-quiz'),
  2, 3, 1, 4,
  'CM7',
  ARRAY['E3', 'A3', 'D4', 'G#4', 'B4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p1-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p1-quiz'),
  3, 4, 1, 4,
  'Gm7',
  ARRAY['G3', 'C4', 'F4', 'Bb4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p1-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p1-quiz'),
  4, 5, 1, 4,
  'C7alt',
  ARRAY['Bb3', 'Fb4', 'Ab4', 'C5', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p1-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p1-quiz'),
  5, 6, 1, 4,
  'FM7',
  ARRAY['A3', 'D4', 'G4', 'C#5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p2-quiz'),
  'thva-quiz-b1-major-ii-v-i-p2',
  'クイズ: Key of Bb & Eb',
  'Quiz: Key of Bb & Eb',
  '60秒以内に20問正解。Key of Bb & Eb のメジャー II-V-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of Bb & Eb major II-V-I voicings.',
  100, 0, 4, 4, 6, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  60, 'sequential', true, false, 20, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_question_order = EXCLUDED.quiz_question_order,
  quiz_show_notation_in_battle = EXCLUDED.quiz_show_notation_in_battle,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p2-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p2-quiz'),
  0, 1, 1, 4,
  'Cm7',
  ARRAY['C3', 'F3', 'Bb3', 'Eb4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p2-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p2-quiz'),
  1, 2, 1, 4,
  'F7alt',
  ARRAY['Eb3', 'Bbb3', 'Db4', 'F4', 'Ab4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p2-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p2-quiz'),
  2, 3, 1, 4,
  'BbM7',
  ARRAY['D3', 'G3', 'C4', 'F#4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p2-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p2-quiz'),
  3, 4, 1, 4,
  'Fm7',
  ARRAY['F3', 'Bb3', 'Eb4', 'Ab4', 'C5']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p2-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p2-quiz'),
  4, 5, 1, 4,
  'Bb7alt',
  ARRAY['Ab3', 'Ebb4', 'Gb4', 'Bb4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p2-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p2-quiz'),
  5, 6, 1, 4,
  'EbM7',
  ARRAY['G3', 'C4', 'F4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p3-quiz'),
  'thva-quiz-b1-major-ii-v-i-p3',
  'クイズ: Key of Ab & Db',
  'Quiz: Key of Ab & Db',
  '60秒以内に20問正解。Key of Ab & Db のメジャー II-V-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of Ab & Db major II-V-I voicings.',
  100, 0, 4, 4, 6, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  60, 'sequential', true, false, 20, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_question_order = EXCLUDED.quiz_question_order,
  quiz_show_notation_in_battle = EXCLUDED.quiz_show_notation_in_battle,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p3-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p3-quiz'),
  0, 1, 1, 4,
  'Bbm7',
  ARRAY['Bb2', 'Eb3', 'Ab3', 'Db4', 'F4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p3-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p3-quiz'),
  1, 2, 1, 4,
  'Eb7alt',
  ARRAY['Db3', 'Abb3', 'Cb4', 'Eb4', 'Gb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p3-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p3-quiz'),
  2, 3, 1, 4,
  'AbM7',
  ARRAY['C3', 'F3', 'Bb3', 'E4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p3-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p3-quiz'),
  3, 4, 1, 4,
  'Ebm7',
  ARRAY['Eb3', 'Ab3', 'Db4', 'Gb4', 'Bb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p3-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p3-quiz'),
  4, 5, 1, 4,
  'Ab7alt',
  ARRAY['Gb3', 'Dbb4', 'Fb4', 'Ab4', 'Cb5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p3-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p3-quiz'),
  5, 6, 1, 4,
  'DbM7',
  ARRAY['F3', 'Bb3', 'Eb4', 'A4', 'C5']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p4-quiz'),
  'thva-quiz-b1-major-ii-v-i-p4',
  'クイズ: Key of Gb & B',
  'Quiz: Key of Gb & B',
  '60秒以内に20問正解。Key of Gb & B のメジャー II-V-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of Gb & B major II-V-I voicings.',
  100, 0, 4, 4, 6, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  60, 'sequential', true, false, 20, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_question_order = EXCLUDED.quiz_question_order,
  quiz_show_notation_in_battle = EXCLUDED.quiz_show_notation_in_battle,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p4-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p4-quiz'),
  0, 1, 1, 4,
  'Abm7',
  ARRAY['Ab3', 'Db4', 'Gb4', 'Cb5', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p4-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p4-quiz'),
  1, 2, 1, 4,
  'Db7alt',
  ARRAY['Cb4', 'Gbb4', 'Bbb4', 'Db5', 'Fb5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p4-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p4-quiz'),
  2, 3, 1, 4,
  'GbM7',
  ARRAY['Bb3', 'Eb4', 'Ab4', 'D5', 'F5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p4-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p4-quiz'),
  3, 4, 1, 4,
  'C#m7',
  ARRAY['C#3', 'F#3', 'B3', 'E4', 'G#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p4-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p4-quiz'),
  4, 5, 1, 4,
  'F#7alt',
  ARRAY['E3', 'Bb3', 'D4', 'F#4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p4-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p4-quiz'),
  5, 6, 1, 4,
  'BM7',
  ARRAY['D#3', 'G#3', 'C#4', 'F##4', 'A#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p5-quiz'),
  'thva-quiz-b1-major-ii-v-i-p5',
  'クイズ: Key of E & A',
  'Quiz: Key of E & A',
  '60秒以内に20問正解。Key of E & A のメジャー II-V-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of E & A major II-V-I voicings.',
  100, 0, 4, 4, 6, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  60, 'sequential', true, false, 20, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_question_order = EXCLUDED.quiz_question_order,
  quiz_show_notation_in_battle = EXCLUDED.quiz_show_notation_in_battle,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p5-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p5-quiz'),
  0, 1, 1, 4,
  'F#m7',
  ARRAY['F#3', 'B3', 'E4', 'A4', 'C#5']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p5-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p5-quiz'),
  1, 2, 1, 4,
  'B7alt',
  ARRAY['A3', 'Eb4', 'G4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p5-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p5-quiz'),
  2, 3, 1, 4,
  'EM7',
  ARRAY['G#3', 'C#4', 'F#4', 'B#4', 'D#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p5-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p5-quiz'),
  3, 4, 1, 4,
  'Bm7',
  ARRAY['B2', 'E3', 'A3', 'D4', 'F#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p5-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p5-quiz'),
  4, 5, 1, 4,
  'E7alt',
  ARRAY['D3', 'Ab3', 'C4', 'E4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p5-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p5-quiz'),
  5, 6, 1, 4,
  'AM7',
  ARRAY['C#3', 'F#3', 'B3', 'E#4', 'G#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p6-quiz'),
  'thva-quiz-b1-major-ii-v-i-p6',
  'クイズ: Key of D & G',
  'Quiz: Key of D & G',
  '60秒以内に20問正解。Key of D & G のメジャー II-V-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of D & G major II-V-I voicings.',
  100, 0, 4, 4, 6, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  60, 'sequential', true, false, 20, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_question_order = EXCLUDED.quiz_question_order,
  quiz_show_notation_in_battle = EXCLUDED.quiz_show_notation_in_battle,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p6-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p6-quiz'),
  0, 1, 1, 4,
  'Em7',
  ARRAY['E3', 'A3', 'D4', 'G4', 'B4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p6-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p6-quiz'),
  1, 2, 1, 4,
  'A7alt',
  ARRAY['G3', 'Db4', 'F4', 'A4', 'C5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p6-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p6-quiz'),
  2, 3, 1, 4,
  'DM7',
  ARRAY['F#3', 'B3', 'E4', 'A#4', 'C#5']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p6-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p6-quiz'),
  3, 4, 1, 4,
  'Am7',
  ARRAY['A3', 'D4', 'G4', 'C5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p6-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p6-quiz'),
  4, 5, 1, 4,
  'D7alt',
  ARRAY['C3', 'Gb3', 'Bb3', 'D4', 'F4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p6-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p6-quiz'),
  5, 6, 1, 4,
  'GM7',
  ARRAY['B3', 'E4', 'A4', 'D#5', 'F#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  'thva-quiz-b1-major-ii-v-i-summary',
  'クイズ: 全キーまとめ',
  'Quiz: All keys',
  '60秒以内に20問正解。全キーのメジャー II-V-I を順番に弾きましょう。',
  'Answer 20 questions within 60 seconds. Play major II-V-I in all keys in order.',
  100, 0, 4, 4, 3, 3,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  60, 'sequential', false, false, 20, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_question_order = EXCLUDED.quiz_question_order,
  quiz_show_notation_in_battle = EXCLUDED.quiz_show_notation_in_battle,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  0, 1, 1, 4,
  'Dm7',
  ARRAY['D3', 'G3', 'C4', 'F4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  1, 2, 1, 4,
  'G7alt',
  ARRAY['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  2, 3, 1, 4,
  'CM7',
  ARRAY['E3', 'A3', 'D4', 'G#4', 'B4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  3, 1, 1, 4,
  'Gm7',
  ARRAY['G3', 'C4', 'F4', 'Bb4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  4, 2, 1, 4,
  'C7alt',
  ARRAY['Bb3', 'Fb4', 'Ab4', 'C5', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  5, 3, 1, 4,
  'FM7',
  ARRAY['A3', 'D4', 'G4', 'C#5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  6, 1, 1, 4,
  'Cm7',
  ARRAY['C3', 'F3', 'Bb3', 'Eb4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  7, 2, 1, 4,
  'F7alt',
  ARRAY['Eb3', 'Bbb3', 'Db4', 'F4', 'Ab4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  8, 3, 1, 4,
  'BbM7',
  ARRAY['D3', 'G3', 'C4', 'F#4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  9, 1, 1, 4,
  'Fm7',
  ARRAY['F3', 'Bb3', 'Eb4', 'Ab4', 'C5']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  10, 2, 1, 4,
  'Bb7alt',
  ARRAY['Ab3', 'Ebb4', 'Gb4', 'Bb4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  11, 3, 1, 4,
  'EbM7',
  ARRAY['G3', 'C4', 'F4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  12, 1, 1, 4,
  'Bbm7',
  ARRAY['Bb2', 'Eb3', 'Ab3', 'Db4', 'F4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  13, 2, 1, 4,
  'Eb7alt',
  ARRAY['Db3', 'Abb3', 'Cb4', 'Eb4', 'Gb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-14'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  14, 3, 1, 4,
  'AbM7',
  ARRAY['C3', 'F3', 'Bb3', 'E4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  15, 1, 1, 4,
  'Ebm7',
  ARRAY['Eb3', 'Ab3', 'Db4', 'Gb4', 'Bb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-16'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  16, 2, 1, 4,
  'Ab7alt',
  ARRAY['Gb3', 'Dbb4', 'Fb4', 'Ab4', 'Cb5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-17'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  17, 3, 1, 4,
  'DbM7',
  ARRAY['F3', 'Bb3', 'Eb4', 'A4', 'C5']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-18'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  18, 1, 1, 4,
  'Abm7',
  ARRAY['Ab3', 'Db4', 'Gb4', 'Cb5', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-19'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  19, 2, 1, 4,
  'Db7alt',
  ARRAY['Cb4', 'Gbb4', 'Bbb4', 'Db5', 'Fb5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  20, 3, 1, 4,
  'GbM7',
  ARRAY['Bb3', 'Eb4', 'Ab4', 'D5', 'F5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-21'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  21, 1, 1, 4,
  'C#m7',
  ARRAY['C#3', 'F#3', 'B3', 'E4', 'G#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-22'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  22, 2, 1, 4,
  'F#7alt',
  ARRAY['E3', 'Bb3', 'D4', 'F#4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-23'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  23, 3, 1, 4,
  'BM7',
  ARRAY['D#3', 'G#3', 'C#4', 'F##4', 'A#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-24'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  24, 1, 1, 4,
  'F#m7',
  ARRAY['F#3', 'B3', 'E4', 'A4', 'C#5']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  25, 2, 1, 4,
  'B7alt',
  ARRAY['A3', 'Eb4', 'G4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-26'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  26, 3, 1, 4,
  'EM7',
  ARRAY['G#3', 'C#4', 'F#4', 'B#4', 'D#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-27'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  27, 1, 1, 4,
  'Bm7',
  ARRAY['B2', 'E3', 'A3', 'D4', 'F#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-28'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  28, 2, 1, 4,
  'E7alt',
  ARRAY['D3', 'Ab3', 'C4', 'E4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-29'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  29, 3, 1, 4,
  'AM7',
  ARRAY['C#3', 'F#3', 'B3', 'E#4', 'G#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  30, 1, 1, 4,
  'Em7',
  ARRAY['E3', 'A3', 'D4', 'G4', 'B4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-31'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  31, 2, 1, 4,
  'A7alt',
  ARRAY['G3', 'Db4', 'F4', 'A4', 'C5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-32'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  32, 3, 1, 4,
  'DM7',
  ARRAY['F#3', 'B3', 'E4', 'A#4', 'C#5']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-33'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  33, 1, 1, 4,
  'Am7',
  ARRAY['A3', 'D4', 'G4', 'C5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-34'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  34, 2, 1, 4,
  'D7alt',
  ARRAY['C3', 'Gb3', 'Bb3', 'D4', 'F4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-item-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
  35, 3, 1, 4,
  'GM7',
  ARRAY['B3', 'E4', 'A4', 'D#5', 'F#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'course-two-hand-voicing-advanced'),
  'So What Voicing m7',
  'So What Voicing m7',
  'So What Voicing m7 の So What / UST 5 音ヴォイシングを練習します。',
  'Practice So What / UST five-note voicings for So What Voicing m7.',
  true,
  0, 1,
  'So What / UST ヴォイシング',
  'So What / UST Voicings',
  '[]'::jsonb,
  '①デモ ②3進行×クイズ/耳コピ/サバイバル ③全キーまとめ',
  '① Demo ② 3 progressions × quiz/ear/survival ③ All-keys review'
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
  assignment_description_en = EXCLUDED.assignment_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  survival_tutorial_script_id, ear_training_tutorial_script_id,
  survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-demo-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, false, NULL,
   true, false,
   'thva-demo-b1-m7', NULL,
   NULL,
   'デモ', 'Demo', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Cm7-Fm7-Bbm7-Ebm7', 'Quiz: Cm7-Fm7-Bbm7-Ebm7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7'), NULL, 2, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-voicing'),
   false, false, NULL, NULL,
   NULL,
   '耳コピ: Cm7-Fm7-Bbm7-Ebm7', 'Ear battle: Cm7-Fm7-Bbm7-Ebm7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7'), NULL, 3, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1253, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Cm7-Fm7-Bbm7-Ebm7', 'Survival: Cm7-Fm7-Bbm7-Ebm7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7'), NULL, 4, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: C#m7-F#m7-Bm7-Em7', 'Quiz: C#m7-F#m7-Bm7-Em7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7'), NULL, 5, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-voicing'),
   false, false, NULL, NULL,
   NULL,
   '耳コピ: C#m7-F#m7-Bm7-Em7', 'Ear battle: C#m7-F#m7-Bm7-Em7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7'), NULL, 6, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1254, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: C#m7-F#m7-Bm7-Em7', 'Survival: C#m7-F#m7-Bm7-Em7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7'), NULL, 7, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Gm7-Am7-Dm7-G#m7', 'Quiz: Gm7-Am7-Dm7-G#m7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7'), NULL, 8, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-voicing'),
   false, false, NULL, NULL,
   NULL,
   '耳コピ: Gm7-Am7-Dm7-G#m7', 'Ear battle: Gm7-Am7-Dm7-G#m7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7'), NULL, 9, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1255, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Gm7-Am7-Dm7-G#m7', 'Survival: Gm7-Am7-Dm7-G#m7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7'), NULL, 10, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: 全キーまとめ', 'Quiz: All keys', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7'), NULL, 11, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1256, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: 全キーまとめ', 'Survival: All keys', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  is_survival_tutorial = EXCLUDED.is_survival_tutorial,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  survival_tutorial_script_id = EXCLUDED.survival_tutorial_script_id,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'course-two-hand-voicing-advanced'),
  'So What Voicing M7',
  'So What Voicing M7',
  'So What Voicing M7 の So What / UST 5 音ヴォイシングを練習します。',
  'Practice So What / UST five-note voicings for So What Voicing M7.',
  true,
  1, 1,
  'So What / UST ヴォイシング',
  'So What / UST Voicings',
  '[]'::jsonb,
  '①デモ ②3進行×クイズ/耳コピ/サバイバル ③全キーまとめ',
  '① Demo ② 3 progressions × quiz/ear/survival ③ All-keys review'
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
  assignment_description_en = EXCLUDED.assignment_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  survival_tutorial_script_id, ear_training_tutorial_script_id,
  survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-demo-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, false, NULL,
   true, false,
   'thva-demo-b1-M7', NULL,
   NULL,
   'デモ', 'Demo', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: AbM7-AM7-BbM7-BM7', 'Quiz: AbM7-AM7-BbM7-BM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7'), NULL, 2, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-voicing'),
   false, false, NULL, NULL,
   NULL,
   '耳コピ: AbM7-AM7-BbM7-BM7', 'Ear battle: AbM7-AM7-BbM7-BM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p1-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7'), NULL, 3, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1257, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: AbM7-AM7-BbM7-BM7', 'Survival: AbM7-AM7-BbM7-BM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7'), NULL, 4, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: CM7-DbM7-DM7-EbM7', 'Quiz: CM7-DbM7-DM7-EbM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7'), NULL, 5, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-voicing'),
   false, false, NULL, NULL,
   NULL,
   '耳コピ: CM7-DbM7-DM7-EbM7', 'Ear battle: CM7-DbM7-DM7-EbM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p2-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7'), NULL, 6, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1258, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: CM7-DbM7-DM7-EbM7', 'Survival: CM7-DbM7-DM7-EbM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7'), NULL, 7, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: EM7-FM7-GbM7-GM7', 'Quiz: EM7-FM7-GbM7-GM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7'), NULL, 8, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-voicing'),
   false, false, NULL, NULL,
   NULL,
   '耳コピ: EM7-FM7-GbM7-GM7', 'Ear battle: EM7-FM7-GbM7-GM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-p3-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7'), NULL, 9, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1259, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: EM7-FM7-GbM7-GM7', 'Survival: EM7-FM7-GbM7-GM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7'), NULL, 10, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: 全キーまとめ', 'Quiz: All keys', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7-summary-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-M7'), NULL, 11, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1260, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: 全キーまとめ', 'Survival: All keys', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  is_survival_tutorial = EXCLUDED.is_survival_tutorial,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  survival_tutorial_script_id = EXCLUDED.survival_tutorial_script_id,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'course-two-hand-voicing-advanced'),
  'UST bVI / 7alt',
  'UST bVI / 7alt',
  'UST bVI / 7alt の So What / UST 5 音ヴォイシングを練習します。',
  'Practice So What / UST five-note voicings for UST bVI / 7alt.',
  true,
  2, 1,
  'So What / UST ヴォイシング',
  'So What / UST Voicings',
  '[]'::jsonb,
  '①デモ ②3進行×クイズ/耳コピ/サバイバル ③全キーまとめ',
  '① Demo ② 3 progressions × quiz/ear/survival ③ All-keys review'
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
  assignment_description_en = EXCLUDED.assignment_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  survival_tutorial_script_id, ear_training_tutorial_script_id,
  survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-demo-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, false, NULL,
   true, false,
   'thva-demo-b1-7alt', NULL,
   NULL,
   'デモ', 'Demo', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: D7alt-D#7alt-E7alt-F7alt', 'Quiz: D7alt-D#7alt-E7alt-F7alt', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt'), NULL, 2, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-voicing'),
   false, false, NULL, NULL,
   NULL,
   '耳コピ: D7alt-D#7alt-E7alt-F7alt', 'Ear battle: D7alt-D#7alt-E7alt-F7alt', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt'), NULL, 3, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1261, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: D7alt-D#7alt-E7alt-F7alt', 'Survival: D7alt-D#7alt-E7alt-F7alt', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt'), NULL, 4, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: F#7alt-G7alt-G#7alt-A7alt', 'Quiz: F#7alt-G7alt-G#7alt-A7alt', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt'), NULL, 5, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-voicing'),
   false, false, NULL, NULL,
   NULL,
   '耳コピ: F#7alt-G7alt-G#7alt-A7alt', 'Ear battle: F#7alt-G7alt-G#7alt-A7alt', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt'), NULL, 6, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1262, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: F#7alt-G7alt-G#7alt-A7alt', 'Survival: F#7alt-G7alt-G#7alt-A7alt', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt'), NULL, 7, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Bb7alt-B7alt-C7alt-C#7alt', 'Quiz: Bb7alt-B7alt-C7alt-C#7alt', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt'), NULL, 8, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-voicing'),
   false, false, NULL, NULL,
   NULL,
   '耳コピ: Bb7alt-B7alt-C7alt-C#7alt', 'Ear battle: Bb7alt-B7alt-C7alt-C#7alt', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt'), NULL, 9, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1263, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Bb7alt-B7alt-C7alt-C#7alt', 'Survival: Bb7alt-B7alt-C7alt-C#7alt', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt'), NULL, 10, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: 全キーまとめ', 'Quiz: All keys', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt'), NULL, 11, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1264, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: 全キーまとめ', 'Survival: All keys', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  is_survival_tutorial = EXCLUDED.is_survival_tutorial,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  survival_tutorial_script_id = EXCLUDED.survival_tutorial_script_id,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'course-two-hand-voicing-advanced'),
  'メジャー II-V-I',
  'Major II-V-I',
  'メジャー II-V-I の So What / UST メジャー II-V-I ヴォイシングを練習します。',
  'Practice So What / UST major II-V-I voicings for Major II-V-I.',
  true,
  3, 1,
  'So What / UST ヴォイシング',
  'So What / UST Voicings',
  '[]'::jsonb,
  '①デモ ②2キーずつ×クイズ/サバイバル ③全キーまとめ',
  '① Demo ② 2 keys at a time × quiz/survival ③ All-keys review'
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
  assignment_description_en = EXCLUDED.assignment_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  survival_tutorial_script_id, ear_training_tutorial_script_id,
  survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-demo-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, false, NULL,
   true, false,
   'thva-demo-b1-major-ii-v-i', NULL,
   NULL,
   'デモ', 'Demo', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p1-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p1-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of C & F', 'Quiz: Key of C & F', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p1-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1265, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of C & F', 'Survival: Key of C & F', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p2-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i'), NULL, 3, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p2-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of Bb & Eb', 'Quiz: Key of Bb & Eb', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p2-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i'), NULL, 4, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1266, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of Bb & Eb', 'Survival: Key of Bb & Eb', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p3-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i'), NULL, 5, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p3-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of Ab & Db', 'Quiz: Key of Ab & Db', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p3-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i'), NULL, 6, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1267, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of Ab & Db', 'Survival: Key of Ab & Db', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p4-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i'), NULL, 7, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p4-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of Gb & B', 'Quiz: Key of Gb & B', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p4-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i'), NULL, 8, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1268, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of Gb & B', 'Survival: Key of Gb & B', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p5-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i'), NULL, 9, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p5-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of E & A', 'Quiz: Key of E & A', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p5-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i'), NULL, 10, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1269, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of E & A', 'Survival: Key of E & A', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p6-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i'), NULL, 11, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p6-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of D & G', 'Quiz: Key of D & G', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-p6-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i'), NULL, 12, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1270, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of D & G', 'Survival: Key of D & G', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i'), NULL, 13, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: 全キーまとめ', 'Quiz: All keys', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i-summary-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-major-ii-v-i'), NULL, 14, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1271, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: 全キーまとめ', 'Survival: All keys', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  is_survival_tutorial = EXCLUDED.is_survival_tutorial,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  survival_tutorial_script_id = EXCLUDED.survival_tutorial_script_id,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
