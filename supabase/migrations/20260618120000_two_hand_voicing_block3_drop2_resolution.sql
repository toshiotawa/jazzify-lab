-- 両手ヴォイシングコース(中級) Block 3: Drop 2 Resolution 基礎編
-- 3レッスン × 12 lesson_songs
BEGIN;

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (
  'thvi-b3-demo-b3-m7',
  '両手ヴォイシング デモ (メジャーセブンス)',
  'Two-hand voicing demo (Major sevenths)',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"Drop2 Resolution では、声部の動きを意識しながらヴォイシングを弾くのじゃ。","en":"In Drop 2 Resolution, play voicings while following the voice leading."},{"speaker":"fai","ja":"メジャーセブンス の進行を確認してから、弾いてみよう。","en":"Check the progression first, then try playing."},{"speaker":"jajii","ja":"コード表記は M7・m7・7alt で統一じゃ。焦らず形を覚えるんじゃ。","en":"Chord symbols stay M7, m7, or 7alt. Take your time learning the shapes."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (
  'thvi-b3-demo-b3-mn7',
  '両手ヴォイシング デモ (マイナーセブンス)',
  'Two-hand voicing demo (Minor sevenths)',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"Drop2 Resolution では、声部の動きを意識しながらヴォイシングを弾くのじゃ。","en":"In Drop 2 Resolution, play voicings while following the voice leading."},{"speaker":"fai","ja":"マイナーセブンス の進行を確認してから、弾いてみよう。","en":"Check the progression first, then try playing."},{"speaker":"jajii","ja":"コード表記は M7・m7・7alt で統一じゃ。焦らず形を覚えるんじゃ。","en":"Chord symbols stay M7, m7, or 7alt. Take your time learning the shapes."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (
  'thvi-b3-demo-b3-7alt',
  '両手ヴォイシング デモ (セブンスオルタード)',
  'Two-hand voicing demo (Altered sevenths)',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"Drop2 Resolution では、声部の動きを意識しながらヴォイシングを弾くのじゃ。","en":"In Drop 2 Resolution, play voicings while following the voice leading."},{"speaker":"fai","ja":"セブンスオルタード の進行を確認してから、弾いてみよう。","en":"Check the progression first, then try playing."},{"speaker":"jajii","ja":"コード表記は M7・m7・7alt で統一じゃ。焦らず形を覚えるんじゃ。","en":"Chord symbols stay M7, m7, or 7alt. Take your time learning the shapes."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
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
  'lesson', 1215, 'progression', 'survival',
  '両手ヴォイシング: メジャーセブンス: CM7-FM7-BbM7-EbM7',
  'Two-hand voicing: メジャーセブンス: CM7-FM7-BbM7-EbM7',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"CM7","voicing":[59,64,67,74],"voicing_names":["B3","E4","G4","D5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"CM7","voicing":[57,64,67,72],"voicing_names":["A3","E4","G4","C5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"FM7","voicing":[52,57,60,67],"voicing_names":["E3","A3","C4","G4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"FM7","voicing":[50,57,60,65],"voicing_names":["D3","A3","C4","F4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"BbM7","voicing":[57,62,65,72],"voicing_names":["A3","D4","F4","C5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"BbM7","voicing":[55,62,65,70],"voicing_names":["G3","D4","F4","Bb4"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"EbM7","voicing":[62,67,70,77],"voicing_names":["D4","G4","Bb4","F5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"EbM7","voicing":[60,67,70,75],"voicing_names":["C4","G4","Bb4","Eb5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1216, 'progression', 'survival',
  '両手ヴォイシング: メジャーセブンス: AbM7-DbM7-GbM7-BM7',
  'Two-hand voicing: メジャーセブンス: AbM7-DbM7-GbM7-BM7',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"AbM7","voicing":[55,60,63,70],"voicing_names":["G3","C4","Eb4","Bb4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"AbM7","voicing":[53,60,63,68],"voicing_names":["F3","C4","Eb4","Ab4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"DbM7","voicing":[60,65,68,75],"voicing_names":["C4","F4","Ab4","Eb5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"DbM7","voicing":[58,65,68,73],"voicing_names":["Bb3","F4","Ab4","Db5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"GbM7","voicing":[53,58,61,68],"voicing_names":["F3","Bb3","Db4","Ab4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"GbM7","voicing":[51,58,61,66],"voicing_names":["Eb3","Bb3","Db4","Gb4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"BM7","voicing":[58,63,66,73],"voicing_names":["A#3","D#4","F#4","C#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"BM7","voicing":[56,63,66,71],"voicing_names":["G#3","D#4","F#4","B4"],"key_fifths":5,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1217, 'progression', 'survival',
  '両手ヴォイシング: メジャーセブンス: EM7-AM7-DM7-GM7',
  'Two-hand voicing: メジャーセブンス: EM7-AM7-DM7-GM7',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"EM7","voicing":[63,68,71,78],"voicing_names":["D#4","G#4","B4","F#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"EM7","voicing":[61,68,71,76],"voicing_names":["C#4","G#4","B4","E5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"AM7","voicing":[56,61,64,71],"voicing_names":["G#3","C#4","E4","B4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"AM7","voicing":[54,61,64,69],"voicing_names":["F#3","C#4","E4","A4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"DM7","voicing":[61,66,69,76],"voicing_names":["C#4","F#4","A4","E5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"DM7","voicing":[59,66,69,74],"voicing_names":["B3","F#4","A4","D5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"GM7","voicing":[54,59,62,69],"voicing_names":["F#3","B3","D4","A4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"GM7","voicing":[52,59,62,67],"voicing_names":["E3","B3","D4","G4"],"key_fifths":1,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1218, 'progression', 'survival',
  '両手ヴォイシング: メジャーセブンス: まとめ',
  'Two-hand voicing: メジャーセブンス: まとめ',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"CM7","voicing":[59,64,67,74],"voicing_names":["B3","E4","G4","D5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"CM7","voicing":[57,64,67,72],"voicing_names":["A3","E4","G4","C5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"FM7","voicing":[52,57,60,67],"voicing_names":["E3","A3","C4","G4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"FM7","voicing":[50,57,60,65],"voicing_names":["D3","A3","C4","F4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"BbM7","voicing":[57,62,65,72],"voicing_names":["A3","D4","F4","C5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"BbM7","voicing":[55,62,65,70],"voicing_names":["G3","D4","F4","Bb4"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"EbM7","voicing":[62,67,70,77],"voicing_names":["D4","G4","Bb4","F5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"EbM7","voicing":[60,67,70,75],"voicing_names":["C4","G4","Bb4","Eb5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"AbM7","voicing":[55,60,63,70],"voicing_names":["G3","C4","Eb4","Bb4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"AbM7","voicing":[53,60,63,68],"voicing_names":["F3","C4","Eb4","Ab4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"DbM7","voicing":[60,65,68,75],"voicing_names":["C4","F4","Ab4","Eb5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"DbM7","voicing":[58,65,68,73],"voicing_names":["Bb3","F4","Ab4","Db5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"GbM7","voicing":[53,58,61,68],"voicing_names":["F3","Bb3","Db4","Ab4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"GbM7","voicing":[51,58,61,66],"voicing_names":["Eb3","Bb3","Db4","Gb4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"BM7","voicing":[58,63,66,73],"voicing_names":["A#3","D#4","F#4","C#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"BM7","voicing":[56,63,66,71],"voicing_names":["G#3","D#4","F#4","B4"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"EM7","voicing":[63,68,71,78],"voicing_names":["D#4","G#4","B4","F#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"EM7","voicing":[61,68,71,76],"voicing_names":["C#4","G#4","B4","E5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"AM7","voicing":[56,61,64,71],"voicing_names":["G#3","C#4","E4","B4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"AM7","voicing":[54,61,64,69],"voicing_names":["F#3","C#4","E4","A4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"DM7","voicing":[61,66,69,76],"voicing_names":["C#4","F#4","A4","E5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"DM7","voicing":[59,66,69,74],"voicing_names":["B3","F#4","A4","D5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"GM7","voicing":[54,59,62,69],"voicing_names":["F#3","B3","D4","A4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"GM7","voicing":[52,59,62,67],"voicing_names":["E3","B3","D4","G4"],"key_fifths":1,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1219, 'progression', 'survival',
  '両手ヴォイシング: マイナーセブンス: Am7-Dm7-Gm7-Cm7',
  'Two-hand voicing: マイナーセブンス: Am7-Dm7-Gm7-Cm7',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  'm7', false, NULL,
  '[{"name":"Am7","voicing":[59,64,67,74],"voicing_names":["B3","E4","G4","D5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Am7","voicing":[57,64,67,72],"voicing_names":["A3","E4","G4","C5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Dm7","voicing":[52,57,60,67],"voicing_names":["E3","A3","C4","G4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Dm7","voicing":[50,57,60,65],"voicing_names":["D3","A3","C4","F4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Gm7","voicing":[57,62,65,72],"voicing_names":["A3","D4","F4","C5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"Gm7","voicing":[55,62,65,70],"voicing_names":["G3","D4","F4","Bb4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"Cm7","voicing":[62,67,70,77],"voicing_names":["D4","G4","Bb4","F5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Cm7","voicing":[60,67,70,75],"voicing_names":["C4","G4","Bb4","Eb5"],"key_fifths":0,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1220, 'progression', 'survival',
  '両手ヴォイシング: マイナーセブンス: Fm7-Bbm7-Ebm7-Abm7',
  'Two-hand voicing: マイナーセブンス: Fm7-Bbm7-Ebm7-Abm7',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  'm7', false, NULL,
  '[{"name":"Fm7","voicing":[55,60,63,70],"voicing_names":["G3","C4","Eb4","Bb4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Fm7","voicing":[53,60,63,68],"voicing_names":["F3","C4","Eb4","Ab4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Bbm7","voicing":[60,65,68,75],"voicing_names":["C4","F4","Ab4","Eb5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Bbm7","voicing":[58,65,68,73],"voicing_names":["Bb3","F4","Ab4","Db5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Ebm7","voicing":[53,58,61,68],"voicing_names":["F3","Bb3","Db4","Ab4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Ebm7","voicing":[51,58,61,66],"voicing_names":["Eb3","Bb3","Db4","Gb4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Abm7","voicing":[58,63,66,73],"voicing_names":["Bb3","Eb4","Gb4","Db5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Abm7","voicing":[56,63,66,71],"voicing_names":["Ab3","Eb4","Gb4","Cb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1221, 'progression', 'survival',
  '両手ヴォイシング: マイナーセブンス: C#m7-F#m7-Bm7-Em7',
  'Two-hand voicing: マイナーセブンス: C#m7-F#m7-Bm7-Em7',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  'm7', false, NULL,
  '[{"name":"C#m7","voicing":[63,68,71,78],"voicing_names":["D#4","G#4","B4","F#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"C#m7","voicing":[61,68,71,76],"voicing_names":["C#4","G#4","B4","E5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"F#m7","voicing":[56,61,64,71],"voicing_names":["G#3","C#4","E4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"F#m7","voicing":[54,61,64,69],"voicing_names":["F#3","C#4","E4","A4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"Bm7","voicing":[61,66,69,76],"voicing_names":["C#4","F#4","A4","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Bm7","voicing":[59,66,69,74],"voicing_names":["B3","F#4","A4","D5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Em7","voicing":[54,59,62,69],"voicing_names":["F#3","B3","D4","A4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Em7","voicing":[52,59,62,67],"voicing_names":["E3","B3","D4","G4"],"key_fifths":2,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1222, 'progression', 'survival',
  '両手ヴォイシング: マイナーセブンス: まとめ',
  'Two-hand voicing: マイナーセブンス: まとめ',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  'm7', false, NULL,
  '[{"name":"Am7","voicing":[59,64,67,74],"voicing_names":["B3","E4","G4","D5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Am7","voicing":[57,64,67,72],"voicing_names":["A3","E4","G4","C5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Dm7","voicing":[52,57,60,67],"voicing_names":["E3","A3","C4","G4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Dm7","voicing":[50,57,60,65],"voicing_names":["D3","A3","C4","F4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Gm7","voicing":[57,62,65,72],"voicing_names":["A3","D4","F4","C5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"Gm7","voicing":[55,62,65,70],"voicing_names":["G3","D4","F4","Bb4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"Cm7","voicing":[62,67,70,77],"voicing_names":["D4","G4","Bb4","F5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Cm7","voicing":[60,67,70,75],"voicing_names":["C4","G4","Bb4","Eb5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Fm7","voicing":[55,60,63,70],"voicing_names":["G3","C4","Eb4","Bb4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Fm7","voicing":[53,60,63,68],"voicing_names":["F3","C4","Eb4","Ab4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Bbm7","voicing":[60,65,68,75],"voicing_names":["C4","F4","Ab4","Eb5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Bbm7","voicing":[58,65,68,73],"voicing_names":["Bb3","F4","Ab4","Db5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Ebm7","voicing":[53,58,61,68],"voicing_names":["F3","Bb3","Db4","Ab4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Ebm7","voicing":[51,58,61,66],"voicing_names":["Eb3","Bb3","Db4","Gb4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Abm7","voicing":[58,63,66,73],"voicing_names":["Bb3","Eb4","Gb4","Db5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Abm7","voicing":[56,63,66,71],"voicing_names":["Ab3","Eb4","Gb4","Cb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"C#m7","voicing":[63,68,71,78],"voicing_names":["D#4","G#4","B4","F#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"C#m7","voicing":[61,68,71,76],"voicing_names":["C#4","G#4","B4","E5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"F#m7","voicing":[56,61,64,71],"voicing_names":["G#3","C#4","E4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"F#m7","voicing":[54,61,64,69],"voicing_names":["F#3","C#4","E4","A4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"Bm7","voicing":[61,66,69,76],"voicing_names":["C#4","F#4","A4","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Bm7","voicing":[59,66,69,74],"voicing_names":["B3","F#4","A4","D5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Em7","voicing":[54,59,62,69],"voicing_names":["F#3","B3","D4","A4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Em7","voicing":[52,59,62,67],"voicing_names":["E3","B3","D4","G4"],"key_fifths":2,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1223, 'progression', 'survival',
  '両手ヴォイシング: セブンスオルタード: G7alt-C7alt-F7alt-Bb7alt',
  'Two-hand voicing: セブンスオルタード: G7alt-C7alt-F7alt-Bb7alt',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  '7_b9_b13', false, NULL,
  '[{"name":"G7alt","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"G7alt","voicing":[53,59,63,68],"voicing_names":["F3","Cb4","Eb4","Ab4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"C7alt","voicing":[60,64,68,75],"voicing_names":["C4","Fb4","Ab4","Eb5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"C7alt","voicing":[58,64,68,73],"voicing_names":["Bb3","Fb4","Ab4","Db5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"F7alt","voicing":[53,57,61,68],"voicing_names":["F3","Bbb3","Db4","Ab4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"F7alt","voicing":[51,57,61,66],"voicing_names":["Eb3","Bbb3","Db4","Gb4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Bb7alt","voicing":[58,62,66,73],"voicing_names":["Bb3","Ebb4","Gb4","Db5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Bb7alt","voicing":[56,62,66,71],"voicing_names":["Ab3","Ebb4","Gb4","Cb5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1224, 'progression', 'survival',
  '両手ヴォイシング: セブンスオルタード: Eb7alt-Ab7alt-Db7alt-F#7alt',
  'Two-hand voicing: セブンスオルタード: Eb7alt-Ab7alt-Db7alt-F#7alt',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  '7_b9_b13', false, NULL,
  '[{"name":"Eb7alt","voicing":[63,68,70,78],"voicing_names":["Eb4","Ab4","Bb4","Gb5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Eb7alt","voicing":[61,68,70,76],"voicing_names":["Db4","Ab4","Bb4","Fb5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Ab7alt","voicing":[56,61,65,72],"voicing_names":["Ab3","Db4","F4","C5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Ab7alt","voicing":[55,61,65,70],"voicing_names":["G3","Db4","F4","Bb4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Db7alt","voicing":[61,66,70,77],"voicing_names":["Db4","Gb4","Bb4","F5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Db7alt","voicing":[60,66,70,75],"voicing_names":["C4","Gb4","Bb4","Eb5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"F#7alt","voicing":[54,58,62,69],"voicing_names":["F#3","Bb3","D4","A4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"F#7alt","voicing":[52,58,62,67],"voicing_names":["E3","Bb3","D4","G4"],"key_fifths":4,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1225, 'progression', 'survival',
  '両手ヴォイシング: セブンスオルタード: B7alt-E7alt-A7alt-D7alt',
  'Two-hand voicing: セブンスオルタード: B7alt-E7alt-A7alt-D7alt',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  '7_b9_b13', false, NULL,
  '[{"name":"B7alt","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"B7alt","voicing":[57,63,67,72],"voicing_names":["A3","Eb4","G4","C5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"E7alt","voicing":[52,56,60,67],"voicing_names":["E3","Ab3","C4","G4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"E7alt","voicing":[50,56,60,65],"voicing_names":["D3","Ab3","C4","F4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"A7alt","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"A7alt","voicing":[55,61,65,70],"voicing_names":["G3","Db4","F4","Bb4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"D7alt","voicing":[62,66,70,77],"voicing_names":["D4","Gb4","Bb4","F5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"D7alt","voicing":[60,66,70,75],"voicing_names":["C4","Gb4","Bb4","Eb5"],"key_fifths":2,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1226, 'progression', 'survival',
  '両手ヴォイシング: セブンスオルタード: まとめ',
  'Two-hand voicing: セブンスオルタード: まとめ',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  '7_b9_b13', false, NULL,
  '[{"name":"G7alt","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"G7alt","voicing":[53,59,63,68],"voicing_names":["F3","Cb4","Eb4","Ab4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"C7alt","voicing":[60,64,68,75],"voicing_names":["C4","Fb4","Ab4","Eb5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"C7alt","voicing":[58,64,68,73],"voicing_names":["Bb3","Fb4","Ab4","Db5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"F7alt","voicing":[53,57,61,68],"voicing_names":["F3","Bbb3","Db4","Ab4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"F7alt","voicing":[51,57,61,66],"voicing_names":["Eb3","Bbb3","Db4","Gb4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Bb7alt","voicing":[58,62,66,73],"voicing_names":["Bb3","Ebb4","Gb4","Db5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Bb7alt","voicing":[56,62,66,71],"voicing_names":["Ab3","Ebb4","Gb4","Cb5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Eb7alt","voicing":[63,68,70,78],"voicing_names":["Eb4","Ab4","Bb4","Gb5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Eb7alt","voicing":[61,68,70,76],"voicing_names":["Db4","Ab4","Bb4","Fb5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Ab7alt","voicing":[56,61,65,72],"voicing_names":["Ab3","Db4","F4","C5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Ab7alt","voicing":[55,61,65,70],"voicing_names":["G3","Db4","F4","Bb4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Db7alt","voicing":[61,66,70,77],"voicing_names":["Db4","Gb4","Bb4","F5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Db7alt","voicing":[60,66,70,75],"voicing_names":["C4","Gb4","Bb4","Eb5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"F#7alt","voicing":[54,58,62,69],"voicing_names":["F#3","Bb3","D4","A4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"F#7alt","voicing":[52,58,62,67],"voicing_names":["E3","Bb3","D4","G4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"B7alt","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"B7alt","voicing":[57,63,67,72],"voicing_names":["A3","Eb4","G4","C5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"E7alt","voicing":[52,56,60,67],"voicing_names":["E3","Ab3","C4","G4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"E7alt","voicing":[50,56,60,65],"voicing_names":["D3","Ab3","C4","F4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"A7alt","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"A7alt","voicing":[55,61,65,70],"voicing_names":["G3","Db4","F4","Bb4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"D7alt","voicing":[62,66,70,77],"voicing_names":["D4","Gb4","Bb4","F5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"D7alt","voicing":[60,66,70,75],"voicing_names":["C4","Gb4","Bb4","Eb5"],"key_fifths":2,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-quiz'),
  'thvi-b3-quiz-b3-m7-p1',
  'クイズ: CM7-FM7-BbM7-EbM7',
  'Quiz: CM7-FM7-BbM7-EbM7',
  '60秒以内に20問正解。CM7-FM7-BbM7-EbM7 の Drop2 Resolution を弾きましょう。',
  'Answer 20 questions within 60 seconds using CM7-FM7-BbM7-EbM7 Drop 2 Resolution voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-quiz'),
  0, 1, 1, 4,
  'CM7',
  ARRAY['B3', 'E4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-quiz'),
  1, 1, 3, 4,
  'CM7',
  ARRAY['A3', 'E4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-quiz'),
  2, 2, 1, 4,
  'FM7',
  ARRAY['E3', 'A3', 'C4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-quiz'),
  3, 2, 3, 4,
  'FM7',
  ARRAY['D3', 'A3', 'C4', 'F4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-quiz'),
  4, 3, 1, 4,
  'BbM7',
  ARRAY['A3', 'D4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-quiz'),
  5, 3, 3, 4,
  'BbM7',
  ARRAY['G3', 'D4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-quiz'),
  6, 4, 1, 4,
  'EbM7',
  ARRAY['D4', 'G4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-quiz'),
  7, 4, 3, 4,
  'EbM7',
  ARRAY['C4', 'G4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing'),
  'thvi-b3-voicing-b3-m7-p1',
  '耳コピ: CM7-FM7-BbM7-EbM7',
  'Ear training: CM7-FM7-BbM7-EbM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing'),
  0,
  'CM7-FM7-BbM7-EbM7',
  'CM7-FM7-BbM7-EbM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing-ph0'),
  0,
  'CM7',
  1, 1, 4,
  0, 2.4,
  ARRAY['B3', 'E4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing-ph0'),
  1,
  'CM7',
  1, 3, 4,
  0, 2.4,
  ARRAY['A3', 'E4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing-ph0'),
  2,
  'FM7',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['E3', 'A3', 'C4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing-ph0'),
  3,
  'FM7',
  2, 3, 4,
  2.4, 4.8,
  ARRAY['D3', 'A3', 'C4', 'F4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing-ph0-c4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing-ph0'),
  4,
  'BbM7',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['A3', 'D4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing-ph0-c5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing-ph0'),
  5,
  'BbM7',
  3, 3, 4,
  4.8, 7.199999999999999,
  ARRAY['G3', 'D4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing-ph0-c6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing-ph0'),
  6,
  'EbM7',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['D4', 'G4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing-ph0-c7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing-ph0'),
  7,
  'EbM7',
  4, 3, 4,
  7.199999999999999, 9.6,
  ARRAY['C4', 'G4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-quiz'),
  'thvi-b3-quiz-b3-m7-p2',
  'クイズ: AbM7-DbM7-GbM7-BM7',
  'Quiz: AbM7-DbM7-GbM7-BM7',
  '60秒以内に20問正解。AbM7-DbM7-GbM7-BM7 の Drop2 Resolution を弾きましょう。',
  'Answer 20 questions within 60 seconds using AbM7-DbM7-GbM7-BM7 Drop 2 Resolution voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-quiz'),
  0, 1, 1, 4,
  'AbM7',
  ARRAY['G3', 'C4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-quiz'),
  1, 1, 3, 4,
  'AbM7',
  ARRAY['F3', 'C4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-quiz'),
  2, 2, 1, 4,
  'DbM7',
  ARRAY['C4', 'F4', 'Ab4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-quiz'),
  3, 2, 3, 4,
  'DbM7',
  ARRAY['Bb3', 'F4', 'Ab4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-quiz'),
  4, 3, 1, 4,
  'GbM7',
  ARRAY['F3', 'Bb3', 'Db4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-quiz'),
  5, 3, 3, 4,
  'GbM7',
  ARRAY['Eb3', 'Bb3', 'Db4', 'Gb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-quiz'),
  6, 4, 1, 4,
  'BM7',
  ARRAY['A#3', 'D#4', 'F#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-quiz'),
  7, 4, 3, 4,
  'BM7',
  ARRAY['G#3', 'D#4', 'F#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing'),
  'thvi-b3-voicing-b3-m7-p2',
  '耳コピ: AbM7-DbM7-GbM7-BM7',
  'Ear training: AbM7-DbM7-GbM7-BM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing'),
  0,
  'AbM7-DbM7-GbM7-BM7',
  'AbM7-DbM7-GbM7-BM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing-ph0'),
  0,
  'AbM7',
  1, 1, 4,
  0, 2.4,
  ARRAY['G3', 'C4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing-ph0'),
  1,
  'AbM7',
  1, 3, 4,
  0, 2.4,
  ARRAY['F3', 'C4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing-ph0'),
  2,
  'DbM7',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['C4', 'F4', 'Ab4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing-ph0'),
  3,
  'DbM7',
  2, 3, 4,
  2.4, 4.8,
  ARRAY['Bb3', 'F4', 'Ab4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing-ph0-c4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing-ph0'),
  4,
  'GbM7',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['F3', 'Bb3', 'Db4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing-ph0-c5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing-ph0'),
  5,
  'GbM7',
  3, 3, 4,
  4.8, 7.199999999999999,
  ARRAY['Eb3', 'Bb3', 'Db4', 'Gb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing-ph0-c6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing-ph0'),
  6,
  'BM7',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['A#3', 'D#4', 'F#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing-ph0-c7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing-ph0'),
  7,
  'BM7',
  4, 3, 4,
  7.199999999999999, 9.6,
  ARRAY['G#3', 'D#4', 'F#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-quiz'),
  'thvi-b3-quiz-b3-m7-p3',
  'クイズ: EM7-AM7-DM7-GM7',
  'Quiz: EM7-AM7-DM7-GM7',
  '60秒以内に20問正解。EM7-AM7-DM7-GM7 の Drop2 Resolution を弾きましょう。',
  'Answer 20 questions within 60 seconds using EM7-AM7-DM7-GM7 Drop 2 Resolution voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-quiz'),
  0, 1, 1, 4,
  'EM7',
  ARRAY['D#4', 'G#4', 'B4', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-quiz'),
  1, 1, 3, 4,
  'EM7',
  ARRAY['C#4', 'G#4', 'B4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-quiz'),
  2, 2, 1, 4,
  'AM7',
  ARRAY['G#3', 'C#4', 'E4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-quiz'),
  3, 2, 3, 4,
  'AM7',
  ARRAY['F#3', 'C#4', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-quiz'),
  4, 3, 1, 4,
  'DM7',
  ARRAY['C#4', 'F#4', 'A4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-quiz'),
  5, 3, 3, 4,
  'DM7',
  ARRAY['B3', 'F#4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-quiz'),
  6, 4, 1, 4,
  'GM7',
  ARRAY['F#3', 'B3', 'D4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-quiz'),
  7, 4, 3, 4,
  'GM7',
  ARRAY['E3', 'B3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing'),
  'thvi-b3-voicing-b3-m7-p3',
  '耳コピ: EM7-AM7-DM7-GM7',
  'Ear training: EM7-AM7-DM7-GM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing'),
  0,
  'EM7-AM7-DM7-GM7',
  'EM7-AM7-DM7-GM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing-ph0'),
  0,
  'EM7',
  1, 1, 4,
  0, 2.4,
  ARRAY['D#4', 'G#4', 'B4', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing-ph0'),
  1,
  'EM7',
  1, 3, 4,
  0, 2.4,
  ARRAY['C#4', 'G#4', 'B4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing-ph0'),
  2,
  'AM7',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['G#3', 'C#4', 'E4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing-ph0'),
  3,
  'AM7',
  2, 3, 4,
  2.4, 4.8,
  ARRAY['F#3', 'C#4', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing-ph0-c4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing-ph0'),
  4,
  'DM7',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['C#4', 'F#4', 'A4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing-ph0-c5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing-ph0'),
  5,
  'DM7',
  3, 3, 4,
  4.8, 7.199999999999999,
  ARRAY['B3', 'F#4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing-ph0-c6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing-ph0'),
  6,
  'GM7',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['F#3', 'B3', 'D4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing-ph0-c7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing-ph0'),
  7,
  'GM7',
  4, 3, 4,
  7.199999999999999, 9.6,
  ARRAY['E3', 'B3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  'thvi-b3-quiz-b3-m7-summary',
  'クイズ: 全キーまとめ',
  'Quiz: All keys',
  '60秒以内に20問正解。全キーの Drop2 Resolution をランダム出題。',
  'Answer 20 questions within 60 seconds. Random Drop 2 Resolution in all keys.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  0, 1, 1, 4,
  'CM7',
  ARRAY['B3', 'E4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  1, 1, 3, 4,
  'CM7',
  ARRAY['A3', 'E4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  2, 2, 1, 4,
  'FM7',
  ARRAY['E3', 'A3', 'C4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  3, 2, 3, 4,
  'FM7',
  ARRAY['D3', 'A3', 'C4', 'F4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  4, 3, 1, 4,
  'BbM7',
  ARRAY['A3', 'D4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  5, 3, 3, 4,
  'BbM7',
  ARRAY['G3', 'D4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  6, 4, 1, 4,
  'EbM7',
  ARRAY['D4', 'G4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  7, 4, 3, 4,
  'EbM7',
  ARRAY['C4', 'G4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  8, 5, 1, 4,
  'AbM7',
  ARRAY['G3', 'C4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  9, 5, 3, 4,
  'AbM7',
  ARRAY['F3', 'C4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  10, 6, 1, 4,
  'DbM7',
  ARRAY['C4', 'F4', 'Ab4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  11, 6, 3, 4,
  'DbM7',
  ARRAY['Bb3', 'F4', 'Ab4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  12, 7, 1, 4,
  'GbM7',
  ARRAY['F3', 'Bb3', 'Db4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  13, 7, 3, 4,
  'GbM7',
  ARRAY['Eb3', 'Bb3', 'Db4', 'Gb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-14'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  14, 8, 1, 4,
  'BM7',
  ARRAY['A#3', 'D#4', 'F#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  15, 8, 3, 4,
  'BM7',
  ARRAY['G#3', 'D#4', 'F#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-16'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  16, 9, 1, 4,
  'EM7',
  ARRAY['D#4', 'G#4', 'B4', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-17'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  17, 9, 3, 4,
  'EM7',
  ARRAY['C#4', 'G#4', 'B4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-18'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  18, 10, 1, 4,
  'AM7',
  ARRAY['G#3', 'C#4', 'E4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-19'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  19, 10, 3, 4,
  'AM7',
  ARRAY['F#3', 'C#4', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  20, 11, 1, 4,
  'DM7',
  ARRAY['C#4', 'F#4', 'A4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-21'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  21, 11, 3, 4,
  'DM7',
  ARRAY['B3', 'F#4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-22'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  22, 12, 1, 4,
  'GM7',
  ARRAY['F#3', 'B3', 'D4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-item-23'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
  23, 12, 3, 4,
  'GM7',
  ARRAY['E3', 'B3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-quiz'),
  'thvi-b3-quiz-b3-mn7-p1',
  'クイズ: Am7-Dm7-Gm7-Cm7',
  'Quiz: Am7-Dm7-Gm7-Cm7',
  '60秒以内に20問正解。Am7-Dm7-Gm7-Cm7 の Drop2 Resolution を弾きましょう。',
  'Answer 20 questions within 60 seconds using Am7-Dm7-Gm7-Cm7 Drop 2 Resolution voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-quiz'),
  0, 1, 1, 4,
  'Am7',
  ARRAY['B3', 'E4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-quiz'),
  1, 1, 3, 4,
  'Am7',
  ARRAY['A3', 'E4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-quiz'),
  2, 2, 1, 4,
  'Dm7',
  ARRAY['E3', 'A3', 'C4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-quiz'),
  3, 2, 3, 4,
  'Dm7',
  ARRAY['D3', 'A3', 'C4', 'F4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-quiz'),
  4, 3, 1, 4,
  'Gm7',
  ARRAY['A3', 'D4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-quiz'),
  5, 3, 3, 4,
  'Gm7',
  ARRAY['G3', 'D4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-quiz'),
  6, 4, 1, 4,
  'Cm7',
  ARRAY['D4', 'G4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-quiz'),
  7, 4, 3, 4,
  'Cm7',
  ARRAY['C4', 'G4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing'),
  'thvi-b3-voicing-b3-mn7-p1',
  '耳コピ: Am7-Dm7-Gm7-Cm7',
  'Ear training: Am7-Dm7-Gm7-Cm7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing'),
  0,
  'Am7-Dm7-Gm7-Cm7',
  'Am7-Dm7-Gm7-Cm7',
  NULL,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3',
  9.6, 57.6, 0,
  3
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing-ph0'),
  0,
  'Am7',
  1, 1, 4,
  0, 2.4,
  ARRAY['B3', 'E4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing-ph0'),
  1,
  'Am7',
  1, 3, 4,
  0, 2.4,
  ARRAY['A3', 'E4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing-ph0'),
  2,
  'Dm7',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['E3', 'A3', 'C4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing-ph0'),
  3,
  'Dm7',
  2, 3, 4,
  2.4, 4.8,
  ARRAY['D3', 'A3', 'C4', 'F4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing-ph0-c4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing-ph0'),
  4,
  'Gm7',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['A3', 'D4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing-ph0-c5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing-ph0'),
  5,
  'Gm7',
  3, 3, 4,
  4.8, 7.199999999999999,
  ARRAY['G3', 'D4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing-ph0-c6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing-ph0'),
  6,
  'Cm7',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['D4', 'G4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing-ph0-c7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing-ph0'),
  7,
  'Cm7',
  4, 3, 4,
  7.199999999999999, 9.6,
  ARRAY['C4', 'G4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-quiz'),
  'thvi-b3-quiz-b3-mn7-p2',
  'クイズ: Fm7-Bbm7-Ebm7-Abm7',
  'Quiz: Fm7-Bbm7-Ebm7-Abm7',
  '60秒以内に20問正解。Fm7-Bbm7-Ebm7-Abm7 の Drop2 Resolution を弾きましょう。',
  'Answer 20 questions within 60 seconds using Fm7-Bbm7-Ebm7-Abm7 Drop 2 Resolution voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-quiz'),
  0, 1, 1, 4,
  'Fm7',
  ARRAY['G3', 'C4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-quiz'),
  1, 1, 3, 4,
  'Fm7',
  ARRAY['F3', 'C4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-quiz'),
  2, 2, 1, 4,
  'Bbm7',
  ARRAY['C4', 'F4', 'Ab4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-quiz'),
  3, 2, 3, 4,
  'Bbm7',
  ARRAY['Bb3', 'F4', 'Ab4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-quiz'),
  4, 3, 1, 4,
  'Ebm7',
  ARRAY['F3', 'Bb3', 'Db4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-quiz'),
  5, 3, 3, 4,
  'Ebm7',
  ARRAY['Eb3', 'Bb3', 'Db4', 'Gb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-quiz'),
  6, 4, 1, 4,
  'Abm7',
  ARRAY['Bb3', 'Eb4', 'Gb4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-quiz'),
  7, 4, 3, 4,
  'Abm7',
  ARRAY['Ab3', 'Eb4', 'Gb4', 'Cb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing'),
  'thvi-b3-voicing-b3-mn7-p2',
  '耳コピ: Fm7-Bbm7-Ebm7-Abm7',
  'Ear training: Fm7-Bbm7-Ebm7-Abm7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing'),
  0,
  'Fm7-Bbm7-Ebm7-Abm7',
  'Fm7-Bbm7-Ebm7-Abm7',
  NULL,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3',
  9.6, 57.6, 0,
  -1
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing-ph0'),
  0,
  'Fm7',
  1, 1, 4,
  0, 2.4,
  ARRAY['G3', 'C4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing-ph0'),
  1,
  'Fm7',
  1, 3, 4,
  0, 2.4,
  ARRAY['F3', 'C4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing-ph0'),
  2,
  'Bbm7',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['C4', 'F4', 'Ab4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing-ph0'),
  3,
  'Bbm7',
  2, 3, 4,
  2.4, 4.8,
  ARRAY['Bb3', 'F4', 'Ab4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing-ph0-c4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing-ph0'),
  4,
  'Ebm7',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['F3', 'Bb3', 'Db4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing-ph0-c5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing-ph0'),
  5,
  'Ebm7',
  3, 3, 4,
  4.8, 7.199999999999999,
  ARRAY['Eb3', 'Bb3', 'Db4', 'Gb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing-ph0-c6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing-ph0'),
  6,
  'Abm7',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['Bb3', 'Eb4', 'Gb4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing-ph0-c7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing-ph0'),
  7,
  'Abm7',
  4, 3, 4,
  7.199999999999999, 9.6,
  ARRAY['Ab3', 'Eb4', 'Gb4', 'Cb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-quiz'),
  'thvi-b3-quiz-b3-mn7-p3',
  'クイズ: C#m7-F#m7-Bm7-Em7',
  'Quiz: C#m7-F#m7-Bm7-Em7',
  '60秒以内に20問正解。C#m7-F#m7-Bm7-Em7 の Drop2 Resolution を弾きましょう。',
  'Answer 20 questions within 60 seconds using C#m7-F#m7-Bm7-Em7 Drop 2 Resolution voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-quiz'),
  0, 1, 1, 4,
  'C#m7',
  ARRAY['D#4', 'G#4', 'B4', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-quiz'),
  1, 1, 3, 4,
  'C#m7',
  ARRAY['C#4', 'G#4', 'B4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-quiz'),
  2, 2, 1, 4,
  'F#m7',
  ARRAY['G#3', 'C#4', 'E4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-quiz'),
  3, 2, 3, 4,
  'F#m7',
  ARRAY['F#3', 'C#4', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-quiz'),
  4, 3, 1, 4,
  'Bm7',
  ARRAY['C#4', 'F#4', 'A4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-quiz'),
  5, 3, 3, 4,
  'Bm7',
  ARRAY['B3', 'F#4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-quiz'),
  6, 4, 1, 4,
  'Em7',
  ARRAY['F#3', 'B3', 'D4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-quiz'),
  7, 4, 3, 4,
  'Em7',
  ARRAY['E3', 'B3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing'),
  'thvi-b3-voicing-b3-mn7-p3',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing'),
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing-ph0'),
  0,
  'C#m7',
  1, 1, 4,
  0, 2.4,
  ARRAY['D#4', 'G#4', 'B4', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing-ph0'),
  1,
  'C#m7',
  1, 3, 4,
  0, 2.4,
  ARRAY['C#4', 'G#4', 'B4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing-ph0'),
  2,
  'F#m7',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['G#3', 'C#4', 'E4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing-ph0'),
  3,
  'F#m7',
  2, 3, 4,
  2.4, 4.8,
  ARRAY['F#3', 'C#4', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing-ph0-c4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing-ph0'),
  4,
  'Bm7',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['C#4', 'F#4', 'A4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing-ph0-c5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing-ph0'),
  5,
  'Bm7',
  3, 3, 4,
  4.8, 7.199999999999999,
  ARRAY['B3', 'F#4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing-ph0-c6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing-ph0'),
  6,
  'Em7',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['F#3', 'B3', 'D4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing-ph0-c7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing-ph0'),
  7,
  'Em7',
  4, 3, 4,
  7.199999999999999, 9.6,
  ARRAY['E3', 'B3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  'thvi-b3-quiz-b3-mn7-summary',
  'クイズ: 全キーまとめ',
  'Quiz: All keys',
  '60秒以内に20問正解。全キーの Drop2 Resolution をランダム出題。',
  'Answer 20 questions within 60 seconds. Random Drop 2 Resolution in all keys.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  0, 1, 1, 4,
  'Am7',
  ARRAY['B3', 'E4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  1, 1, 3, 4,
  'Am7',
  ARRAY['A3', 'E4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  2, 2, 1, 4,
  'Dm7',
  ARRAY['E3', 'A3', 'C4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  3, 2, 3, 4,
  'Dm7',
  ARRAY['D3', 'A3', 'C4', 'F4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  4, 3, 1, 4,
  'Gm7',
  ARRAY['A3', 'D4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  5, 3, 3, 4,
  'Gm7',
  ARRAY['G3', 'D4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  6, 4, 1, 4,
  'Cm7',
  ARRAY['D4', 'G4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  7, 4, 3, 4,
  'Cm7',
  ARRAY['C4', 'G4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  8, 5, 1, 4,
  'Fm7',
  ARRAY['G3', 'C4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  9, 5, 3, 4,
  'Fm7',
  ARRAY['F3', 'C4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  10, 6, 1, 4,
  'Bbm7',
  ARRAY['C4', 'F4', 'Ab4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  11, 6, 3, 4,
  'Bbm7',
  ARRAY['Bb3', 'F4', 'Ab4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  12, 7, 1, 4,
  'Ebm7',
  ARRAY['F3', 'Bb3', 'Db4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  13, 7, 3, 4,
  'Ebm7',
  ARRAY['Eb3', 'Bb3', 'Db4', 'Gb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-14'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  14, 8, 1, 4,
  'Abm7',
  ARRAY['Bb3', 'Eb4', 'Gb4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  15, 8, 3, 4,
  'Abm7',
  ARRAY['Ab3', 'Eb4', 'Gb4', 'Cb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-16'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  16, 9, 1, 4,
  'C#m7',
  ARRAY['D#4', 'G#4', 'B4', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-17'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  17, 9, 3, 4,
  'C#m7',
  ARRAY['C#4', 'G#4', 'B4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-18'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  18, 10, 1, 4,
  'F#m7',
  ARRAY['G#3', 'C#4', 'E4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-19'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  19, 10, 3, 4,
  'F#m7',
  ARRAY['F#3', 'C#4', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  20, 11, 1, 4,
  'Bm7',
  ARRAY['C#4', 'F#4', 'A4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-21'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  21, 11, 3, 4,
  'Bm7',
  ARRAY['B3', 'F#4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-22'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  22, 12, 1, 4,
  'Em7',
  ARRAY['F#3', 'B3', 'D4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-item-23'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
  23, 12, 3, 4,
  'Em7',
  ARRAY['E3', 'B3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-quiz'),
  'thvi-b3-quiz-b3-7alt-p1',
  'クイズ: G7alt-C7alt-F7alt-Bb7alt',
  'Quiz: G7alt-C7alt-F7alt-Bb7alt',
  '60秒以内に20問正解。G7alt-C7alt-F7alt-Bb7alt の Drop2 Resolution を弾きましょう。',
  'Answer 20 questions within 60 seconds using G7alt-C7alt-F7alt-Bb7alt Drop 2 Resolution voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-quiz'),
  0, 1, 1, 4,
  'G7alt',
  ARRAY['G3', 'Cb4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-quiz'),
  1, 1, 3, 4,
  'G7alt',
  ARRAY['F3', 'Cb4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-quiz'),
  2, 2, 1, 4,
  'C7alt',
  ARRAY['C4', 'Fb4', 'Ab4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-quiz'),
  3, 2, 3, 4,
  'C7alt',
  ARRAY['Bb3', 'Fb4', 'Ab4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-quiz'),
  4, 3, 1, 4,
  'F7alt',
  ARRAY['F3', 'Bbb3', 'Db4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-quiz'),
  5, 3, 3, 4,
  'F7alt',
  ARRAY['Eb3', 'Bbb3', 'Db4', 'Gb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-quiz'),
  6, 4, 1, 4,
  'Bb7alt',
  ARRAY['Bb3', 'Ebb4', 'Gb4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-quiz'),
  7, 4, 3, 4,
  'Bb7alt',
  ARRAY['Ab3', 'Ebb4', 'Gb4', 'Cb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing'),
  'thvi-b3-voicing-b3-7alt-p1',
  '耳コピ: G7alt-C7alt-F7alt-Bb7alt',
  'Ear training: G7alt-C7alt-F7alt-Bb7alt',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing'),
  0,
  'G7alt-C7alt-F7alt-Bb7alt',
  'G7alt-C7alt-F7alt-Bb7alt',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing-ph0'),
  0,
  'G7alt',
  1, 1, 4,
  0, 2.4,
  ARRAY['G3', 'Cb4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing-ph0'),
  1,
  'G7alt',
  1, 3, 4,
  0, 2.4,
  ARRAY['F3', 'Cb4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing-ph0'),
  2,
  'C7alt',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['C4', 'Fb4', 'Ab4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing-ph0'),
  3,
  'C7alt',
  2, 3, 4,
  2.4, 4.8,
  ARRAY['Bb3', 'Fb4', 'Ab4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing-ph0-c4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing-ph0'),
  4,
  'F7alt',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['F3', 'Bbb3', 'Db4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing-ph0-c5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing-ph0'),
  5,
  'F7alt',
  3, 3, 4,
  4.8, 7.199999999999999,
  ARRAY['Eb3', 'Bbb3', 'Db4', 'Gb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing-ph0-c6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing-ph0'),
  6,
  'Bb7alt',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['Bb3', 'Ebb4', 'Gb4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing-ph0-c7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing-ph0'),
  7,
  'Bb7alt',
  4, 3, 4,
  7.199999999999999, 9.6,
  ARRAY['Ab3', 'Ebb4', 'Gb4', 'Cb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-quiz'),
  'thvi-b3-quiz-b3-7alt-p2',
  'クイズ: Eb7alt-Ab7alt-Db7alt-F#7alt',
  'Quiz: Eb7alt-Ab7alt-Db7alt-F#7alt',
  '60秒以内に20問正解。Eb7alt-Ab7alt-Db7alt-F#7alt の Drop2 Resolution を弾きましょう。',
  'Answer 20 questions within 60 seconds using Eb7alt-Ab7alt-Db7alt-F#7alt Drop 2 Resolution voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-quiz'),
  0, 1, 1, 4,
  'Eb7alt',
  ARRAY['Eb4', 'Ab4', 'Bb4', 'Gb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-quiz'),
  1, 1, 3, 4,
  'Eb7alt',
  ARRAY['Db4', 'Ab4', 'Bb4', 'Fb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-quiz'),
  2, 2, 1, 4,
  'Ab7alt',
  ARRAY['Ab3', 'Db4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-quiz'),
  3, 2, 3, 4,
  'Ab7alt',
  ARRAY['G3', 'Db4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-quiz'),
  4, 3, 1, 4,
  'Db7alt',
  ARRAY['Db4', 'Gb4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-quiz'),
  5, 3, 3, 4,
  'Db7alt',
  ARRAY['C4', 'Gb4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-quiz'),
  6, 4, 1, 4,
  'F#7alt',
  ARRAY['F#3', 'Bb3', 'D4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-quiz'),
  7, 4, 3, 4,
  'F#7alt',
  ARRAY['E3', 'Bb3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing'),
  'thvi-b3-voicing-b3-7alt-p2',
  '耳コピ: Eb7alt-Ab7alt-Db7alt-F#7alt',
  'Ear training: Eb7alt-Ab7alt-Db7alt-F#7alt',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing'),
  0,
  'Eb7alt-Ab7alt-Db7alt-F#7alt',
  'Eb7alt-Ab7alt-Db7alt-F#7alt',
  NULL,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3',
  9.6, 57.6, 0,
  -3
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing-ph0'),
  0,
  'Eb7alt',
  1, 1, 4,
  0, 2.4,
  ARRAY['Eb4', 'Ab4', 'Bb4', 'Gb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing-ph0'),
  1,
  'Eb7alt',
  1, 3, 4,
  0, 2.4,
  ARRAY['Db4', 'Ab4', 'Bb4', 'Fb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing-ph0'),
  2,
  'Ab7alt',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['Ab3', 'Db4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing-ph0'),
  3,
  'Ab7alt',
  2, 3, 4,
  2.4, 4.8,
  ARRAY['G3', 'Db4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing-ph0-c4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing-ph0'),
  4,
  'Db7alt',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['Db4', 'Gb4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing-ph0-c5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing-ph0'),
  5,
  'Db7alt',
  3, 3, 4,
  4.8, 7.199999999999999,
  ARRAY['C4', 'Gb4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing-ph0-c6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing-ph0'),
  6,
  'F#7alt',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['F#3', 'Bb3', 'D4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing-ph0-c7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing-ph0'),
  7,
  'F#7alt',
  4, 3, 4,
  7.199999999999999, 9.6,
  ARRAY['E3', 'Bb3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-quiz'),
  'thvi-b3-quiz-b3-7alt-p3',
  'クイズ: B7alt-E7alt-A7alt-D7alt',
  'Quiz: B7alt-E7alt-A7alt-D7alt',
  '60秒以内に20問正解。B7alt-E7alt-A7alt-D7alt の Drop2 Resolution を弾きましょう。',
  'Answer 20 questions within 60 seconds using B7alt-E7alt-A7alt-D7alt Drop 2 Resolution voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-quiz'),
  0, 1, 1, 4,
  'B7alt',
  ARRAY['B3', 'Eb4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-quiz'),
  1, 1, 3, 4,
  'B7alt',
  ARRAY['A3', 'Eb4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-quiz'),
  2, 2, 1, 4,
  'E7alt',
  ARRAY['E3', 'Ab3', 'C4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-quiz'),
  3, 2, 3, 4,
  'E7alt',
  ARRAY['D3', 'Ab3', 'C4', 'F4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-quiz'),
  4, 3, 1, 4,
  'A7alt',
  ARRAY['A3', 'Db4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-quiz'),
  5, 3, 3, 4,
  'A7alt',
  ARRAY['G3', 'Db4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-quiz'),
  6, 4, 1, 4,
  'D7alt',
  ARRAY['D4', 'Gb4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-quiz'),
  7, 4, 3, 4,
  'D7alt',
  ARRAY['C4', 'Gb4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing'),
  'thvi-b3-voicing-b3-7alt-p3',
  '耳コピ: B7alt-E7alt-A7alt-D7alt',
  'Ear training: B7alt-E7alt-A7alt-D7alt',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing'),
  0,
  'B7alt-E7alt-A7alt-D7alt',
  'B7alt-E7alt-A7alt-D7alt',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing-ph0'),
  0,
  'B7alt',
  1, 1, 4,
  0, 2.4,
  ARRAY['B3', 'Eb4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing-ph0'),
  1,
  'B7alt',
  1, 3, 4,
  0, 2.4,
  ARRAY['A3', 'Eb4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing-ph0'),
  2,
  'E7alt',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['E3', 'Ab3', 'C4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing-ph0'),
  3,
  'E7alt',
  2, 3, 4,
  2.4, 4.8,
  ARRAY['D3', 'Ab3', 'C4', 'F4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing-ph0-c4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing-ph0'),
  4,
  'A7alt',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['A3', 'Db4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing-ph0-c5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing-ph0'),
  5,
  'A7alt',
  3, 3, 4,
  4.8, 7.199999999999999,
  ARRAY['G3', 'Db4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing-ph0-c6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing-ph0'),
  6,
  'D7alt',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['D4', 'Gb4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing-ph0-c7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing-ph0'),
  7,
  'D7alt',
  4, 3, 4,
  7.199999999999999, 9.6,
  ARRAY['C4', 'Gb4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  'thvi-b3-quiz-b3-7alt-summary',
  'クイズ: 全キーまとめ',
  'Quiz: All keys',
  '60秒以内に20問正解。全キーの Drop2 Resolution をランダム出題。',
  'Answer 20 questions within 60 seconds. Random Drop 2 Resolution in all keys.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  0, 1, 1, 4,
  'G7alt',
  ARRAY['G3', 'Cb4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  1, 1, 3, 4,
  'G7alt',
  ARRAY['F3', 'Cb4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  2, 2, 1, 4,
  'C7alt',
  ARRAY['C4', 'Fb4', 'Ab4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  3, 2, 3, 4,
  'C7alt',
  ARRAY['Bb3', 'Fb4', 'Ab4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  4, 3, 1, 4,
  'F7alt',
  ARRAY['F3', 'Bbb3', 'Db4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  5, 3, 3, 4,
  'F7alt',
  ARRAY['Eb3', 'Bbb3', 'Db4', 'Gb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  6, 4, 1, 4,
  'Bb7alt',
  ARRAY['Bb3', 'Ebb4', 'Gb4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  7, 4, 3, 4,
  'Bb7alt',
  ARRAY['Ab3', 'Ebb4', 'Gb4', 'Cb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  8, 5, 1, 4,
  'Eb7alt',
  ARRAY['Eb4', 'Ab4', 'Bb4', 'Gb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  9, 5, 3, 4,
  'Eb7alt',
  ARRAY['Db4', 'Ab4', 'Bb4', 'Fb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  10, 6, 1, 4,
  'Ab7alt',
  ARRAY['Ab3', 'Db4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  11, 6, 3, 4,
  'Ab7alt',
  ARRAY['G3', 'Db4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  12, 7, 1, 4,
  'Db7alt',
  ARRAY['Db4', 'Gb4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  13, 7, 3, 4,
  'Db7alt',
  ARRAY['C4', 'Gb4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-14'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  14, 8, 1, 4,
  'F#7alt',
  ARRAY['F#3', 'Bb3', 'D4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  15, 8, 3, 4,
  'F#7alt',
  ARRAY['E3', 'Bb3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-16'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  16, 9, 1, 4,
  'B7alt',
  ARRAY['B3', 'Eb4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-17'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  17, 9, 3, 4,
  'B7alt',
  ARRAY['A3', 'Eb4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-18'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  18, 10, 1, 4,
  'E7alt',
  ARRAY['E3', 'Ab3', 'C4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-19'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  19, 10, 3, 4,
  'E7alt',
  ARRAY['D3', 'Ab3', 'C4', 'F4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  20, 11, 1, 4,
  'A7alt',
  ARRAY['A3', 'Db4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-21'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  21, 11, 3, 4,
  'A7alt',
  ARRAY['G3', 'Db4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-22'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  22, 12, 1, 4,
  'D7alt',
  ARRAY['D4', 'Gb4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-item-23'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
  23, 12, 3, 4,
  'D7alt',
  ARRAY['C4', 'Gb4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'メジャーセブンス',
  'Major sevenths',
  'メジャーセブンス の Drop2 Resolution ヴォイシングを練習します。',
  'Practice Drop 2 Resolution voicings for Major sevenths.',
  true,
  14, 3,
  'Drop 2 Resolution 基礎編',
  'Drop 2 Resolution Basics',
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-demo-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, false, NULL,
   true, false,
   'thvi-b3-demo-b3-m7', NULL,
   NULL,
   'デモ', 'Demo', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: CM7-FM7-BbM7-EbM7', 'Quiz: CM7-FM7-BbM7-EbM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7'), NULL, 2, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-voicing'),
   false, false, NULL, NULL,
   NULL,
   '耳コピ: CM7-FM7-BbM7-EbM7', 'Ear battle: CM7-FM7-BbM7-EbM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p1-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7'), NULL, 3, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1215, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: CM7-FM7-BbM7-EbM7', 'Survival: CM7-FM7-BbM7-EbM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7'), NULL, 4, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: AbM7-DbM7-GbM7-BM7', 'Quiz: AbM7-DbM7-GbM7-BM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7'), NULL, 5, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-voicing'),
   false, false, NULL, NULL,
   NULL,
   '耳コピ: AbM7-DbM7-GbM7-BM7', 'Ear battle: AbM7-DbM7-GbM7-BM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p2-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7'), NULL, 6, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1216, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: AbM7-DbM7-GbM7-BM7', 'Survival: AbM7-DbM7-GbM7-BM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7'), NULL, 7, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: EM7-AM7-DM7-GM7', 'Quiz: EM7-AM7-DM7-GM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7'), NULL, 8, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-voicing'),
   false, false, NULL, NULL,
   NULL,
   '耳コピ: EM7-AM7-DM7-GM7', 'Ear battle: EM7-AM7-DM7-GM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-p3-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7'), NULL, 9, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1217, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: EM7-AM7-DM7-GM7', 'Survival: EM7-AM7-DM7-GM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7'), NULL, 10, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: 全キーまとめ', 'Quiz: All keys', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7-summary-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7'), NULL, 11, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1218, 'lesson', false, NULL, false, NULL,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'マイナーセブンス',
  'Minor sevenths',
  'マイナーセブンス の Drop2 Resolution ヴォイシングを練習します。',
  'Practice Drop 2 Resolution voicings for Minor sevenths.',
  true,
  15, 3,
  'Drop 2 Resolution 基礎編',
  'Drop 2 Resolution Basics',
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-demo-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, false, NULL,
   true, false,
   'thvi-b3-demo-b3-mn7', NULL,
   NULL,
   'デモ', 'Demo', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Am7-Dm7-Gm7-Cm7', 'Quiz: Am7-Dm7-Gm7-Cm7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7'), NULL, 2, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-voicing'),
   false, false, NULL, NULL,
   NULL,
   '耳コピ: Am7-Dm7-Gm7-Cm7', 'Ear battle: Am7-Dm7-Gm7-Cm7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p1-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7'), NULL, 3, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1219, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Am7-Dm7-Gm7-Cm7', 'Survival: Am7-Dm7-Gm7-Cm7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7'), NULL, 4, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Fm7-Bbm7-Ebm7-Abm7', 'Quiz: Fm7-Bbm7-Ebm7-Abm7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7'), NULL, 5, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-voicing'),
   false, false, NULL, NULL,
   NULL,
   '耳コピ: Fm7-Bbm7-Ebm7-Abm7', 'Ear battle: Fm7-Bbm7-Ebm7-Abm7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p2-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7'), NULL, 6, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1220, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Fm7-Bbm7-Ebm7-Abm7', 'Survival: Fm7-Bbm7-Ebm7-Abm7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7'), NULL, 7, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: C#m7-F#m7-Bm7-Em7', 'Quiz: C#m7-F#m7-Bm7-Em7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7'), NULL, 8, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-voicing'),
   false, false, NULL, NULL,
   NULL,
   '耳コピ: C#m7-F#m7-Bm7-Em7', 'Ear battle: C#m7-F#m7-Bm7-Em7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-p3-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7'), NULL, 9, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1221, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: C#m7-F#m7-Bm7-Em7', 'Survival: C#m7-F#m7-Bm7-Em7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7'), NULL, 10, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: 全キーまとめ', 'Quiz: All keys', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7-summary-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mn7'), NULL, 11, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1222, 'lesson', false, NULL, false, NULL,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'セブンスオルタード',
  'Altered sevenths',
  'セブンスオルタード の Drop2 Resolution ヴォイシングを練習します。',
  'Practice Drop 2 Resolution voicings for Altered sevenths.',
  true,
  16, 3,
  'Drop 2 Resolution 基礎編',
  'Drop 2 Resolution Basics',
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-demo-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, false, NULL,
   true, false,
   'thvi-b3-demo-b3-7alt', NULL,
   NULL,
   'デモ', 'Demo', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: G7alt-C7alt-F7alt-Bb7alt', 'Quiz: G7alt-C7alt-F7alt-Bb7alt', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt'), NULL, 2, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-voicing'),
   false, false, NULL, NULL,
   NULL,
   '耳コピ: G7alt-C7alt-F7alt-Bb7alt', 'Ear battle: G7alt-C7alt-F7alt-Bb7alt', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p1-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt'), NULL, 3, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1223, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: G7alt-C7alt-F7alt-Bb7alt', 'Survival: G7alt-C7alt-F7alt-Bb7alt', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt'), NULL, 4, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Eb7alt-Ab7alt-Db7alt-F#7alt', 'Quiz: Eb7alt-Ab7alt-Db7alt-F#7alt', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt'), NULL, 5, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-voicing'),
   false, false, NULL, NULL,
   NULL,
   '耳コピ: Eb7alt-Ab7alt-Db7alt-F#7alt', 'Ear battle: Eb7alt-Ab7alt-Db7alt-F#7alt', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p2-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt'), NULL, 6, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1224, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Eb7alt-Ab7alt-Db7alt-F#7alt', 'Survival: Eb7alt-Ab7alt-Db7alt-F#7alt', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt'), NULL, 7, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: B7alt-E7alt-A7alt-D7alt', 'Quiz: B7alt-E7alt-A7alt-D7alt', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt'), NULL, 8, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-voicing'),
   false, false, NULL, NULL,
   NULL,
   '耳コピ: B7alt-E7alt-A7alt-D7alt', 'Ear battle: B7alt-E7alt-A7alt-D7alt', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-p3-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt'), NULL, 9, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1225, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: B7alt-E7alt-A7alt-D7alt', 'Survival: B7alt-E7alt-A7alt-D7alt', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt'), NULL, 10, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: 全キーまとめ', 'Quiz: All keys', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt-summary-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7alt'), NULL, 11, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1226, 'lesson', false, NULL, false, NULL,
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
