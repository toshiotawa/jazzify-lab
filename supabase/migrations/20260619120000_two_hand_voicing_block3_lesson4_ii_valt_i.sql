-- 両手ヴォイシングコース(中級) Block 3 レッスン4: II-Valt-I
-- デモ + 6キーペア + 全キーまとめ × クイズ/サバイバル
BEGIN;

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (
  'thvi-b3-demo-b3-ii-valt-i',
  '両手ヴォイシング デモ (II-Valt-I)',
  'Two-hand voicing demo (II-Valt-I)',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"II-Valt-I では、II から V7alt へ上がり、♭9 から IM7 の 5th へ半音下がって着地するのじゃ。","en":"In II-Valt-I, move up from II to V7alt, then land on the IM7 5th from the flat 9."},{"speaker":"fai","ja":"II-Valt-I の流れを確認してから、弾いてみよう。","en":"Check the flow first, then try playing."},{"speaker":"jajii","ja":"V7alt の 3rd は b4 表記じゃ。最低音だけ左手、形を覚えるんじゃ。","en":"Use flat-4 spelling for the V7alt 3rd. Left hand on the bottom note only."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
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
  'lesson', 1227, 'progression', 'survival',
  '両手ヴォイシング: II-Valt-I: Key of C & F',
  'Two-hand voicing: II-Valt-I: Key of C & F',
  'easy', '', 'II-Valt-I', 'II-Valt-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"Dm7(9,11)","voicing":[52,57,60,67],"voicing_names":["E3","A3","C4","G4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Dm7","voicing":[50,57,60,65],"voicing_names":["D3","A3","C4","F4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"G7alt","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"G7alt","voicing":[53,59,63,68],"voicing_names":["F3","Cb4","Eb4","Ab4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"CM7","voicing":[52,59,62,67],"voicing_names":["E3","B3","D4","G4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"CM7","voicing":[59,64,67,74],"voicing_names":["B3","E4","G4","D5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"C6","voicing":[57,64,67,72],"voicing_names":["A3","E4","G4","C5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Gm7(9,11)","voicing":[57,62,65,72],"voicing_names":["A3","D4","F4","C5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Gm7","voicing":[55,62,65,70],"voicing_names":["G3","D4","F4","Bb4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"C7alt","voicing":[60,64,68,75],"voicing_names":["C4","Fb4","Ab4","Eb5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"C7alt","voicing":[58,64,68,73],"voicing_names":["Bb3","Fb4","Ab4","Db5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"FM7","voicing":[57,64,67,72],"voicing_names":["A3","E4","G4","C5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"FM7","voicing":[52,57,60,67],"voicing_names":["E3","A3","C4","G4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"F6","voicing":[50,57,60,65],"voicing_names":["D3","A3","C4","F4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1228, 'progression', 'survival',
  '両手ヴォイシング: II-Valt-I: Key of Bb & Eb',
  'Two-hand voicing: II-Valt-I: Key of Bb & Eb',
  'easy', '', 'II-Valt-I', 'II-Valt-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"Cm7(9,11)","voicing":[62,67,70,77],"voicing_names":["D4","G4","Bb4","F5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Cm7","voicing":[60,67,70,75],"voicing_names":["C4","G4","Bb4","Eb5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"F7alt","voicing":[65,69,73,80],"voicing_names":["F4","Bbb4","Db5","Ab5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"F7alt","voicing":[63,69,73,78],"voicing_names":["Eb4","Bbb4","Db5","Gb5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"BbM7","voicing":[62,69,72,77],"voicing_names":["D4","A4","C5","F5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"BbM7","voicing":[57,62,65,72],"voicing_names":["A3","D4","F4","C5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Bb6","voicing":[55,62,65,70],"voicing_names":["G3","D4","F4","Bb4"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Fm7(9,11)","voicing":[55,60,63,70],"voicing_names":["G3","C4","Eb4","Bb4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Fm7","voicing":[53,60,63,68],"voicing_names":["F3","C4","Eb4","Ab4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Bb7alt","voicing":[58,62,66,73],"voicing_names":["Bb3","Ebb4","Gb4","Db5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Bb7alt","voicing":[56,62,66,71],"voicing_names":["Ab3","Ebb4","Gb4","Cb5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"EbM7","voicing":[55,62,65,70],"voicing_names":["G3","D4","F4","Bb4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"EbM7","voicing":[62,67,70,77],"voicing_names":["D4","G4","Bb4","F5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Eb6","voicing":[60,67,70,75],"voicing_names":["C4","G4","Bb4","Eb5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1229, 'progression', 'survival',
  '両手ヴォイシング: II-Valt-I: Key of Ab & Db',
  'Two-hand voicing: II-Valt-I: Key of Ab & Db',
  'easy', '', 'II-Valt-I', 'II-Valt-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"Bbm7(9,11)","voicing":[60,65,68,75],"voicing_names":["C4","F4","Ab4","Eb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Bbm7","voicing":[58,65,68,73],"voicing_names":["Bb3","F4","Ab4","Db5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Eb7alt","voicing":[63,67,71,78],"voicing_names":["Eb4","Abb4","Cb5","Gb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Eb7alt","voicing":[61,67,71,76],"voicing_names":["Db4","Abb4","Cb5","Fb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"AbM7","voicing":[60,67,70,75],"voicing_names":["C4","G4","Bb4","Eb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"AbM7","voicing":[55,60,63,70],"voicing_names":["G3","C4","Eb4","Bb4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Ab6","voicing":[53,60,63,68],"voicing_names":["F3","C4","Eb4","Ab4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Ebm7(9,11)","voicing":[53,58,61,68],"voicing_names":["F3","Bb3","Db4","Ab4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Ebm7","voicing":[51,58,61,66],"voicing_names":["Eb3","Bb3","Db4","Gb4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Ab7alt","voicing":[56,60,64,71],"voicing_names":["Ab3","Dbb4","Fb4","B4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Ab7alt","voicing":[54,60,64,69],"voicing_names":["Gb3","Dbb4","Fb4","Bbb4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"DbM7","voicing":[53,60,63,68],"voicing_names":["F3","C4","Eb4","Ab4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"DbM7","voicing":[60,65,68,75],"voicing_names":["C4","F4","Ab4","Eb5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Db6","voicing":[58,65,68,73],"voicing_names":["Bb3","F4","Ab4","Db5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1230, 'progression', 'survival',
  '両手ヴォイシング: II-Valt-I: Key of Gb & B',
  'Two-hand voicing: II-Valt-I: Key of Gb & B',
  'easy', '', 'II-Valt-I', 'II-Valt-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"Abm7(9,11)","voicing":[58,63,66,73],"voicing_names":["Bb3","Eb4","Gb4","Db5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Abm7","voicing":[56,63,66,71],"voicing_names":["Ab3","Eb4","Gb4","Cb5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Db7alt","voicing":[61,65,69,76],"voicing_names":["Db4","Gbb4","Bbb4","E5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Db7alt","voicing":[59,65,69,74],"voicing_names":["Cb4","Gbb4","Bbb4","Ebb5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"GbM7","voicing":[58,65,68,73],"voicing_names":["Bb3","F4","Ab4","Db5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"GbM7","voicing":[53,58,61,68],"voicing_names":["F3","Bb3","Db4","Ab4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Gb6","voicing":[51,58,61,66],"voicing_names":["Eb3","Bb3","Db4","Gb4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"C#m7(9,11)","voicing":[63,68,71,78],"voicing_names":["D#4","G#4","B4","F#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"C#m7","voicing":[61,68,71,76],"voicing_names":["C#4","G#4","B4","E5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"F#7alt","voicing":[66,70,74,81],"voicing_names":["F#4","Bb4","D5","A5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"F#7alt","voicing":[64,70,74,79],"voicing_names":["E4","Bb4","D5","G5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"BM7","voicing":[63,70,73,78],"voicing_names":["D#4","A#4","C#5","F#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"BM7","voicing":[58,63,66,73],"voicing_names":["A#3","D#4","F#4","C#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"B6","voicing":[56,63,66,71],"voicing_names":["G#3","D#4","F#4","B4"],"key_fifths":5,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1231, 'progression', 'survival',
  '両手ヴォイシング: II-Valt-I: Key of E & A',
  'Two-hand voicing: II-Valt-I: Key of E & A',
  'easy', '', 'II-Valt-I', 'II-Valt-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"F#m7(9,11)","voicing":[56,61,64,71],"voicing_names":["G#3","C#4","E4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"F#m7","voicing":[54,61,64,69],"voicing_names":["F#3","C#4","E4","A4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"B7alt","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"B7alt","voicing":[57,63,67,72],"voicing_names":["A3","Eb4","G4","C5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"EM7","voicing":[56,63,66,71],"voicing_names":["G#3","D#4","F#4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"EM7","voicing":[63,68,71,78],"voicing_names":["D#4","G#4","B4","F#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"E6","voicing":[61,68,71,76],"voicing_names":["C#4","G#4","B4","E5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"Bm7(9,11)","voicing":[61,66,69,76],"voicing_names":["C#4","F#4","A4","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Bm7","voicing":[59,66,69,74],"voicing_names":["B3","F#4","A4","D5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"E7alt","voicing":[64,68,72,79],"voicing_names":["E4","Ab4","C5","G5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"E7alt","voicing":[62,68,72,77],"voicing_names":["D4","Ab4","C5","F5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"AM7","voicing":[61,68,71,76],"voicing_names":["C#4","G#4","B4","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"AM7","voicing":[56,61,64,71],"voicing_names":["G#3","C#4","E4","B4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"A6","voicing":[54,61,64,69],"voicing_names":["F#3","C#4","E4","A4"],"key_fifths":3,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1232, 'progression', 'survival',
  '両手ヴォイシング: II-Valt-I: Key of D & G',
  'Two-hand voicing: II-Valt-I: Key of D & G',
  'easy', '', 'II-Valt-I', 'II-Valt-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"Em7(9,11)","voicing":[54,59,62,69],"voicing_names":["F#3","B3","D4","A4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Em7","voicing":[52,59,62,67],"voicing_names":["E3","B3","D4","G4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"A7alt","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"A7alt","voicing":[55,61,65,70],"voicing_names":["G3","Db4","F4","Bb4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"DM7","voicing":[54,61,64,69],"voicing_names":["F#3","C#4","E4","A4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"DM7","voicing":[61,66,69,76],"voicing_names":["C#4","F#4","A4","E5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"D6","voicing":[59,66,69,74],"voicing_names":["B3","F#4","A4","D5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Am7(9,11)","voicing":[59,64,67,74],"voicing_names":["B3","E4","G4","D5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"Am7","voicing":[57,64,67,72],"voicing_names":["A3","E4","G4","C5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"D7alt","voicing":[62,66,70,77],"voicing_names":["D4","Gb4","Bb4","F5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"D7alt","voicing":[60,66,70,75],"voicing_names":["C4","Gb4","Bb4","Eb5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"GM7","voicing":[59,66,69,74],"voicing_names":["B3","F#4","A4","D5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"GM7","voicing":[54,59,62,69],"voicing_names":["F#3","B3","D4","A4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"G6","voicing":[52,59,62,67],"voicing_names":["E3","B3","D4","G4"],"key_fifths":1,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1233, 'progression', 'survival',
  '両手ヴォイシング: II-Valt-I: まとめ',
  'Two-hand voicing: II-Valt-I: まとめ',
  'easy', '', 'II-Valt-I', 'II-Valt-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"Dm7(9,11)","voicing":[52,57,60,67],"voicing_names":["E3","A3","C4","G4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Dm7","voicing":[50,57,60,65],"voicing_names":["D3","A3","C4","F4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"G7alt","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"G7alt","voicing":[53,59,63,68],"voicing_names":["F3","Cb4","Eb4","Ab4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"CM7","voicing":[52,59,62,67],"voicing_names":["E3","B3","D4","G4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"CM7","voicing":[59,64,67,74],"voicing_names":["B3","E4","G4","D5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"C6","voicing":[57,64,67,72],"voicing_names":["A3","E4","G4","C5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Gm7(9,11)","voicing":[57,62,65,72],"voicing_names":["A3","D4","F4","C5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Gm7","voicing":[55,62,65,70],"voicing_names":["G3","D4","F4","Bb4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"C7alt","voicing":[60,64,68,75],"voicing_names":["C4","Fb4","Ab4","Eb5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"C7alt","voicing":[58,64,68,73],"voicing_names":["Bb3","Fb4","Ab4","Db5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"FM7","voicing":[57,64,67,72],"voicing_names":["A3","E4","G4","C5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"FM7","voicing":[52,57,60,67],"voicing_names":["E3","A3","C4","G4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"F6","voicing":[50,57,60,65],"voicing_names":["D3","A3","C4","F4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Cm7(9,11)","voicing":[62,67,70,77],"voicing_names":["D4","G4","Bb4","F5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Cm7","voicing":[60,67,70,75],"voicing_names":["C4","G4","Bb4","Eb5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"F7alt","voicing":[65,69,73,80],"voicing_names":["F4","Bbb4","Db5","Ab5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"F7alt","voicing":[63,69,73,78],"voicing_names":["Eb4","Bbb4","Db5","Gb5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"BbM7","voicing":[62,69,72,77],"voicing_names":["D4","A4","C5","F5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"BbM7","voicing":[57,62,65,72],"voicing_names":["A3","D4","F4","C5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Bb6","voicing":[55,62,65,70],"voicing_names":["G3","D4","F4","Bb4"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Fm7(9,11)","voicing":[55,60,63,70],"voicing_names":["G3","C4","Eb4","Bb4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Fm7","voicing":[53,60,63,68],"voicing_names":["F3","C4","Eb4","Ab4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Bb7alt","voicing":[58,62,66,73],"voicing_names":["Bb3","Ebb4","Gb4","Db5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Bb7alt","voicing":[56,62,66,71],"voicing_names":["Ab3","Ebb4","Gb4","Cb5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"EbM7","voicing":[55,62,65,70],"voicing_names":["G3","D4","F4","Bb4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"EbM7","voicing":[62,67,70,77],"voicing_names":["D4","G4","Bb4","F5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Eb6","voicing":[60,67,70,75],"voicing_names":["C4","G4","Bb4","Eb5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Bbm7(9,11)","voicing":[60,65,68,75],"voicing_names":["C4","F4","Ab4","Eb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Bbm7","voicing":[58,65,68,73],"voicing_names":["Bb3","F4","Ab4","Db5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Eb7alt","voicing":[63,67,71,78],"voicing_names":["Eb4","Abb4","Cb5","Gb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Eb7alt","voicing":[61,67,71,76],"voicing_names":["Db4","Abb4","Cb5","Fb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"AbM7","voicing":[60,67,70,75],"voicing_names":["C4","G4","Bb4","Eb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"AbM7","voicing":[55,60,63,70],"voicing_names":["G3","C4","Eb4","Bb4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Ab6","voicing":[53,60,63,68],"voicing_names":["F3","C4","Eb4","Ab4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Ebm7(9,11)","voicing":[53,58,61,68],"voicing_names":["F3","Bb3","Db4","Ab4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Ebm7","voicing":[51,58,61,66],"voicing_names":["Eb3","Bb3","Db4","Gb4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Ab7alt","voicing":[56,60,64,71],"voicing_names":["Ab3","Dbb4","Fb4","B4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Ab7alt","voicing":[54,60,64,69],"voicing_names":["Gb3","Dbb4","Fb4","Bbb4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"DbM7","voicing":[53,60,63,68],"voicing_names":["F3","C4","Eb4","Ab4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"DbM7","voicing":[60,65,68,75],"voicing_names":["C4","F4","Ab4","Eb5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Db6","voicing":[58,65,68,73],"voicing_names":["Bb3","F4","Ab4","Db5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Abm7(9,11)","voicing":[58,63,66,73],"voicing_names":["Bb3","Eb4","Gb4","Db5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Abm7","voicing":[56,63,66,71],"voicing_names":["Ab3","Eb4","Gb4","Cb5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Db7alt","voicing":[61,65,69,76],"voicing_names":["Db4","Gbb4","Bbb4","E5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Db7alt","voicing":[59,65,69,74],"voicing_names":["Cb4","Gbb4","Bbb4","Ebb5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"GbM7","voicing":[58,65,68,73],"voicing_names":["Bb3","F4","Ab4","Db5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"GbM7","voicing":[53,58,61,68],"voicing_names":["F3","Bb3","Db4","Ab4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Gb6","voicing":[51,58,61,66],"voicing_names":["Eb3","Bb3","Db4","Gb4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"C#m7(9,11)","voicing":[63,68,71,78],"voicing_names":["D#4","G#4","B4","F#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"C#m7","voicing":[61,68,71,76],"voicing_names":["C#4","G#4","B4","E5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"F#7alt","voicing":[66,70,74,81],"voicing_names":["F#4","Bb4","D5","A5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"F#7alt","voicing":[64,70,74,79],"voicing_names":["E4","Bb4","D5","G5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"BM7","voicing":[63,70,73,78],"voicing_names":["D#4","A#4","C#5","F#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"BM7","voicing":[58,63,66,73],"voicing_names":["A#3","D#4","F#4","C#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"B6","voicing":[56,63,66,71],"voicing_names":["G#3","D#4","F#4","B4"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"F#m7(9,11)","voicing":[56,61,64,71],"voicing_names":["G#3","C#4","E4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"F#m7","voicing":[54,61,64,69],"voicing_names":["F#3","C#4","E4","A4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"B7alt","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"B7alt","voicing":[57,63,67,72],"voicing_names":["A3","Eb4","G4","C5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"EM7","voicing":[56,63,66,71],"voicing_names":["G#3","D#4","F#4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"EM7","voicing":[63,68,71,78],"voicing_names":["D#4","G#4","B4","F#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"E6","voicing":[61,68,71,76],"voicing_names":["C#4","G#4","B4","E5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"Bm7(9,11)","voicing":[61,66,69,76],"voicing_names":["C#4","F#4","A4","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Bm7","voicing":[59,66,69,74],"voicing_names":["B3","F#4","A4","D5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"E7alt","voicing":[64,68,72,79],"voicing_names":["E4","Ab4","C5","G5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"E7alt","voicing":[62,68,72,77],"voicing_names":["D4","Ab4","C5","F5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"AM7","voicing":[61,68,71,76],"voicing_names":["C#4","G#4","B4","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"AM7","voicing":[56,61,64,71],"voicing_names":["G#3","C#4","E4","B4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"A6","voicing":[54,61,64,69],"voicing_names":["F#3","C#4","E4","A4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Em7(9,11)","voicing":[54,59,62,69],"voicing_names":["F#3","B3","D4","A4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Em7","voicing":[52,59,62,67],"voicing_names":["E3","B3","D4","G4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"A7alt","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"A7alt","voicing":[55,61,65,70],"voicing_names":["G3","Db4","F4","Bb4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"DM7","voicing":[54,61,64,69],"voicing_names":["F#3","C#4","E4","A4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"DM7","voicing":[61,66,69,76],"voicing_names":["C#4","F#4","A4","E5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"D6","voicing":[59,66,69,74],"voicing_names":["B3","F#4","A4","D5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Am7(9,11)","voicing":[59,64,67,74],"voicing_names":["B3","E4","G4","D5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"Am7","voicing":[57,64,67,72],"voicing_names":["A3","E4","G4","C5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"D7alt","voicing":[62,66,70,77],"voicing_names":["D4","Gb4","Bb4","F5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"D7alt","voicing":[60,66,70,75],"voicing_names":["C4","Gb4","Bb4","Eb5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"GM7","voicing":[59,66,69,74],"voicing_names":["B3","F#4","A4","D5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"GM7","voicing":[54,59,62,69],"voicing_names":["F#3","B3","D4","A4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"G6","voicing":[52,59,62,67],"voicing_names":["E3","B3","D4","G4"],"key_fifths":1,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz'),
  'thvi-b3-quiz-b3-ii-valt-i-p1',
  'クイズ: Key of C & F',
  'Quiz: Key of C & F',
  '60秒以内に20問正解。Key of C & F の II-Valt-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of C & F II-Valt-I voicings.',
  100, 0, 4, 4, 14, 14,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz'),
  0, 1, 1, 4,
  'Dm7(9,11)',
  ARRAY['E3', 'A3', 'C4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz'),
  1, 2, 1, 4,
  'Dm7',
  ARRAY['D3', 'A3', 'C4', 'F4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz'),
  2, 3, 1, 4,
  'G7alt',
  ARRAY['G3', 'Cb4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz'),
  3, 4, 1, 4,
  'G7alt',
  ARRAY['F3', 'Cb4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz'),
  4, 5, 1, 4,
  'CM7',
  ARRAY['E3', 'B3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz'),
  5, 6, 1, 4,
  'CM7',
  ARRAY['B3', 'E4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz'),
  6, 7, 1, 4,
  'C6',
  ARRAY['A3', 'E4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz'),
  7, 8, 1, 4,
  'Gm7(9,11)',
  ARRAY['A3', 'D4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz'),
  8, 9, 1, 4,
  'Gm7',
  ARRAY['G3', 'D4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz'),
  9, 10, 1, 4,
  'C7alt',
  ARRAY['C4', 'Fb4', 'Ab4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz'),
  10, 11, 1, 4,
  'C7alt',
  ARRAY['Bb3', 'Fb4', 'Ab4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz'),
  11, 12, 1, 4,
  'FM7',
  ARRAY['A3', 'E4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz'),
  12, 13, 1, 4,
  'FM7',
  ARRAY['E3', 'A3', 'C4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz'),
  13, 14, 1, 4,
  'F6',
  ARRAY['D3', 'A3', 'C4', 'F4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz'),
  'thvi-b3-quiz-b3-ii-valt-i-p2',
  'クイズ: Key of Bb & Eb',
  'Quiz: Key of Bb & Eb',
  '60秒以内に20問正解。Key of Bb & Eb の II-Valt-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of Bb & Eb II-Valt-I voicings.',
  100, 0, 4, 4, 14, 14,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz'),
  0, 1, 1, 4,
  'Cm7(9,11)',
  ARRAY['D4', 'G4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz'),
  1, 2, 1, 4,
  'Cm7',
  ARRAY['C4', 'G4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz'),
  2, 3, 1, 4,
  'F7alt',
  ARRAY['F4', 'Bbb4', 'Db5', 'Ab5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz'),
  3, 4, 1, 4,
  'F7alt',
  ARRAY['Eb4', 'Bbb4', 'Db5', 'Gb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz'),
  4, 5, 1, 4,
  'BbM7',
  ARRAY['D4', 'A4', 'C5', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz'),
  5, 6, 1, 4,
  'BbM7',
  ARRAY['A3', 'D4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz'),
  6, 7, 1, 4,
  'Bb6',
  ARRAY['G3', 'D4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz'),
  7, 8, 1, 4,
  'Fm7(9,11)',
  ARRAY['G3', 'C4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz'),
  8, 9, 1, 4,
  'Fm7',
  ARRAY['F3', 'C4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz'),
  9, 10, 1, 4,
  'Bb7alt',
  ARRAY['Bb3', 'Ebb4', 'Gb4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz'),
  10, 11, 1, 4,
  'Bb7alt',
  ARRAY['Ab3', 'Ebb4', 'Gb4', 'Cb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz'),
  11, 12, 1, 4,
  'EbM7',
  ARRAY['G3', 'D4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz'),
  12, 13, 1, 4,
  'EbM7',
  ARRAY['D4', 'G4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz'),
  13, 14, 1, 4,
  'Eb6',
  ARRAY['C4', 'G4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz'),
  'thvi-b3-quiz-b3-ii-valt-i-p3',
  'クイズ: Key of Ab & Db',
  'Quiz: Key of Ab & Db',
  '60秒以内に20問正解。Key of Ab & Db の II-Valt-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of Ab & Db II-Valt-I voicings.',
  100, 0, 4, 4, 14, 14,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz'),
  0, 1, 1, 4,
  'Bbm7(9,11)',
  ARRAY['C4', 'F4', 'Ab4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz'),
  1, 2, 1, 4,
  'Bbm7',
  ARRAY['Bb3', 'F4', 'Ab4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz'),
  2, 3, 1, 4,
  'Eb7alt',
  ARRAY['Eb4', 'Abb4', 'Cb5', 'Gb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz'),
  3, 4, 1, 4,
  'Eb7alt',
  ARRAY['Db4', 'Abb4', 'Cb5', 'Fb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz'),
  4, 5, 1, 4,
  'AbM7',
  ARRAY['C4', 'G4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz'),
  5, 6, 1, 4,
  'AbM7',
  ARRAY['G3', 'C4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz'),
  6, 7, 1, 4,
  'Ab6',
  ARRAY['F3', 'C4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz'),
  7, 8, 1, 4,
  'Ebm7(9,11)',
  ARRAY['F3', 'Bb3', 'Db4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz'),
  8, 9, 1, 4,
  'Ebm7',
  ARRAY['Eb3', 'Bb3', 'Db4', 'Gb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz'),
  9, 10, 1, 4,
  'Ab7alt',
  ARRAY['Ab3', 'Dbb4', 'Fb4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz'),
  10, 11, 1, 4,
  'Ab7alt',
  ARRAY['Gb3', 'Dbb4', 'Fb4', 'Bbb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz'),
  11, 12, 1, 4,
  'DbM7',
  ARRAY['F3', 'C4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz'),
  12, 13, 1, 4,
  'DbM7',
  ARRAY['C4', 'F4', 'Ab4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz'),
  13, 14, 1, 4,
  'Db6',
  ARRAY['Bb3', 'F4', 'Ab4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz'),
  'thvi-b3-quiz-b3-ii-valt-i-p4',
  'クイズ: Key of Gb & B',
  'Quiz: Key of Gb & B',
  '60秒以内に20問正解。Key of Gb & B の II-Valt-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of Gb & B II-Valt-I voicings.',
  100, 0, 4, 4, 14, 14,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz'),
  0, 1, 1, 4,
  'Abm7(9,11)',
  ARRAY['Bb3', 'Eb4', 'Gb4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz'),
  1, 2, 1, 4,
  'Abm7',
  ARRAY['Ab3', 'Eb4', 'Gb4', 'Cb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz'),
  2, 3, 1, 4,
  'Db7alt',
  ARRAY['Db4', 'Gbb4', 'Bbb4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz'),
  3, 4, 1, 4,
  'Db7alt',
  ARRAY['Cb4', 'Gbb4', 'Bbb4', 'Ebb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz'),
  4, 5, 1, 4,
  'GbM7',
  ARRAY['Bb3', 'F4', 'Ab4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz'),
  5, 6, 1, 4,
  'GbM7',
  ARRAY['F3', 'Bb3', 'Db4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz'),
  6, 7, 1, 4,
  'Gb6',
  ARRAY['Eb3', 'Bb3', 'Db4', 'Gb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz'),
  7, 8, 1, 4,
  'C#m7(9,11)',
  ARRAY['D#4', 'G#4', 'B4', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz'),
  8, 9, 1, 4,
  'C#m7',
  ARRAY['C#4', 'G#4', 'B4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz'),
  9, 10, 1, 4,
  'F#7alt',
  ARRAY['F#4', 'Bb4', 'D5', 'A5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz'),
  10, 11, 1, 4,
  'F#7alt',
  ARRAY['E4', 'Bb4', 'D5', 'G5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz'),
  11, 12, 1, 4,
  'BM7',
  ARRAY['D#4', 'A#4', 'C#5', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz'),
  12, 13, 1, 4,
  'BM7',
  ARRAY['A#3', 'D#4', 'F#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz'),
  13, 14, 1, 4,
  'B6',
  ARRAY['G#3', 'D#4', 'F#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz'),
  'thvi-b3-quiz-b3-ii-valt-i-p5',
  'クイズ: Key of E & A',
  'Quiz: Key of E & A',
  '60秒以内に20問正解。Key of E & A の II-Valt-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of E & A II-Valt-I voicings.',
  100, 0, 4, 4, 14, 14,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz'),
  0, 1, 1, 4,
  'F#m7(9,11)',
  ARRAY['G#3', 'C#4', 'E4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz'),
  1, 2, 1, 4,
  'F#m7',
  ARRAY['F#3', 'C#4', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz'),
  2, 3, 1, 4,
  'B7alt',
  ARRAY['B3', 'Eb4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz'),
  3, 4, 1, 4,
  'B7alt',
  ARRAY['A3', 'Eb4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz'),
  4, 5, 1, 4,
  'EM7',
  ARRAY['G#3', 'D#4', 'F#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz'),
  5, 6, 1, 4,
  'EM7',
  ARRAY['D#4', 'G#4', 'B4', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz'),
  6, 7, 1, 4,
  'E6',
  ARRAY['C#4', 'G#4', 'B4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz'),
  7, 8, 1, 4,
  'Bm7(9,11)',
  ARRAY['C#4', 'F#4', 'A4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz'),
  8, 9, 1, 4,
  'Bm7',
  ARRAY['B3', 'F#4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz'),
  9, 10, 1, 4,
  'E7alt',
  ARRAY['E4', 'Ab4', 'C5', 'G5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz'),
  10, 11, 1, 4,
  'E7alt',
  ARRAY['D4', 'Ab4', 'C5', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz'),
  11, 12, 1, 4,
  'AM7',
  ARRAY['C#4', 'G#4', 'B4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz'),
  12, 13, 1, 4,
  'AM7',
  ARRAY['G#3', 'C#4', 'E4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz'),
  13, 14, 1, 4,
  'A6',
  ARRAY['F#3', 'C#4', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz'),
  'thvi-b3-quiz-b3-ii-valt-i-p6',
  'クイズ: Key of D & G',
  'Quiz: Key of D & G',
  '60秒以内に20問正解。Key of D & G の II-Valt-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of D & G II-Valt-I voicings.',
  100, 0, 4, 4, 14, 14,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz'),
  0, 1, 1, 4,
  'Em7(9,11)',
  ARRAY['F#3', 'B3', 'D4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz'),
  1, 2, 1, 4,
  'Em7',
  ARRAY['E3', 'B3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz'),
  2, 3, 1, 4,
  'A7alt',
  ARRAY['A3', 'Db4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz'),
  3, 4, 1, 4,
  'A7alt',
  ARRAY['G3', 'Db4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz'),
  4, 5, 1, 4,
  'DM7',
  ARRAY['F#3', 'C#4', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz'),
  5, 6, 1, 4,
  'DM7',
  ARRAY['C#4', 'F#4', 'A4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz'),
  6, 7, 1, 4,
  'D6',
  ARRAY['B3', 'F#4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz'),
  7, 8, 1, 4,
  'Am7(9,11)',
  ARRAY['B3', 'E4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz'),
  8, 9, 1, 4,
  'Am7',
  ARRAY['A3', 'E4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz'),
  9, 10, 1, 4,
  'D7alt',
  ARRAY['D4', 'Gb4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz'),
  10, 11, 1, 4,
  'D7alt',
  ARRAY['C4', 'Gb4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz'),
  11, 12, 1, 4,
  'GM7',
  ARRAY['B3', 'F#4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz'),
  12, 13, 1, 4,
  'GM7',
  ARRAY['F#3', 'B3', 'D4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz'),
  13, 14, 1, 4,
  'G6',
  ARRAY['E3', 'B3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  'thvi-b3-quiz-b3-ii-valt-i-summary',
  'クイズ: 全キーまとめ',
  'Quiz: All keys',
  '60秒以内に20問正解。全キーの II-Valt-I を順番に弾きましょう。',
  'Answer 20 questions within 60 seconds. Play II-Valt-I in all keys in order.',
  100, 0, 4, 4, 7, 7,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  0, 1, 1, 4,
  'Dm7(9,11)',
  ARRAY['E3', 'A3', 'C4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  1, 2, 1, 4,
  'Dm7',
  ARRAY['D3', 'A3', 'C4', 'F4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  2, 3, 1, 4,
  'G7alt',
  ARRAY['G3', 'Cb4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  3, 4, 1, 4,
  'G7alt',
  ARRAY['F3', 'Cb4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  4, 5, 1, 4,
  'CM7',
  ARRAY['E3', 'B3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  5, 6, 1, 4,
  'CM7',
  ARRAY['B3', 'E4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  6, 7, 1, 4,
  'C6',
  ARRAY['A3', 'E4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  7, 1, 1, 4,
  'Gm7(9,11)',
  ARRAY['A3', 'D4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  8, 2, 1, 4,
  'Gm7',
  ARRAY['G3', 'D4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  9, 3, 1, 4,
  'C7alt',
  ARRAY['C4', 'Fb4', 'Ab4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  10, 4, 1, 4,
  'C7alt',
  ARRAY['Bb3', 'Fb4', 'Ab4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  11, 5, 1, 4,
  'FM7',
  ARRAY['A3', 'E4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  12, 6, 1, 4,
  'FM7',
  ARRAY['E3', 'A3', 'C4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  13, 7, 1, 4,
  'F6',
  ARRAY['D3', 'A3', 'C4', 'F4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-14'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  14, 1, 1, 4,
  'Cm7(9,11)',
  ARRAY['D4', 'G4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  15, 2, 1, 4,
  'Cm7',
  ARRAY['C4', 'G4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-16'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  16, 3, 1, 4,
  'F7alt',
  ARRAY['F4', 'Bbb4', 'Db5', 'Ab5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-17'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  17, 4, 1, 4,
  'F7alt',
  ARRAY['Eb4', 'Bbb4', 'Db5', 'Gb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-18'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  18, 5, 1, 4,
  'BbM7',
  ARRAY['D4', 'A4', 'C5', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-19'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  19, 6, 1, 4,
  'BbM7',
  ARRAY['A3', 'D4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  20, 7, 1, 4,
  'Bb6',
  ARRAY['G3', 'D4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-21'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  21, 1, 1, 4,
  'Fm7(9,11)',
  ARRAY['G3', 'C4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-22'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  22, 2, 1, 4,
  'Fm7',
  ARRAY['F3', 'C4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-23'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  23, 3, 1, 4,
  'Bb7alt',
  ARRAY['Bb3', 'Ebb4', 'Gb4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-24'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  24, 4, 1, 4,
  'Bb7alt',
  ARRAY['Ab3', 'Ebb4', 'Gb4', 'Cb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  25, 5, 1, 4,
  'EbM7',
  ARRAY['G3', 'D4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-26'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  26, 6, 1, 4,
  'EbM7',
  ARRAY['D4', 'G4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-27'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  27, 7, 1, 4,
  'Eb6',
  ARRAY['C4', 'G4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-28'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  28, 1, 1, 4,
  'Bbm7(9,11)',
  ARRAY['C4', 'F4', 'Ab4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-29'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  29, 2, 1, 4,
  'Bbm7',
  ARRAY['Bb3', 'F4', 'Ab4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  30, 3, 1, 4,
  'Eb7alt',
  ARRAY['Eb4', 'Abb4', 'Cb5', 'Gb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-31'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  31, 4, 1, 4,
  'Eb7alt',
  ARRAY['Db4', 'Abb4', 'Cb5', 'Fb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-32'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  32, 5, 1, 4,
  'AbM7',
  ARRAY['C4', 'G4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-33'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  33, 6, 1, 4,
  'AbM7',
  ARRAY['G3', 'C4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-34'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  34, 7, 1, 4,
  'Ab6',
  ARRAY['F3', 'C4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  35, 1, 1, 4,
  'Ebm7(9,11)',
  ARRAY['F3', 'Bb3', 'Db4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-36'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  36, 2, 1, 4,
  'Ebm7',
  ARRAY['Eb3', 'Bb3', 'Db4', 'Gb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-37'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  37, 3, 1, 4,
  'Ab7alt',
  ARRAY['Ab3', 'Dbb4', 'Fb4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-38'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  38, 4, 1, 4,
  'Ab7alt',
  ARRAY['Gb3', 'Dbb4', 'Fb4', 'Bbb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-39'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  39, 5, 1, 4,
  'DbM7',
  ARRAY['F3', 'C4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  40, 6, 1, 4,
  'DbM7',
  ARRAY['C4', 'F4', 'Ab4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-41'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  41, 7, 1, 4,
  'Db6',
  ARRAY['Bb3', 'F4', 'Ab4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-42'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  42, 1, 1, 4,
  'Abm7(9,11)',
  ARRAY['Bb3', 'Eb4', 'Gb4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-43'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  43, 2, 1, 4,
  'Abm7',
  ARRAY['Ab3', 'Eb4', 'Gb4', 'Cb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-44'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  44, 3, 1, 4,
  'Db7alt',
  ARRAY['Db4', 'Gbb4', 'Bbb4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  45, 4, 1, 4,
  'Db7alt',
  ARRAY['Cb4', 'Gbb4', 'Bbb4', 'Ebb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-46'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  46, 5, 1, 4,
  'GbM7',
  ARRAY['Bb3', 'F4', 'Ab4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-47'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  47, 6, 1, 4,
  'GbM7',
  ARRAY['F3', 'Bb3', 'Db4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-48'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  48, 7, 1, 4,
  'Gb6',
  ARRAY['Eb3', 'Bb3', 'Db4', 'Gb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-49'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  49, 1, 1, 4,
  'C#m7(9,11)',
  ARRAY['D#4', 'G#4', 'B4', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  50, 2, 1, 4,
  'C#m7',
  ARRAY['C#4', 'G#4', 'B4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-51'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  51, 3, 1, 4,
  'F#7alt',
  ARRAY['F#4', 'Bb4', 'D5', 'A5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-52'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  52, 4, 1, 4,
  'F#7alt',
  ARRAY['E4', 'Bb4', 'D5', 'G5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-53'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  53, 5, 1, 4,
  'BM7',
  ARRAY['D#4', 'A#4', 'C#5', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-54'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  54, 6, 1, 4,
  'BM7',
  ARRAY['A#3', 'D#4', 'F#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-55'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  55, 7, 1, 4,
  'B6',
  ARRAY['G#3', 'D#4', 'F#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-56'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  56, 1, 1, 4,
  'F#m7(9,11)',
  ARRAY['G#3', 'C#4', 'E4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-57'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  57, 2, 1, 4,
  'F#m7',
  ARRAY['F#3', 'C#4', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-58'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  58, 3, 1, 4,
  'B7alt',
  ARRAY['B3', 'Eb4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-59'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  59, 4, 1, 4,
  'B7alt',
  ARRAY['A3', 'Eb4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-60'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  60, 5, 1, 4,
  'EM7',
  ARRAY['G#3', 'D#4', 'F#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-61'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  61, 6, 1, 4,
  'EM7',
  ARRAY['D#4', 'G#4', 'B4', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-62'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  62, 7, 1, 4,
  'E6',
  ARRAY['C#4', 'G#4', 'B4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-63'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  63, 1, 1, 4,
  'Bm7(9,11)',
  ARRAY['C#4', 'F#4', 'A4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-64'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  64, 2, 1, 4,
  'Bm7',
  ARRAY['B3', 'F#4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-65'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  65, 3, 1, 4,
  'E7alt',
  ARRAY['E4', 'Ab4', 'C5', 'G5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-66'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  66, 4, 1, 4,
  'E7alt',
  ARRAY['D4', 'Ab4', 'C5', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-67'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  67, 5, 1, 4,
  'AM7',
  ARRAY['C#4', 'G#4', 'B4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-68'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  68, 6, 1, 4,
  'AM7',
  ARRAY['G#3', 'C#4', 'E4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-69'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  69, 7, 1, 4,
  'A6',
  ARRAY['F#3', 'C#4', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-70'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  70, 1, 1, 4,
  'Em7(9,11)',
  ARRAY['F#3', 'B3', 'D4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-71'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  71, 2, 1, 4,
  'Em7',
  ARRAY['E3', 'B3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-72'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  72, 3, 1, 4,
  'A7alt',
  ARRAY['A3', 'Db4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-73'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  73, 4, 1, 4,
  'A7alt',
  ARRAY['G3', 'Db4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-74'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  74, 5, 1, 4,
  'DM7',
  ARRAY['F#3', 'C#4', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-75'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  75, 6, 1, 4,
  'DM7',
  ARRAY['C#4', 'F#4', 'A4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-76'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  76, 7, 1, 4,
  'D6',
  ARRAY['B3', 'F#4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-77'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  77, 1, 1, 4,
  'Am7(9,11)',
  ARRAY['B3', 'E4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-78'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  78, 2, 1, 4,
  'Am7',
  ARRAY['A3', 'E4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-79'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  79, 3, 1, 4,
  'D7alt',
  ARRAY['D4', 'Gb4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-80'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  80, 4, 1, 4,
  'D7alt',
  ARRAY['C4', 'Gb4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-81'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  81, 5, 1, 4,
  'GM7',
  ARRAY['B3', 'F#4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-82'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  82, 6, 1, 4,
  'GM7',
  ARRAY['F#3', 'B3', 'D4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-item-83'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
  83, 7, 1, 4,
  'G6',
  ARRAY['E3', 'B3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'II-Valt-I',
  'II-Valt-I',
  'II-Valt-I の Drop2 Resolution II-Valt-I ヴォイシングを練習します。',
  'Practice Drop 2 Resolution II-Valt-I voicings for II-Valt-I.',
  true,
  17, 3,
  'Drop 2 Resolution 基礎編',
  'Drop 2 Resolution Basics',
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-demo-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, false, NULL,
   true, false,
   'thvi-b3-demo-b3-ii-valt-i', NULL,
   NULL,
   'デモ', 'Demo', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of C & F', 'Quiz: Key of C & F', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p1-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1227, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of C & F', 'Survival: Key of C & F', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i'), NULL, 3, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of Bb & Eb', 'Quiz: Key of Bb & Eb', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p2-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i'), NULL, 4, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1228, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of Bb & Eb', 'Survival: Key of Bb & Eb', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i'), NULL, 5, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of Ab & Db', 'Quiz: Key of Ab & Db', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p3-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i'), NULL, 6, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1229, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of Ab & Db', 'Survival: Key of Ab & Db', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i'), NULL, 7, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of Gb & B', 'Quiz: Key of Gb & B', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p4-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i'), NULL, 8, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1230, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of Gb & B', 'Survival: Key of Gb & B', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i'), NULL, 9, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of E & A', 'Quiz: Key of E & A', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p5-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i'), NULL, 10, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1231, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of E & A', 'Survival: Key of E & A', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i'), NULL, 11, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of D & G', 'Quiz: Key of D & G', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-p6-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i'), NULL, 12, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1232, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of D & G', 'Survival: Key of D & G', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i'), NULL, 13, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: 全キーまとめ', 'Quiz: All keys', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i-summary-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-ii-valt-i'), NULL, 14, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1233, 'lesson', false, NULL, false, NULL,
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
