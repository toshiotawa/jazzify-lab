-- 両手ヴォイシングコース(上級) フェーズ2
-- mM7 / m7b5 / 7(#11) + マイナー II-V-I
BEGIN;

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (
  'thva-demo-b1-mm7',
  '両手ヴォイシング デモ (mM7(9,13))',
  'Two-hand voicing demo (mM7(9,13))',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"同音集合の読み替えも、5 音の形をそのまま覚えるのじゃ。","en":"For alternate chord readings, keep the same five-note shape."},{"speaker":"fai","ja":"mM7(9,13) の進行を確認してから、弾いてみよう。","en":"Check the progression first, then try playing."},{"speaker":"jajii","ja":"コード表記は mM7 で統一じゃ。焦らず形を覚えるんじゃ。","en":"Chord symbols stay mM7. Take your time learning the shapes."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (
  'thva-demo-b1-m7b5',
  '両手ヴォイシング デモ (m7b5(9,11))',
  'Two-hand voicing demo (m7b5(9,11))',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"同音集合の読み替えも、5 音の形をそのまま覚えるのじゃ。","en":"For alternate chord readings, keep the same five-note shape."},{"speaker":"fai","ja":"m7b5(9,11) の進行を確認してから、弾いてみよう。","en":"Check the progression first, then try playing."},{"speaker":"jajii","ja":"コード表記は m7b5 で統一じゃ。焦らず形を覚えるんじゃ。","en":"Chord symbols stay m7b5. Take your time learning the shapes."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (
  'thva-demo-b1-7s11',
  '両手ヴォイシング デモ (7 Lydian dominant)',
  'Two-hand voicing demo (7 Lydian dominant)',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"同音集合の読み替えも、5 音の形をそのまま覚えるのじゃ。","en":"For alternate chord readings, keep the same five-note shape."},{"speaker":"fai","ja":"7 Lydian dominant の進行を確認してから、弾いてみよう。","en":"Check the progression first, then try playing."},{"speaker":"jajii","ja":"コード表記は 7(#11) で統一じゃ。焦らず形を覚えるんじゃ。","en":"Chord symbols stay 7(#11). Take your time learning the shapes."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (
  'thva-demo-b1-minor-ii-v-i',
  '両手ヴォイシング デモ (マイナー II-V-I)',
  'Two-hand voicing demo (Minor II-V-I)',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"マイナー II-V-I では、IIm7b5 → V7alt → ImM7 のトップラインが 5度 → ♭7/#9 → 9度 になるのじゃ。","en":"In minor II-V-I, the top line moves 5th → flat 7/sharp 9 → 9th across IIm7b5, V7alt, and ImM7."},{"speaker":"fai","ja":"マイナー II-V-I の流れを確認してから、弾いてみよう。","en":"Check the flow first, then try playing."},{"speaker":"jajii","ja":"V7alt の 3rd は b4 表記じゃ。左手2音 + 右手3音の形を覚えるんじゃ。","en":"Use flat-4 spelling for the V7alt 3rd. Learn the two-left, three-right hand shape."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
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
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, grand_staff_mode
) VALUES (
  'lesson', 1272, 'progression', 'survival',
  '両手ヴォイシング: mM7(9,13): CmM7-FmM7-BbmM7-EbmM7',
  'Two-hand voicing: mM7(9,13): CmM7-FmM7-BbmM7-EbmM7',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  'mM7', false, NULL,
  '[{"name":"CmM7","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":0,"voicing_staves":[2,1,1,1,1]},{"name":"FmM7","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":-1,"voicing_staves":[2,2,1,1,1]},{"name":"BbmM7","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":-2,"voicing_staves":[2,1,1,1,1]},{"name":"EbmM7","voicing":[48,54,58,62,65],"voicing_names":["C3","Gb3","Bb3","D4","F4"],"key_fifths":-3,"voicing_staves":[2,2,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s', true
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
  grand_staff_mode = EXCLUDED.grand_staff_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, grand_staff_mode
) VALUES (
  'lesson', 1273, 'progression', 'survival',
  '両手ヴォイシング: mM7(9,13): AbmM7-DbmM7-GbmM7-BmM7',
  'Two-hand voicing: mM7(9,13): AbmM7-DbmM7-GbmM7-BmM7',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  'mM7', false, NULL,
  '[{"name":"AbmM7","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":-4,"voicing_staves":[2,2,1,1,1]},{"name":"DbmM7","voicing":[58,64,68,72,75],"voicing_names":["Bb3","Fb4","Ab4","C5","Eb5"],"key_fifths":-5,"voicing_staves":[2,1,1,1,1]},{"name":"GbmM7","voicing":[51,57,61,65,68],"voicing_names":["Eb3","Bbb3","Db4","F4","Ab4"],"key_fifths":-6,"voicing_staves":[2,2,1,1,1]},{"name":"BmM7","voicing":[56,62,66,70,73],"voicing_names":["G#3","D4","F#4","A#4","C#5"],"key_fifths":5,"voicing_staves":[2,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s', true
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
  grand_staff_mode = EXCLUDED.grand_staff_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, grand_staff_mode
) VALUES (
  'lesson', 1274, 'progression', 'survival',
  '両手ヴォイシング: mM7(9,13): EmM7-AmM7-DmM7-GmM7',
  'Two-hand voicing: mM7(9,13): EmM7-AmM7-DmM7-GmM7',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  'mM7', false, NULL,
  '[{"name":"EmM7","voicing":[49,55,59,63,66],"voicing_names":["C#3","G3","B3","D#4","F#4"],"key_fifths":4,"voicing_staves":[2,2,1,1,1]},{"name":"AmM7","voicing":[54,60,64,68,71],"voicing_names":["F#3","C4","E4","G#4","B4"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]},{"name":"DmM7","voicing":[59,65,69,73,76],"voicing_names":["B3","F4","A4","C#5","E5"],"key_fifths":2,"voicing_staves":[2,1,1,1,1]},{"name":"GmM7","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":1,"voicing_staves":[2,2,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s', true
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
  grand_staff_mode = EXCLUDED.grand_staff_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, grand_staff_mode
) VALUES (
  'lesson', 1275, 'progression', 'survival',
  '両手ヴォイシング: mM7(9,13): まとめ',
  'Two-hand voicing: mM7(9,13): まとめ',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  'mM7', false, NULL,
  '[{"name":"CmM7","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":0,"voicing_staves":[2,1,1,1,1]},{"name":"FmM7","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":-1,"voicing_staves":[2,2,1,1,1]},{"name":"BbmM7","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":-2,"voicing_staves":[2,1,1,1,1]},{"name":"EbmM7","voicing":[48,54,58,62,65],"voicing_names":["C3","Gb3","Bb3","D4","F4"],"key_fifths":-3,"voicing_staves":[2,2,1,1,1]},{"name":"AbmM7","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":-4,"voicing_staves":[2,2,1,1,1]},{"name":"DbmM7","voicing":[58,64,68,72,75],"voicing_names":["Bb3","Fb4","Ab4","C5","Eb5"],"key_fifths":-5,"voicing_staves":[2,1,1,1,1]},{"name":"GbmM7","voicing":[51,57,61,65,68],"voicing_names":["Eb3","Bbb3","Db4","F4","Ab4"],"key_fifths":-6,"voicing_staves":[2,2,1,1,1]},{"name":"BmM7","voicing":[56,62,66,70,73],"voicing_names":["G#3","D4","F#4","A#4","C#5"],"key_fifths":5,"voicing_staves":[2,1,1,1,1]},{"name":"EmM7","voicing":[49,55,59,63,66],"voicing_names":["C#3","G3","B3","D#4","F#4"],"key_fifths":4,"voicing_staves":[2,2,1,1,1]},{"name":"AmM7","voicing":[54,60,64,68,71],"voicing_names":["F#3","C4","E4","G#4","B4"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]},{"name":"DmM7","voicing":[59,65,69,73,76],"voicing_names":["B3","F4","A4","C#5","E5"],"key_fifths":2,"voicing_staves":[2,1,1,1,1]},{"name":"GmM7","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":1,"voicing_staves":[2,2,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s', true
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
  grand_staff_mode = EXCLUDED.grand_staff_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, grand_staff_mode
) VALUES (
  'lesson', 1276, 'progression', 'survival',
  '両手ヴォイシング: m7b5(9,11): Am7b5-Dm7b5-Gm7b5-Cm7b5',
  'Two-hand voicing: m7b5(9,11): Am7b5-Dm7b5-Gm7b5-Cm7b5',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  'm7b5', false, NULL,
  '[{"name":"Am7b5","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]},{"name":"Dm7b5","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]},{"name":"Gm7b5","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]},{"name":"Cm7b5","voicing":[48,54,58,62,65],"voicing_names":["C3","Gb3","Bb3","D4","F4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s', true
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
  grand_staff_mode = EXCLUDED.grand_staff_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, grand_staff_mode
) VALUES (
  'lesson', 1277, 'progression', 'survival',
  '両手ヴォイシング: m7b5(9,11): Fm7b5-Bbm7b5-Ebm7b5-G#m7b5',
  'Two-hand voicing: m7b5(9,11): Fm7b5-Bbm7b5-Ebm7b5-G#m7b5',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  'm7b5', false, NULL,
  '[{"name":"Fm7b5","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":-1,"voicing_staves":[2,2,1,1,1]},{"name":"Bbm7b5","voicing":[58,64,68,72,75],"voicing_names":["Bb3","Fb4","Ab4","C5","Eb5"],"key_fifths":-2,"voicing_staves":[2,1,1,1,1]},{"name":"Ebm7b5","voicing":[51,57,61,65,68],"voicing_names":["Eb3","Bbb3","Db4","F4","Ab4"],"key_fifths":-3,"voicing_staves":[2,2,1,1,1]},{"name":"G#m7b5","voicing":[56,62,66,70,73],"voicing_names":["G#3","D4","F#4","A#4","C#5"],"key_fifths":5,"voicing_staves":[2,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s', true
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
  grand_staff_mode = EXCLUDED.grand_staff_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, grand_staff_mode
) VALUES (
  'lesson', 1278, 'progression', 'survival',
  '両手ヴォイシング: m7b5(9,11): C#m7b5-F#m7b5-Bm7b5-Em7b5',
  'Two-hand voicing: m7b5(9,11): C#m7b5-F#m7b5-Bm7b5-Em7b5',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  'm7b5', false, NULL,
  '[{"name":"C#m7b5","voicing":[49,55,59,63,66],"voicing_names":["C#3","G3","B3","D#4","F#4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]},{"name":"F#m7b5","voicing":[54,60,64,68,71],"voicing_names":["F#3","C4","E4","G#4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"Bm7b5","voicing":[59,65,69,73,76],"voicing_names":["B3","F4","A4","C#5","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]},{"name":"Em7b5","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s', true
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
  grand_staff_mode = EXCLUDED.grand_staff_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, grand_staff_mode
) VALUES (
  'lesson', 1279, 'progression', 'survival',
  '両手ヴォイシング: m7b5(9,11): まとめ',
  'Two-hand voicing: m7b5(9,11): まとめ',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  'm7b5', false, NULL,
  '[{"name":"Am7b5","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]},{"name":"Dm7b5","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]},{"name":"Gm7b5","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]},{"name":"Cm7b5","voicing":[48,54,58,62,65],"voicing_names":["C3","Gb3","Bb3","D4","F4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"Fm7b5","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":-1,"voicing_staves":[2,2,1,1,1]},{"name":"Bbm7b5","voicing":[58,64,68,72,75],"voicing_names":["Bb3","Fb4","Ab4","C5","Eb5"],"key_fifths":-2,"voicing_staves":[2,1,1,1,1]},{"name":"Ebm7b5","voicing":[51,57,61,65,68],"voicing_names":["Eb3","Bbb3","Db4","F4","Ab4"],"key_fifths":-3,"voicing_staves":[2,2,1,1,1]},{"name":"G#m7b5","voicing":[56,62,66,70,73],"voicing_names":["G#3","D4","F#4","A#4","C#5"],"key_fifths":5,"voicing_staves":[2,1,1,1,1]},{"name":"C#m7b5","voicing":[49,55,59,63,66],"voicing_names":["C#3","G3","B3","D#4","F#4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]},{"name":"F#m7b5","voicing":[54,60,64,68,71],"voicing_names":["F#3","C4","E4","G#4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"Bm7b5","voicing":[59,65,69,73,76],"voicing_names":["B3","F4","A4","C#5","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]},{"name":"Em7b5","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s', true
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
  grand_staff_mode = EXCLUDED.grand_staff_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, grand_staff_mode
) VALUES (
  'lesson', 1280, 'progression', 'survival',
  '両手ヴォイシング: 7 Lydian dominant: C7-F7-Bb7-Eb7',
  'Two-hand voicing: 7 Lydian dominant: C7-F7-Bb7-Eb7',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  '7(#11)', false, NULL,
  '[{"name":"C7","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"F7","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]},{"name":"Bb7","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":-2,"voicing_staves":[2,2,1,1,1]},{"name":"Eb7","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":-3,"voicing_staves":[2,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s', true
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
  grand_staff_mode = EXCLUDED.grand_staff_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, grand_staff_mode
) VALUES (
  'lesson', 1281, 'progression', 'survival',
  '両手ヴォイシング: 7 Lydian dominant: Ab7-Db7-Gb7-B7',
  'Two-hand voicing: 7 Lydian dominant: Ab7-Db7-Gb7-B7',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  '7(#11)', false, NULL,
  '[{"name":"Ab7","voicing":[48,54,58,62,65],"voicing_names":["C3","Gb3","Bb3","D4","F4"],"key_fifths":-4,"voicing_staves":[2,2,1,1,1]},{"name":"Db7","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":-5,"voicing_staves":[2,2,1,1,1]},{"name":"Gb7","voicing":[58,64,68,72,75],"voicing_names":["Bb3","Fb4","Ab4","C5","Eb5"],"key_fifths":-6,"voicing_staves":[2,1,1,1,1]},{"name":"B7","voicing":[51,57,61,65,68],"voicing_names":["D#3","A3","C#4","E#4","G#4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s', true
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
  grand_staff_mode = EXCLUDED.grand_staff_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, grand_staff_mode
) VALUES (
  'lesson', 1282, 'progression', 'survival',
  '両手ヴォイシング: 7 Lydian dominant: E7-A7-D7-G7',
  'Two-hand voicing: 7 Lydian dominant: E7-A7-D7-G7',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  '7(#11)', false, NULL,
  '[{"name":"E7","voicing":[56,62,66,70,73],"voicing_names":["G#3","D4","F#4","A#4","C#5"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"A7","voicing":[49,55,59,63,66],"voicing_names":["C#3","G3","B3","D#4","F#4"],"key_fifths":3,"voicing_staves":[2,2,1,1,1]},{"name":"D7","voicing":[54,60,64,68,71],"voicing_names":["F#3","C4","E4","G#4","B4"],"key_fifths":2,"voicing_staves":[2,1,1,1,1]},{"name":"G7","voicing":[59,65,69,73,76],"voicing_names":["B3","F4","A4","C#5","E5"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s', true
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
  grand_staff_mode = EXCLUDED.grand_staff_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, grand_staff_mode
) VALUES (
  'lesson', 1283, 'progression', 'survival',
  '両手ヴォイシング: 7 Lydian dominant: まとめ',
  'Two-hand voicing: 7 Lydian dominant: まとめ',
  'easy', '', 'So What / UST', 'So What / UST',
  NULL, NULL, NULL,
  '7(#11)', false, NULL,
  '[{"name":"C7","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"F7","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]},{"name":"Bb7","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":-2,"voicing_staves":[2,2,1,1,1]},{"name":"Eb7","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":-3,"voicing_staves":[2,1,1,1,1]},{"name":"Ab7","voicing":[48,54,58,62,65],"voicing_names":["C3","Gb3","Bb3","D4","F4"],"key_fifths":-4,"voicing_staves":[2,2,1,1,1]},{"name":"Db7","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":-5,"voicing_staves":[2,2,1,1,1]},{"name":"Gb7","voicing":[58,64,68,72,75],"voicing_names":["Bb3","Fb4","Ab4","C5","Eb5"],"key_fifths":-6,"voicing_staves":[2,1,1,1,1]},{"name":"B7","voicing":[51,57,61,65,68],"voicing_names":["D#3","A3","C#4","E#4","G#4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]},{"name":"E7","voicing":[56,62,66,70,73],"voicing_names":["G#3","D4","F#4","A#4","C#5"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"A7","voicing":[49,55,59,63,66],"voicing_names":["C#3","G3","B3","D#4","F#4"],"key_fifths":3,"voicing_staves":[2,2,1,1,1]},{"name":"D7","voicing":[54,60,64,68,71],"voicing_names":["F#3","C4","E4","G#4","B4"],"key_fifths":2,"voicing_staves":[2,1,1,1,1]},{"name":"G7","voicing":[59,65,69,73,76],"voicing_names":["B3","F4","A4","C#5","E5"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s', true
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
  grand_staff_mode = EXCLUDED.grand_staff_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, grand_staff_mode
) VALUES (
  'lesson', 1284, 'progression', 'survival',
  '両手ヴォイシング: マイナー II-V-I: Key of Cm & Fm',
  'Two-hand voicing: マイナー II-V-I: Key of Cm & Fm',
  'easy', '', 'II-V-i', 'II-V-i',
  NULL, NULL, NULL,
  'II-V-i', false, NULL,
  '[{"name":"Dm7b5","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":-3,"voicing_staves":[2,2,1,1,1]},{"name":"G7alt","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":-3,"voicing_staves":[2,2,1,1,1]},{"name":"CmM7","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":-3,"voicing_staves":[2,1,1,1,1]},{"name":"Gm7b5","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":-4,"voicing_staves":[2,1,1,1,1]},{"name":"C7alt","voicing":[58,64,68,72,75],"voicing_names":["Bb3","Fb4","Ab4","C5","Eb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1,1]},{"name":"FmM7","voicing":[62,68,72,76,79],"voicing_names":["D4","Ab4","C5","E5","G5"],"key_fifths":-4,"voicing_staves":[1,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s', true
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
  grand_staff_mode = EXCLUDED.grand_staff_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, grand_staff_mode
) VALUES (
  'lesson', 1285, 'progression', 'survival',
  '両手ヴォイシング: マイナー II-V-I: Key of Bbm & Ebm',
  'Two-hand voicing: マイナー II-V-I: Key of Bbm & Ebm',
  'easy', '', 'II-V-i', 'II-V-i',
  NULL, NULL, NULL,
  'II-V-i', false, NULL,
  '[{"name":"Cm7b5","voicing":[48,54,58,62,65],"voicing_names":["C3","Gb3","Bb3","D4","F4"],"key_fifths":-5,"voicing_staves":[2,2,1,1,1]},{"name":"F7alt","voicing":[51,57,61,65,68],"voicing_names":["Eb3","Bbb3","Db4","F4","Ab4"],"key_fifths":-5,"voicing_staves":[2,2,1,1,1]},{"name":"BbmM7","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":-5,"voicing_staves":[2,1,1,1,1]},{"name":"Fm7b5","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":-6,"voicing_staves":[2,2,1,1,1]},{"name":"Bb7alt","voicing":[56,62,66,70,73],"voicing_names":["Ab3","Ebb4","Gb4","Bb4","Db5"],"key_fifths":-6,"voicing_staves":[2,1,1,1,1]},{"name":"EbmM7","voicing":[60,66,70,74,77],"voicing_names":["C4","Gb4","Bb4","D5","F5"],"key_fifths":-6,"voicing_staves":[1,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s', true
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
  grand_staff_mode = EXCLUDED.grand_staff_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, grand_staff_mode
) VALUES (
  'lesson', 1286, 'progression', 'survival',
  '両手ヴォイシング: マイナー II-V-I: Key of G#m & C#m',
  'Two-hand voicing: マイナー II-V-I: Key of G#m & C#m',
  'easy', '', 'II-V-i', 'II-V-i',
  NULL, NULL, NULL,
  'II-V-i', false, NULL,
  '[{"name":"A#m7b5","voicing":[58,64,68,72,75],"voicing_names":["A#3","E4","G#4","B#4","D#5"],"key_fifths":5,"voicing_staves":[2,1,1,1,1]},{"name":"D#7alt","voicing":[61,67,71,75,78],"voicing_names":["C#4","G4","B4","D#5","F#5"],"key_fifths":5,"voicing_staves":[1,1,1,1,1]},{"name":"G#mM7","voicing":[65,71,75,79,82],"voicing_names":["E#4","B4","D#5","F##5","A#5"],"key_fifths":5,"voicing_staves":[1,1,1,1,1]},{"name":"D#m7b5","voicing":[51,57,61,65,68],"voicing_names":["D#3","A3","C#4","E#4","G#4"],"key_fifths":4,"voicing_staves":[2,2,1,1,1]},{"name":"G#7alt","voicing":[54,60,64,68,71],"voicing_names":["F#3","C4","E4","G#4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"C#mM7","voicing":[58,64,68,72,75],"voicing_names":["A#3","E4","G#4","B#4","D#5"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s', true
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
  grand_staff_mode = EXCLUDED.grand_staff_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, grand_staff_mode
) VALUES (
  'lesson', 1287, 'progression', 'survival',
  '両手ヴォイシング: マイナー II-V-I: Key of F#m & Bm',
  'Two-hand voicing: マイナー II-V-I: Key of F#m & Bm',
  'easy', '', 'II-V-i', 'II-V-i',
  NULL, NULL, NULL,
  'II-V-i', false, NULL,
  '[{"name":"G#m7b5","voicing":[56,62,66,70,73],"voicing_names":["G#3","D4","F#4","A#4","C#5"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]},{"name":"C#7alt","voicing":[59,65,69,73,76],"voicing_names":["B3","F4","A4","C#5","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]},{"name":"F#mM7","voicing":[63,69,73,77,80],"voicing_names":["D#4","A4","C#5","E#5","G#5"],"key_fifths":3,"voicing_staves":[1,1,1,1,1]},{"name":"C#m7b5","voicing":[49,55,59,63,66],"voicing_names":["C#3","G3","B3","D#4","F#4"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]},{"name":"F#7alt","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]},{"name":"BmM7","voicing":[56,62,66,70,73],"voicing_names":["G#3","D4","F#4","A#4","C#5"],"key_fifths":2,"voicing_staves":[2,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s', true
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
  grand_staff_mode = EXCLUDED.grand_staff_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, grand_staff_mode
) VALUES (
  'lesson', 1288, 'progression', 'survival',
  '両手ヴォイシング: マイナー II-V-I: Key of Em & Am',
  'Two-hand voicing: マイナー II-V-I: Key of Em & Am',
  'easy', '', 'II-V-i', 'II-V-i',
  NULL, NULL, NULL,
  'II-V-i', false, NULL,
  '[{"name":"F#m7b5","voicing":[54,60,64,68,71],"voicing_names":["F#3","C4","E4","G#4","B4"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]},{"name":"B7alt","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]},{"name":"EmM7","voicing":[61,67,71,75,78],"voicing_names":["C#4","G4","B4","D#5","F#5"],"key_fifths":1,"voicing_staves":[1,1,1,1,1]},{"name":"Bm7b5","voicing":[47,53,57,61,64],"voicing_names":["B2","F3","A3","C#4","E4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"E7alt","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"AmM7","voicing":[54,60,64,68,71],"voicing_names":["F#3","C4","E4","G#4","B4"],"key_fifths":0,"voicing_staves":[2,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s', true
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
  grand_staff_mode = EXCLUDED.grand_staff_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, grand_staff_mode
) VALUES (
  'lesson', 1289, 'progression', 'survival',
  '両手ヴォイシング: マイナー II-V-I: Key of Dm & Gm',
  'Two-hand voicing: マイナー II-V-I: Key of Dm & Gm',
  'easy', '', 'II-V-i', 'II-V-i',
  NULL, NULL, NULL,
  'II-V-i', false, NULL,
  '[{"name":"Em7b5","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":-1,"voicing_staves":[2,2,1,1,1]},{"name":"A7alt","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]},{"name":"DmM7","voicing":[59,65,69,73,76],"voicing_names":["B3","F4","A4","C#5","E5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]},{"name":"Am7b5","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":-2,"voicing_staves":[2,1,1,1,1]},{"name":"D7alt","voicing":[60,66,70,74,77],"voicing_names":["C4","Gb4","Bb4","D5","F5"],"key_fifths":-2,"voicing_staves":[1,1,1,1,1]},{"name":"GmM7","voicing":[64,70,74,78,81],"voicing_names":["E4","Bb4","D5","F#5","A5"],"key_fifths":-2,"voicing_staves":[1,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s', true
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
  grand_staff_mode = EXCLUDED.grand_staff_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, grand_staff_mode
) VALUES (
  'lesson', 1290, 'progression', 'survival',
  '両手ヴォイシング: マイナー II-V-I: まとめ',
  'Two-hand voicing: マイナー II-V-I: まとめ',
  'easy', '', 'II-V-i', 'II-V-i',
  NULL, NULL, NULL,
  'II-V-i', false, NULL,
  '[{"name":"Bm7b5","voicing":[47,53,57,61,64],"voicing_names":["B2","F3","A3","C#4","E4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"E7alt","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"AmM7","voicing":[54,60,64,68,71],"voicing_names":["F#3","C4","E4","G#4","B4"],"key_fifths":0,"voicing_staves":[2,1,1,1,1]},{"name":"Cm7b5","voicing":[48,54,58,62,65],"voicing_names":["C3","Gb3","Bb3","D4","F4"],"key_fifths":-5,"voicing_staves":[2,2,1,1,1]},{"name":"F7alt","voicing":[51,57,61,65,68],"voicing_names":["Eb3","Bbb3","Db4","F4","Ab4"],"key_fifths":-5,"voicing_staves":[2,2,1,1,1]},{"name":"BbmM7","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":-5,"voicing_staves":[2,1,1,1,1]},{"name":"C#m7b5","voicing":[49,55,59,63,66],"voicing_names":["C#3","G3","B3","D#4","F#4"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]},{"name":"F#7alt","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]},{"name":"BmM7","voicing":[56,62,66,70,73],"voicing_names":["G#3","D4","F#4","A#4","C#5"],"key_fifths":2,"voicing_staves":[2,1,1,1,1]},{"name":"Dm7b5","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":-3,"voicing_staves":[2,2,1,1,1]},{"name":"G7alt","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":-3,"voicing_staves":[2,2,1,1,1]},{"name":"CmM7","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":-3,"voicing_staves":[2,1,1,1,1]},{"name":"D#m7b5","voicing":[51,57,61,65,68],"voicing_names":["D#3","A3","C#4","E#4","G#4"],"key_fifths":4,"voicing_staves":[2,2,1,1,1]},{"name":"G#7alt","voicing":[54,60,64,68,71],"voicing_names":["F#3","C4","E4","G#4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"C#mM7","voicing":[58,64,68,72,75],"voicing_names":["A#3","E4","G#4","B#4","D#5"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"Em7b5","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":-1,"voicing_staves":[2,2,1,1,1]},{"name":"A7alt","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]},{"name":"DmM7","voicing":[59,65,69,73,76],"voicing_names":["B3","F4","A4","C#5","E5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]},{"name":"Fm7b5","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":-6,"voicing_staves":[2,2,1,1,1]},{"name":"Bb7alt","voicing":[56,62,66,70,73],"voicing_names":["Ab3","Ebb4","Gb4","Bb4","Db5"],"key_fifths":-6,"voicing_staves":[2,1,1,1,1]},{"name":"EbmM7","voicing":[60,66,70,74,77],"voicing_names":["C4","Gb4","Bb4","D5","F5"],"key_fifths":-6,"voicing_staves":[1,1,1,1,1]},{"name":"F#m7b5","voicing":[54,60,64,68,71],"voicing_names":["F#3","C4","E4","G#4","B4"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]},{"name":"B7alt","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]},{"name":"EmM7","voicing":[61,67,71,75,78],"voicing_names":["C#4","G4","B4","D#5","F#5"],"key_fifths":1,"voicing_staves":[1,1,1,1,1]},{"name":"Gm7b5","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":-4,"voicing_staves":[2,1,1,1,1]},{"name":"C7alt","voicing":[58,64,68,72,75],"voicing_names":["Bb3","Fb4","Ab4","C5","Eb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1,1]},{"name":"FmM7","voicing":[62,68,72,76,79],"voicing_names":["D4","Ab4","C5","E5","G5"],"key_fifths":-4,"voicing_staves":[1,1,1,1,1]},{"name":"G#m7b5","voicing":[56,62,66,70,73],"voicing_names":["G#3","D4","F#4","A#4","C#5"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]},{"name":"C#7alt","voicing":[59,65,69,73,76],"voicing_names":["B3","F4","A4","C#5","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]},{"name":"F#mM7","voicing":[63,69,73,77,80],"voicing_names":["D#4","A4","C#5","E#5","G#5"],"key_fifths":3,"voicing_staves":[1,1,1,1,1]},{"name":"Am7b5","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":-2,"voicing_staves":[2,1,1,1,1]},{"name":"D7alt","voicing":[60,66,70,74,77],"voicing_names":["C4","Gb4","Bb4","D5","F5"],"key_fifths":-2,"voicing_staves":[1,1,1,1,1]},{"name":"GmM7","voicing":[64,70,74,78,81],"voicing_names":["E4","Bb4","D5","F#5","A5"],"key_fifths":-2,"voicing_staves":[1,1,1,1,1]},{"name":"A#m7b5","voicing":[58,64,68,72,75],"voicing_names":["A#3","E4","G#4","B#4","D#5"],"key_fifths":5,"voicing_staves":[2,1,1,1,1]},{"name":"D#7alt","voicing":[61,67,71,75,78],"voicing_names":["C#4","G4","B4","D#5","F#5"],"key_fifths":5,"voicing_staves":[1,1,1,1,1]},{"name":"G#mM7","voicing":[65,71,75,79,82],"voicing_names":["E#4","B4","D#5","F##5","A#5"],"key_fifths":5,"voicing_staves":[1,1,1,1,1]}]'::jsonb,
  true, 'fade_15s', 'fade_15s', true
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
  grand_staff_mode = EXCLUDED.grand_staff_mode,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-quiz'),
  'thva-quiz-b1-mm7-p1',
  'クイズ: CmM7-FmM7-BbmM7-EbmM7',
  'Quiz: CmM7-FmM7-BbmM7-EbmM7',
  '60秒以内に20問正解。CmM7-FmM7-BbmM7-EbmM7 の UST ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using CmM7-FmM7-BbmM7-EbmM7 UST voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-quiz'),
  0, 1, 1, 4,
  'CmM7',
  ARRAY['A3', 'Eb4', 'G4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  0
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-quiz'),
  1, 2, 1, 4,
  'FmM7',
  ARRAY['D3', 'Ab3', 'C4', 'E4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-quiz'),
  2, 3, 1, 4,
  'BbmM7',
  ARRAY['G3', 'Db4', 'F4', 'A4', 'C5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-quiz'),
  3, 4, 1, 4,
  'EbmM7',
  ARRAY['C3', 'Gb3', 'Bb3', 'D4', 'F4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-voicing'),
  'thva-voicing-b1-mm7-p1',
  'バトル: CmM7-FmM7-BbmM7-EbmM7',
  'Ear training: CmM7-FmM7-BbmM7-EbmM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-voicing'),
  0,
  'CmM7-FmM7-BbmM7-EbmM7',
  'CmM7-FmM7-BbmM7-EbmM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-voicing-ph0'),
  0,
  'CmM7',
  1, 1, 4,
  0, 2.4,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-voicing-ph0'),
  1,
  'FmM7',
  2, 1, 4,
  2.4, 4.8,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-voicing-ph0'),
  2,
  'BbmM7',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['G3', 'Db4', 'F4', 'A4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-voicing-ph0'),
  3,
  'EbmM7',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['C3', 'Gb3', 'Bb3', 'D4', 'F4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-quiz'),
  'thva-quiz-b1-mm7-p2',
  'クイズ: AbmM7-DbmM7-GbmM7-BmM7',
  'Quiz: AbmM7-DbmM7-GbmM7-BmM7',
  '60秒以内に20問正解。AbmM7-DbmM7-GbmM7-BmM7 の UST ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using AbmM7-DbmM7-GbmM7-BmM7 UST voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-quiz'),
  0, 1, 1, 4,
  'AbmM7',
  ARRAY['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-quiz'),
  1, 2, 1, 4,
  'DbmM7',
  ARRAY['Bb3', 'Fb4', 'Ab4', 'C5', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-quiz'),
  2, 3, 1, 4,
  'GbmM7',
  ARRAY['Eb3', 'Bbb3', 'Db4', 'F4', 'Ab4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -6
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-quiz'),
  3, 4, 1, 4,
  'BmM7',
  ARRAY['G#3', 'D4', 'F#4', 'A#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-voicing'),
  'thva-voicing-b1-mm7-p2',
  'バトル: AbmM7-DbmM7-GbmM7-BmM7',
  'Ear training: AbmM7-DbmM7-GbmM7-BmM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-voicing'),
  0,
  'AbmM7-DbmM7-GbmM7-BmM7',
  'AbmM7-DbmM7-GbmM7-BmM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-voicing-ph0'),
  0,
  'AbmM7',
  1, 1, 4,
  0, 2.4,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-voicing-ph0'),
  1,
  'DbmM7',
  2, 1, 4,
  2.4, 4.8,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-voicing-ph0'),
  2,
  'GbmM7',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['Eb3', 'Bbb3', 'Db4', 'F4', 'Ab4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-voicing-ph0'),
  3,
  'BmM7',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['G#3', 'D4', 'F#4', 'A#4', 'C#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-quiz'),
  'thva-quiz-b1-mm7-p3',
  'クイズ: EmM7-AmM7-DmM7-GmM7',
  'Quiz: EmM7-AmM7-DmM7-GmM7',
  '60秒以内に20問正解。EmM7-AmM7-DmM7-GmM7 の UST ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using EmM7-AmM7-DmM7-GmM7 UST voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-quiz'),
  0, 1, 1, 4,
  'EmM7',
  ARRAY['C#3', 'G3', 'B3', 'D#4', 'F#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-quiz'),
  1, 2, 1, 4,
  'AmM7',
  ARRAY['F#3', 'C4', 'E4', 'G#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-quiz'),
  2, 3, 1, 4,
  'DmM7',
  ARRAY['B3', 'F4', 'A4', 'C#5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-quiz'),
  3, 4, 1, 4,
  'GmM7',
  ARRAY['E3', 'Bb3', 'D4', 'F#4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-voicing'),
  'thva-voicing-b1-mm7-p3',
  'バトル: EmM7-AmM7-DmM7-GmM7',
  'Ear training: EmM7-AmM7-DmM7-GmM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-voicing'),
  0,
  'EmM7-AmM7-DmM7-GmM7',
  'EmM7-AmM7-DmM7-GmM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-voicing-ph0'),
  0,
  'EmM7',
  1, 1, 4,
  0, 2.4,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-voicing-ph0'),
  1,
  'AmM7',
  2, 1, 4,
  2.4, 4.8,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-voicing-ph0'),
  2,
  'DmM7',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['B3', 'F4', 'A4', 'C#5', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-voicing-ph0'),
  3,
  'GmM7',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['E3', 'Bb3', 'D4', 'F#4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz'),
  'thva-quiz-b1-mm7-summary',
  'クイズ: 全キーまとめ',
  'Quiz: All keys',
  '60秒以内に20問正解。全キーの UST ヴォイシングをランダム出題。',
  'Answer 20 questions within 60 seconds. Random UST voicings in all keys.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz'),
  0, 1, 1, 4,
  'CmM7',
  ARRAY['A3', 'Eb4', 'G4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  0
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz'),
  1, 2, 1, 4,
  'FmM7',
  ARRAY['D3', 'Ab3', 'C4', 'E4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz'),
  2, 3, 1, 4,
  'BbmM7',
  ARRAY['G3', 'Db4', 'F4', 'A4', 'C5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz'),
  3, 4, 1, 4,
  'EbmM7',
  ARRAY['C3', 'Gb3', 'Bb3', 'D4', 'F4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz'),
  4, 5, 1, 4,
  'AbmM7',
  ARRAY['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz'),
  5, 6, 1, 4,
  'DbmM7',
  ARRAY['Bb3', 'Fb4', 'Ab4', 'C5', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz'),
  6, 7, 1, 4,
  'GbmM7',
  ARRAY['Eb3', 'Bbb3', 'Db4', 'F4', 'Ab4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -6
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz'),
  7, 8, 1, 4,
  'BmM7',
  ARRAY['G#3', 'D4', 'F#4', 'A#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz'),
  8, 9, 1, 4,
  'EmM7',
  ARRAY['C#3', 'G3', 'B3', 'D#4', 'F#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz'),
  9, 10, 1, 4,
  'AmM7',
  ARRAY['F#3', 'C4', 'E4', 'G#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz'),
  10, 11, 1, 4,
  'DmM7',
  ARRAY['B3', 'F4', 'A4', 'C#5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz'),
  11, 12, 1, 4,
  'GmM7',
  ARRAY['E3', 'Bb3', 'D4', 'F#4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-quiz'),
  'thva-quiz-b1-m7b5-p1',
  'クイズ: Am7b5-Dm7b5-Gm7b5-Cm7b5',
  'Quiz: Am7b5-Dm7b5-Gm7b5-Cm7b5',
  '60秒以内に20問正解。Am7b5-Dm7b5-Gm7b5-Cm7b5 の UST ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using Am7b5-Dm7b5-Gm7b5-Cm7b5 UST voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-quiz'),
  0, 1, 1, 4,
  'Am7b5',
  ARRAY['A3', 'Eb4', 'G4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-quiz'),
  1, 2, 1, 4,
  'Dm7b5',
  ARRAY['D3', 'Ab3', 'C4', 'E4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-quiz'),
  2, 3, 1, 4,
  'Gm7b5',
  ARRAY['G3', 'Db4', 'F4', 'A4', 'C5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-quiz'),
  3, 4, 1, 4,
  'Cm7b5',
  ARRAY['C3', 'Gb3', 'Bb3', 'D4', 'F4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  0
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-voicing'),
  'thva-voicing-b1-m7b5-p1',
  'バトル: Am7b5-Dm7b5-Gm7b5-Cm7b5',
  'Ear training: Am7b5-Dm7b5-Gm7b5-Cm7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-voicing'),
  0,
  'Am7b5-Dm7b5-Gm7b5-Cm7b5',
  'Am7b5-Dm7b5-Gm7b5-Cm7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-voicing-ph0'),
  0,
  'Am7b5',
  1, 1, 4,
  0, 2.4,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-voicing-ph0'),
  1,
  'Dm7b5',
  2, 1, 4,
  2.4, 4.8,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-voicing-ph0'),
  2,
  'Gm7b5',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['G3', 'Db4', 'F4', 'A4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-voicing-ph0'),
  3,
  'Cm7b5',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['C3', 'Gb3', 'Bb3', 'D4', 'F4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-quiz'),
  'thva-quiz-b1-m7b5-p2',
  'クイズ: Fm7b5-Bbm7b5-Ebm7b5-G#m7b5',
  'Quiz: Fm7b5-Bbm7b5-Ebm7b5-G#m7b5',
  '60秒以内に20問正解。Fm7b5-Bbm7b5-Ebm7b5-G#m7b5 の UST ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using Fm7b5-Bbm7b5-Ebm7b5-G#m7b5 UST voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-quiz'),
  0, 1, 1, 4,
  'Fm7b5',
  ARRAY['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-quiz'),
  1, 2, 1, 4,
  'Bbm7b5',
  ARRAY['Bb3', 'Fb4', 'Ab4', 'C5', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-quiz'),
  2, 3, 1, 4,
  'Ebm7b5',
  ARRAY['Eb3', 'Bbb3', 'Db4', 'F4', 'Ab4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-quiz'),
  3, 4, 1, 4,
  'G#m7b5',
  ARRAY['G#3', 'D4', 'F#4', 'A#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-voicing'),
  'thva-voicing-b1-m7b5-p2',
  'バトル: Fm7b5-Bbm7b5-Ebm7b5-G#m7b5',
  'Ear training: Fm7b5-Bbm7b5-Ebm7b5-G#m7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-voicing'),
  0,
  'Fm7b5-Bbm7b5-Ebm7b5-G#m7b5',
  'Fm7b5-Bbm7b5-Ebm7b5-G#m7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-voicing-ph0'),
  0,
  'Fm7b5',
  1, 1, 4,
  0, 2.4,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-voicing-ph0'),
  1,
  'Bbm7b5',
  2, 1, 4,
  2.4, 4.8,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-voicing-ph0'),
  2,
  'Ebm7b5',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['Eb3', 'Bbb3', 'Db4', 'F4', 'Ab4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-voicing-ph0'),
  3,
  'G#m7b5',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['G#3', 'D4', 'F#4', 'A#4', 'C#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-quiz'),
  'thva-quiz-b1-m7b5-p3',
  'クイズ: C#m7b5-F#m7b5-Bm7b5-Em7b5',
  'Quiz: C#m7b5-F#m7b5-Bm7b5-Em7b5',
  '60秒以内に20問正解。C#m7b5-F#m7b5-Bm7b5-Em7b5 の UST ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using C#m7b5-F#m7b5-Bm7b5-Em7b5 UST voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-quiz'),
  0, 1, 1, 4,
  'C#m7b5',
  ARRAY['C#3', 'G3', 'B3', 'D#4', 'F#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-quiz'),
  1, 2, 1, 4,
  'F#m7b5',
  ARRAY['F#3', 'C4', 'E4', 'G#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-quiz'),
  2, 3, 1, 4,
  'Bm7b5',
  ARRAY['B3', 'F4', 'A4', 'C#5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-quiz'),
  3, 4, 1, 4,
  'Em7b5',
  ARRAY['E3', 'Bb3', 'D4', 'F#4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-voicing'),
  'thva-voicing-b1-m7b5-p3',
  'バトル: C#m7b5-F#m7b5-Bm7b5-Em7b5',
  'Ear training: C#m7b5-F#m7b5-Bm7b5-Em7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-voicing'),
  0,
  'C#m7b5-F#m7b5-Bm7b5-Em7b5',
  'C#m7b5-F#m7b5-Bm7b5-Em7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-voicing-ph0'),
  0,
  'C#m7b5',
  1, 1, 4,
  0, 2.4,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-voicing-ph0'),
  1,
  'F#m7b5',
  2, 1, 4,
  2.4, 4.8,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-voicing-ph0'),
  2,
  'Bm7b5',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['B3', 'F4', 'A4', 'C#5', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-voicing-ph0'),
  3,
  'Em7b5',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['E3', 'Bb3', 'D4', 'F#4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz'),
  'thva-quiz-b1-m7b5-summary',
  'クイズ: 全キーまとめ',
  'Quiz: All keys',
  '60秒以内に20問正解。全キーの UST ヴォイシングをランダム出題。',
  'Answer 20 questions within 60 seconds. Random UST voicings in all keys.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz'),
  0, 1, 1, 4,
  'Am7b5',
  ARRAY['A3', 'Eb4', 'G4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz'),
  1, 2, 1, 4,
  'Dm7b5',
  ARRAY['D3', 'Ab3', 'C4', 'E4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz'),
  2, 3, 1, 4,
  'Gm7b5',
  ARRAY['G3', 'Db4', 'F4', 'A4', 'C5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz'),
  3, 4, 1, 4,
  'Cm7b5',
  ARRAY['C3', 'Gb3', 'Bb3', 'D4', 'F4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  0
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz'),
  4, 5, 1, 4,
  'Fm7b5',
  ARRAY['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz'),
  5, 6, 1, 4,
  'Bbm7b5',
  ARRAY['Bb3', 'Fb4', 'Ab4', 'C5', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz'),
  6, 7, 1, 4,
  'Ebm7b5',
  ARRAY['Eb3', 'Bbb3', 'Db4', 'F4', 'Ab4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz'),
  7, 8, 1, 4,
  'G#m7b5',
  ARRAY['G#3', 'D4', 'F#4', 'A#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz'),
  8, 9, 1, 4,
  'C#m7b5',
  ARRAY['C#3', 'G3', 'B3', 'D#4', 'F#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz'),
  9, 10, 1, 4,
  'F#m7b5',
  ARRAY['F#3', 'C4', 'E4', 'G#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz'),
  10, 11, 1, 4,
  'Bm7b5',
  ARRAY['B3', 'F4', 'A4', 'C#5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz'),
  11, 12, 1, 4,
  'Em7b5',
  ARRAY['E3', 'Bb3', 'D4', 'F#4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-quiz'),
  'thva-quiz-b1-7s11-p1',
  'クイズ: C7-F7-Bb7-Eb7',
  'Quiz: C7-F7-Bb7-Eb7',
  '60秒以内に20問正解。C7-F7-Bb7-Eb7 の UST ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using C7-F7-Bb7-Eb7 UST voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-quiz'),
  0, 1, 1, 4,
  'C7',
  ARRAY['E3', 'Bb3', 'D4', 'F#4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  0
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-quiz'),
  1, 2, 1, 4,
  'F7',
  ARRAY['A3', 'Eb4', 'G4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-quiz'),
  2, 3, 1, 4,
  'Bb7',
  ARRAY['D3', 'Ab3', 'C4', 'E4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-quiz'),
  3, 4, 1, 4,
  'Eb7',
  ARRAY['G3', 'Db4', 'F4', 'A4', 'C5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-voicing'),
  'thva-voicing-b1-7s11-p1',
  'バトル: C7-F7-Bb7-Eb7',
  'Ear training: C7-F7-Bb7-Eb7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-voicing'),
  0,
  'C7-F7-Bb7-Eb7',
  'C7-F7-Bb7-Eb7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-voicing-ph0'),
  0,
  'C7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-voicing-ph0'),
  1,
  'F7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-voicing-ph0'),
  2,
  'Bb7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-voicing-ph0'),
  3,
  'Eb7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-quiz'),
  'thva-quiz-b1-7s11-p2',
  'クイズ: Ab7-Db7-Gb7-B7',
  'Quiz: Ab7-Db7-Gb7-B7',
  '60秒以内に20問正解。Ab7-Db7-Gb7-B7 の UST ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using Ab7-Db7-Gb7-B7 UST voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-quiz'),
  0, 1, 1, 4,
  'Ab7',
  ARRAY['C3', 'Gb3', 'Bb3', 'D4', 'F4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-quiz'),
  1, 2, 1, 4,
  'Db7',
  ARRAY['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-quiz'),
  2, 3, 1, 4,
  'Gb7',
  ARRAY['Bb3', 'Fb4', 'Ab4', 'C5', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -6
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-quiz'),
  3, 4, 1, 4,
  'B7',
  ARRAY['D#3', 'A3', 'C#4', 'E#4', 'G#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-voicing'),
  'thva-voicing-b1-7s11-p2',
  'バトル: Ab7-Db7-Gb7-B7',
  'Ear training: Ab7-Db7-Gb7-B7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-voicing'),
  0,
  'Ab7-Db7-Gb7-B7',
  'Ab7-Db7-Gb7-B7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-voicing-ph0'),
  0,
  'Ab7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-voicing-ph0'),
  1,
  'Db7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-voicing-ph0'),
  2,
  'Gb7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-voicing-ph0'),
  3,
  'B7',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['D#3', 'A3', 'C#4', 'E#4', 'G#4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-quiz'),
  'thva-quiz-b1-7s11-p3',
  'クイズ: E7-A7-D7-G7',
  'Quiz: E7-A7-D7-G7',
  '60秒以内に20問正解。E7-A7-D7-G7 の UST ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using E7-A7-D7-G7 UST voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-quiz'),
  0, 1, 1, 4,
  'E7',
  ARRAY['G#3', 'D4', 'F#4', 'A#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-quiz'),
  1, 2, 1, 4,
  'A7',
  ARRAY['C#3', 'G3', 'B3', 'D#4', 'F#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-quiz'),
  2, 3, 1, 4,
  'D7',
  ARRAY['F#3', 'C4', 'E4', 'G#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-quiz'),
  3, 4, 1, 4,
  'G7',
  ARRAY['B3', 'F4', 'A4', 'C#5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-voicing'),
  'thva-voicing-b1-7s11-p3',
  'バトル: E7-A7-D7-G7',
  'Ear training: E7-A7-D7-G7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-voicing'),
  0,
  'E7-A7-D7-G7',
  'E7-A7-D7-G7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-voicing-ph0'),
  0,
  'E7',
  1, 1, 4,
  0, 2.4,
  ARRAY['G#3', 'D4', 'F#4', 'A#4', 'C#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-voicing-ph0'),
  1,
  'A7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-voicing-ph0'),
  2,
  'D7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-voicing-ph0'),
  3,
  'G7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz'),
  'thva-quiz-b1-7s11-summary',
  'クイズ: 全キーまとめ',
  'Quiz: All keys',
  '60秒以内に20問正解。全キーの UST ヴォイシングをランダム出題。',
  'Answer 20 questions within 60 seconds. Random UST voicings in all keys.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz'),
  0, 1, 1, 4,
  'C7',
  ARRAY['E3', 'Bb3', 'D4', 'F#4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  0
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz'),
  1, 2, 1, 4,
  'F7',
  ARRAY['A3', 'Eb4', 'G4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz'),
  2, 3, 1, 4,
  'Bb7',
  ARRAY['D3', 'Ab3', 'C4', 'E4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz'),
  3, 4, 1, 4,
  'Eb7',
  ARRAY['G3', 'Db4', 'F4', 'A4', 'C5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz'),
  4, 5, 1, 4,
  'Ab7',
  ARRAY['C3', 'Gb3', 'Bb3', 'D4', 'F4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz'),
  5, 6, 1, 4,
  'Db7',
  ARRAY['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz'),
  6, 7, 1, 4,
  'Gb7',
  ARRAY['Bb3', 'Fb4', 'Ab4', 'C5', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -6
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz'),
  7, 8, 1, 4,
  'B7',
  ARRAY['D#3', 'A3', 'C#4', 'E#4', 'G#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz'),
  8, 9, 1, 4,
  'E7',
  ARRAY['G#3', 'D4', 'F#4', 'A#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz'),
  9, 10, 1, 4,
  'A7',
  ARRAY['C#3', 'G3', 'B3', 'D#4', 'F#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz'),
  10, 11, 1, 4,
  'D7',
  ARRAY['F#3', 'C4', 'E4', 'G#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz'),
  11, 12, 1, 4,
  'G7',
  ARRAY['B3', 'F4', 'A4', 'C#5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p1-quiz'),
  'thva-quiz-b1-minor-ii-v-i-p1',
  'クイズ: Key of Cm & Fm',
  'Quiz: Key of Cm & Fm',
  '60秒以内に20問正解。Key of Cm & Fm のマイナー II-V-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of Cm & Fm minor II-V-I voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p1-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p1-quiz'),
  0, 1, 1, 4,
  'Dm7b5',
  ARRAY['D3', 'Ab3', 'C4', 'E4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p1-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p1-quiz'),
  1, 2, 1, 4,
  'G7alt',
  ARRAY['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p1-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p1-quiz'),
  2, 3, 1, 4,
  'CmM7',
  ARRAY['A3', 'Eb4', 'G4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p1-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p1-quiz'),
  3, 4, 1, 4,
  'Gm7b5',
  ARRAY['G3', 'Db4', 'F4', 'A4', 'C5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p1-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p1-quiz'),
  4, 5, 1, 4,
  'C7alt',
  ARRAY['Bb3', 'Fb4', 'Ab4', 'C5', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p1-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p1-quiz'),
  5, 6, 1, 4,
  'FmM7',
  ARRAY['D4', 'Ab4', 'C5', 'E5', 'G5']::text[],
  ARRAY[1, 1, 1, 1, 1]::smallint[],
  -4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p2-quiz'),
  'thva-quiz-b1-minor-ii-v-i-p2',
  'クイズ: Key of Bbm & Ebm',
  'Quiz: Key of Bbm & Ebm',
  '60秒以内に20問正解。Key of Bbm & Ebm のマイナー II-V-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of Bbm & Ebm minor II-V-I voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p2-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p2-quiz'),
  0, 1, 1, 4,
  'Cm7b5',
  ARRAY['C3', 'Gb3', 'Bb3', 'D4', 'F4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p2-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p2-quiz'),
  1, 2, 1, 4,
  'F7alt',
  ARRAY['Eb3', 'Bbb3', 'Db4', 'F4', 'Ab4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p2-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p2-quiz'),
  2, 3, 1, 4,
  'BbmM7',
  ARRAY['G3', 'Db4', 'F4', 'A4', 'C5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p2-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p2-quiz'),
  3, 4, 1, 4,
  'Fm7b5',
  ARRAY['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -6
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p2-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p2-quiz'),
  4, 5, 1, 4,
  'Bb7alt',
  ARRAY['Ab3', 'Ebb4', 'Gb4', 'Bb4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -6
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p2-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p2-quiz'),
  5, 6, 1, 4,
  'EbmM7',
  ARRAY['C4', 'Gb4', 'Bb4', 'D5', 'F5']::text[],
  ARRAY[1, 1, 1, 1, 1]::smallint[],
  -6
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p3-quiz'),
  'thva-quiz-b1-minor-ii-v-i-p3',
  'クイズ: Key of G#m & C#m',
  'Quiz: Key of G#m & C#m',
  '60秒以内に20問正解。Key of G#m & C#m のマイナー II-V-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of G#m & C#m minor II-V-I voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p3-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p3-quiz'),
  0, 1, 1, 4,
  'A#m7b5',
  ARRAY['A#3', 'E4', 'G#4', 'B#4', 'D#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p3-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p3-quiz'),
  1, 2, 1, 4,
  'D#7alt',
  ARRAY['C#4', 'G4', 'B4', 'D#5', 'F#5']::text[],
  ARRAY[1, 1, 1, 1, 1]::smallint[],
  5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p3-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p3-quiz'),
  2, 3, 1, 4,
  'G#mM7',
  ARRAY['E#4', 'B4', 'D#5', 'F##5', 'A#5']::text[],
  ARRAY[1, 1, 1, 1, 1]::smallint[],
  5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p3-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p3-quiz'),
  3, 4, 1, 4,
  'D#m7b5',
  ARRAY['D#3', 'A3', 'C#4', 'E#4', 'G#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p3-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p3-quiz'),
  4, 5, 1, 4,
  'G#7alt',
  ARRAY['F#3', 'C4', 'E4', 'G#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p3-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p3-quiz'),
  5, 6, 1, 4,
  'C#mM7',
  ARRAY['A#3', 'E4', 'G#4', 'B#4', 'D#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p4-quiz'),
  'thva-quiz-b1-minor-ii-v-i-p4',
  'クイズ: Key of F#m & Bm',
  'Quiz: Key of F#m & Bm',
  '60秒以内に20問正解。Key of F#m & Bm のマイナー II-V-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of F#m & Bm minor II-V-I voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p4-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p4-quiz'),
  0, 1, 1, 4,
  'G#m7b5',
  ARRAY['G#3', 'D4', 'F#4', 'A#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p4-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p4-quiz'),
  1, 2, 1, 4,
  'C#7alt',
  ARRAY['B3', 'F4', 'A4', 'C#5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p4-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p4-quiz'),
  2, 3, 1, 4,
  'F#mM7',
  ARRAY['D#4', 'A4', 'C#5', 'E#5', 'G#5']::text[],
  ARRAY[1, 1, 1, 1, 1]::smallint[],
  3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p4-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p4-quiz'),
  3, 4, 1, 4,
  'C#m7b5',
  ARRAY['C#3', 'G3', 'B3', 'D#4', 'F#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p4-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p4-quiz'),
  4, 5, 1, 4,
  'F#7alt',
  ARRAY['E3', 'Bb3', 'D4', 'F#4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p4-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p4-quiz'),
  5, 6, 1, 4,
  'BmM7',
  ARRAY['G#3', 'D4', 'F#4', 'A#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p5-quiz'),
  'thva-quiz-b1-minor-ii-v-i-p5',
  'クイズ: Key of Em & Am',
  'Quiz: Key of Em & Am',
  '60秒以内に20問正解。Key of Em & Am のマイナー II-V-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of Em & Am minor II-V-I voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p5-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p5-quiz'),
  0, 1, 1, 4,
  'F#m7b5',
  ARRAY['F#3', 'C4', 'E4', 'G#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p5-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p5-quiz'),
  1, 2, 1, 4,
  'B7alt',
  ARRAY['A3', 'Eb4', 'G4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p5-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p5-quiz'),
  2, 3, 1, 4,
  'EmM7',
  ARRAY['C#4', 'G4', 'B4', 'D#5', 'F#5']::text[],
  ARRAY[1, 1, 1, 1, 1]::smallint[],
  1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p5-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p5-quiz'),
  3, 4, 1, 4,
  'Bm7b5',
  ARRAY['B2', 'F3', 'A3', 'C#4', 'E4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  0
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p5-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p5-quiz'),
  4, 5, 1, 4,
  'E7alt',
  ARRAY['D3', 'Ab3', 'C4', 'E4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  0
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p5-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p5-quiz'),
  5, 6, 1, 4,
  'AmM7',
  ARRAY['F#3', 'C4', 'E4', 'G#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  0
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p6-quiz'),
  'thva-quiz-b1-minor-ii-v-i-p6',
  'クイズ: Key of Dm & Gm',
  'Quiz: Key of Dm & Gm',
  '60秒以内に20問正解。Key of Dm & Gm のマイナー II-V-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of Dm & Gm minor II-V-I voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p6-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p6-quiz'),
  0, 1, 1, 4,
  'Em7b5',
  ARRAY['E3', 'Bb3', 'D4', 'F#4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p6-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p6-quiz'),
  1, 2, 1, 4,
  'A7alt',
  ARRAY['G3', 'Db4', 'F4', 'A4', 'C5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p6-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p6-quiz'),
  2, 3, 1, 4,
  'DmM7',
  ARRAY['B3', 'F4', 'A4', 'C#5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p6-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p6-quiz'),
  3, 4, 1, 4,
  'Am7b5',
  ARRAY['A3', 'Eb4', 'G4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p6-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p6-quiz'),
  4, 5, 1, 4,
  'D7alt',
  ARRAY['C4', 'Gb4', 'Bb4', 'D5', 'F5']::text[],
  ARRAY[1, 1, 1, 1, 1]::smallint[],
  -2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p6-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p6-quiz'),
  5, 6, 1, 4,
  'GmM7',
  ARRAY['E4', 'Bb4', 'D5', 'F#5', 'A5']::text[],
  ARRAY[1, 1, 1, 1, 1]::smallint[],
  -2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  'thva-quiz-b1-minor-ii-v-i-summary',
  'クイズ: 全キーまとめ',
  'Quiz: All keys',
  '60秒以内に20問正解。全キーのマイナー II-V-I を順番に弾きましょう。',
  'Answer 20 questions within 60 seconds. Play minor II-V-I in all keys in order.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  0, 1, 1, 4,
  'Bm7b5',
  ARRAY['B2', 'F3', 'A3', 'C#4', 'E4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  0
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  1, 2, 1, 4,
  'E7alt',
  ARRAY['D3', 'Ab3', 'C4', 'E4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  0
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  2, 3, 1, 4,
  'AmM7',
  ARRAY['F#3', 'C4', 'E4', 'G#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  0
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  3, 1, 1, 4,
  'Cm7b5',
  ARRAY['C3', 'Gb3', 'Bb3', 'D4', 'F4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  4, 2, 1, 4,
  'F7alt',
  ARRAY['Eb3', 'Bbb3', 'Db4', 'F4', 'Ab4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  5, 3, 1, 4,
  'BbmM7',
  ARRAY['G3', 'Db4', 'F4', 'A4', 'C5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  6, 1, 1, 4,
  'C#m7b5',
  ARRAY['C#3', 'G3', 'B3', 'D#4', 'F#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  7, 2, 1, 4,
  'F#7alt',
  ARRAY['E3', 'Bb3', 'D4', 'F#4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  8, 3, 1, 4,
  'BmM7',
  ARRAY['G#3', 'D4', 'F#4', 'A#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  9, 1, 1, 4,
  'Dm7b5',
  ARRAY['D3', 'Ab3', 'C4', 'E4', 'G4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  10, 2, 1, 4,
  'G7alt',
  ARRAY['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  11, 3, 1, 4,
  'CmM7',
  ARRAY['A3', 'Eb4', 'G4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  12, 1, 1, 4,
  'D#m7b5',
  ARRAY['D#3', 'A3', 'C#4', 'E#4', 'G#4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  13, 2, 1, 4,
  'G#7alt',
  ARRAY['F#3', 'C4', 'E4', 'G#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-14'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  14, 3, 1, 4,
  'C#mM7',
  ARRAY['A#3', 'E4', 'G#4', 'B#4', 'D#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  15, 1, 1, 4,
  'Em7b5',
  ARRAY['E3', 'Bb3', 'D4', 'F#4', 'A4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-16'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  16, 2, 1, 4,
  'A7alt',
  ARRAY['G3', 'Db4', 'F4', 'A4', 'C5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-17'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  17, 3, 1, 4,
  'DmM7',
  ARRAY['B3', 'F4', 'A4', 'C#5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-18'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  18, 1, 1, 4,
  'Fm7b5',
  ARRAY['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']::text[],
  ARRAY[2, 2, 1, 1, 1]::smallint[],
  -6
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-19'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  19, 2, 1, 4,
  'Bb7alt',
  ARRAY['Ab3', 'Ebb4', 'Gb4', 'Bb4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -6
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  20, 3, 1, 4,
  'EbmM7',
  ARRAY['C4', 'Gb4', 'Bb4', 'D5', 'F5']::text[],
  ARRAY[1, 1, 1, 1, 1]::smallint[],
  -6
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-21'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  21, 1, 1, 4,
  'F#m7b5',
  ARRAY['F#3', 'C4', 'E4', 'G#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-22'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  22, 2, 1, 4,
  'B7alt',
  ARRAY['A3', 'Eb4', 'G4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-23'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  23, 3, 1, 4,
  'EmM7',
  ARRAY['C#4', 'G4', 'B4', 'D#5', 'F#5']::text[],
  ARRAY[1, 1, 1, 1, 1]::smallint[],
  1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-24'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  24, 1, 1, 4,
  'Gm7b5',
  ARRAY['G3', 'Db4', 'F4', 'A4', 'C5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  25, 2, 1, 4,
  'C7alt',
  ARRAY['Bb3', 'Fb4', 'Ab4', 'C5', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-26'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  26, 3, 1, 4,
  'FmM7',
  ARRAY['D4', 'Ab4', 'C5', 'E5', 'G5']::text[],
  ARRAY[1, 1, 1, 1, 1]::smallint[],
  -4
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-27'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  27, 1, 1, 4,
  'G#m7b5',
  ARRAY['G#3', 'D4', 'F#4', 'A#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-28'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  28, 2, 1, 4,
  'C#7alt',
  ARRAY['B3', 'F4', 'A4', 'C#5', 'E5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-29'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  29, 3, 1, 4,
  'F#mM7',
  ARRAY['D#4', 'A4', 'C#5', 'E#5', 'G#5']::text[],
  ARRAY[1, 1, 1, 1, 1]::smallint[],
  3
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  30, 1, 1, 4,
  'Am7b5',
  ARRAY['A3', 'Eb4', 'G4', 'B4', 'D5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  -2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-31'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  31, 2, 1, 4,
  'D7alt',
  ARRAY['C4', 'Gb4', 'Bb4', 'D5', 'F5']::text[],
  ARRAY[1, 1, 1, 1, 1]::smallint[],
  -2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-32'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  32, 3, 1, 4,
  'GmM7',
  ARRAY['E4', 'Bb4', 'D5', 'F#5', 'A5']::text[],
  ARRAY[1, 1, 1, 1, 1]::smallint[],
  -2
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-33'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  33, 1, 1, 4,
  'A#m7b5',
  ARRAY['A#3', 'E4', 'G#4', 'B#4', 'D#5']::text[],
  ARRAY[2, 1, 1, 1, 1]::smallint[],
  5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-34'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  34, 2, 1, 4,
  'D#7alt',
  ARRAY['C#4', 'G4', 'B4', 'D#5', 'F#5']::text[],
  ARRAY[1, 1, 1, 1, 1]::smallint[],
  5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-item-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
  35, 3, 1, 4,
  'G#mM7',
  ARRAY['E#4', 'B4', 'D#5', 'F##5', 'A#5']::text[],
  ARRAY[1, 1, 1, 1, 1]::smallint[],
  5
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  measure_number = EXCLUDED.measure_number,
  beat_offset = EXCLUDED.beat_offset,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'course-two-hand-voicing-advanced'),
  'mM7(9,13)',
  'mM7(9,13)',
  'mM7(9,13) の UST 5 音ヴォイシングを練習します。',
  'Practice UST five-note voicings for mM7(9,13).',
  true,
  4, 1,
  'So What / UST ヴォイシング',
  'So What / UST Voicings',
  '[]'::jsonb,
  '①デモ ②3進行×クイズ/バトル/サバイバル ③全キーまとめ',
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-demo-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, false, NULL,
   true, false,
   'thva-demo-b1-mm7', NULL,
   NULL,
   'デモ', 'Demo', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: CmM7-FmM7-BbmM7-EbmM7', 'Quiz: CmM7-FmM7-BbmM7-EbmM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7'), NULL, 2, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル: CmM7-FmM7-BbmM7-EbmM7', 'Battle: CmM7-FmM7-BbmM7-EbmM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7'), NULL, 3, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1272, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: CmM7-FmM7-BbmM7-EbmM7', 'Survival: CmM7-FmM7-BbmM7-EbmM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7'), NULL, 4, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: AbmM7-DbmM7-GbmM7-BmM7', 'Quiz: AbmM7-DbmM7-GbmM7-BmM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7'), NULL, 5, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル: AbmM7-DbmM7-GbmM7-BmM7', 'Battle: AbmM7-DbmM7-GbmM7-BmM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7'), NULL, 6, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1273, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: AbmM7-DbmM7-GbmM7-BmM7', 'Survival: AbmM7-DbmM7-GbmM7-BmM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7'), NULL, 7, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: EmM7-AmM7-DmM7-GmM7', 'Quiz: EmM7-AmM7-DmM7-GmM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7'), NULL, 8, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル: EmM7-AmM7-DmM7-GmM7', 'Battle: EmM7-AmM7-DmM7-GmM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7'), NULL, 9, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1274, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: EmM7-AmM7-DmM7-GmM7', 'Survival: EmM7-AmM7-DmM7-GmM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7'), NULL, 10, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: 全キーまとめ', 'Quiz: All keys', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7'), NULL, 11, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1275, 'lesson', false, NULL, false, NULL,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'course-two-hand-voicing-advanced'),
  'm7b5(9,11)',
  'm7b5(9,11)',
  'm7b5(9,11) の UST 5 音ヴォイシングを練習します。',
  'Practice UST five-note voicings for m7b5(9,11).',
  true,
  5, 1,
  'So What / UST ヴォイシング',
  'So What / UST Voicings',
  '[]'::jsonb,
  '①デモ ②3進行×クイズ/バトル/サバイバル ③全キーまとめ',
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-demo-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, false, NULL,
   true, false,
   'thva-demo-b1-m7b5', NULL,
   NULL,
   'デモ', 'Demo', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Am7b5-Dm7b5-Gm7b5-Cm7b5', 'Quiz: Am7b5-Dm7b5-Gm7b5-Cm7b5', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5'), NULL, 2, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル: Am7b5-Dm7b5-Gm7b5-Cm7b5', 'Battle: Am7b5-Dm7b5-Gm7b5-Cm7b5', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5'), NULL, 3, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1276, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Am7b5-Dm7b5-Gm7b5-Cm7b5', 'Survival: Am7b5-Dm7b5-Gm7b5-Cm7b5', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5'), NULL, 4, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Fm7b5-Bbm7b5-Ebm7b5-G#m7b5', 'Quiz: Fm7b5-Bbm7b5-Ebm7b5-G#m7b5', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5'), NULL, 5, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル: Fm7b5-Bbm7b5-Ebm7b5-G#m7b5', 'Battle: Fm7b5-Bbm7b5-Ebm7b5-G#m7b5', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5'), NULL, 6, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1277, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Fm7b5-Bbm7b5-Ebm7b5-G#m7b5', 'Survival: Fm7b5-Bbm7b5-Ebm7b5-G#m7b5', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5'), NULL, 7, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: C#m7b5-F#m7b5-Bm7b5-Em7b5', 'Quiz: C#m7b5-F#m7b5-Bm7b5-Em7b5', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5'), NULL, 8, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル: C#m7b5-F#m7b5-Bm7b5-Em7b5', 'Battle: C#m7b5-F#m7b5-Bm7b5-Em7b5', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5'), NULL, 9, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1278, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: C#m7b5-F#m7b5-Bm7b5-Em7b5', 'Survival: C#m7b5-F#m7b5-Bm7b5-Em7b5', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5'), NULL, 10, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: 全キーまとめ', 'Quiz: All keys', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5'), NULL, 11, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1279, 'lesson', false, NULL, false, NULL,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'course-two-hand-voicing-advanced'),
  '7 Lydian dominant',
  '7 Lydian dominant',
  '7 Lydian dominant の UST 5 音ヴォイシングを練習します。',
  'Practice UST five-note voicings for 7 Lydian dominant.',
  true,
  6, 1,
  'So What / UST ヴォイシング',
  'So What / UST Voicings',
  '[]'::jsonb,
  '①デモ ②3進行×クイズ/バトル/サバイバル ③全キーまとめ',
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-demo-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, false, NULL,
   true, false,
   'thva-demo-b1-7s11', NULL,
   NULL,
   'デモ', 'Demo', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: C7-F7-Bb7-Eb7', 'Quiz: C7-F7-Bb7-Eb7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11'), NULL, 2, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル: C7-F7-Bb7-Eb7', 'Battle: C7-F7-Bb7-Eb7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11'), NULL, 3, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1280, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: C7-F7-Bb7-Eb7', 'Survival: C7-F7-Bb7-Eb7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11'), NULL, 4, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Ab7-Db7-Gb7-B7', 'Quiz: Ab7-Db7-Gb7-B7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11'), NULL, 5, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル: Ab7-Db7-Gb7-B7', 'Battle: Ab7-Db7-Gb7-B7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11'), NULL, 6, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1281, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Ab7-Db7-Gb7-B7', 'Survival: Ab7-Db7-Gb7-B7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11'), NULL, 7, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: E7-A7-D7-G7', 'Quiz: E7-A7-D7-G7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11'), NULL, 8, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル: E7-A7-D7-G7', 'Battle: E7-A7-D7-G7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11'), NULL, 9, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1282, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: E7-A7-D7-G7', 'Survival: E7-A7-D7-G7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11'), NULL, 10, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: 全キーまとめ', 'Quiz: All keys', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11'), NULL, 11, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1283, 'lesson', false, NULL, false, NULL,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'course-two-hand-voicing-advanced'),
  'マイナー II-V-I',
  'Minor II-V-I',
  'マイナー II-V-I の So What / UST マイナー II-V-I ヴォイシングを練習します。',
  'Practice So What / UST minor II-V-I voicings for Minor II-V-I.',
  true,
  7, 1,
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-demo-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, false, NULL,
   true, false,
   'thva-demo-b1-minor-ii-v-i', NULL,
   NULL,
   'デモ', 'Demo', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p1-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p1-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of Cm & Fm', 'Quiz: Key of Cm & Fm', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p1-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1284, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of Cm & Fm', 'Survival: Key of Cm & Fm', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p2-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i'), NULL, 3, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p2-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of Bbm & Ebm', 'Quiz: Key of Bbm & Ebm', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p2-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i'), NULL, 4, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1285, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of Bbm & Ebm', 'Survival: Key of Bbm & Ebm', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p3-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i'), NULL, 5, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p3-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of G#m & C#m', 'Quiz: Key of G#m & C#m', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p3-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i'), NULL, 6, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1286, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of G#m & C#m', 'Survival: Key of G#m & C#m', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p4-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i'), NULL, 7, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p4-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of F#m & Bm', 'Quiz: Key of F#m & Bm', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p4-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i'), NULL, 8, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1287, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of F#m & Bm', 'Survival: Key of F#m & Bm', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p5-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i'), NULL, 9, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p5-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of Em & Am', 'Quiz: Key of Em & Am', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p5-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i'), NULL, 10, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1288, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of Em & Am', 'Survival: Key of Em & Am', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p6-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i'), NULL, 11, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p6-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of Dm & Gm', 'Quiz: Key of Dm & Gm', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-p6-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i'), NULL, 12, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1289, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of Dm & Gm', 'Survival: Key of Dm & Gm', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i'), NULL, 13, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: 全キーまとめ', 'Quiz: All keys', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i-summary-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-minor-ii-v-i'), NULL, 14, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1290, 'lesson', false, NULL, false, NULL,
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
