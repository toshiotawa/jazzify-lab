-- 両手ヴォイシングコース(中級) Block 3 レッスン8: マイナー II-Valt-I
-- デモ + 6キーペア + 全キーまとめ × クイズ/サバイバル
BEGIN;

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (
  'thvi-b3-demo-b3-minor-ii-valt-i',
  '両手ヴォイシング デモ (マイナー II-Valt-I)',
  'Two-hand voicing demo (Minor II-Valt-I)',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"マイナー II-Valt-I では、iiø から V7alt へ上がり、Im6(9) の 5th へ半音下がって着地するのじゃ。","en":"In minor II-Valt-I, move up from iiø to V7alt, then land on the Im6(9) 5th from the flat 9."},{"speaker":"fai","ja":"マイナー II-Valt-I の流れを確認してから、弾いてみよう。","en":"Check the flow first, then try playing."},{"speaker":"jajii","ja":"V7alt の 3rd は b4 表記じゃ。最低音だけ左手、形を覚えるんじゃ。","en":"Use flat-4 spelling for the V7alt 3rd. Left hand on the bottom note only."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
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
  'lesson', 1246, 'progression', 'survival',
  '両手ヴォイシング: マイナー II-Valt-I: Key of Cm & Fm',
  'Two-hand voicing: マイナー II-Valt-I: Key of Cm & Fm',
  'easy', '', 'Minor II-Valt-I', 'Minor II-Valt-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"Dm7b5(9,11)","voicing":[52,56,60,67],"voicing_names":["E3","Ab3","C4","G4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Dm7b5","voicing":[50,56,60,65],"voicing_names":["D3","Ab3","C4","F4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"G7alt","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"G7alt","voicing":[53,59,63,68],"voicing_names":["F3","Cb4","Eb4","Ab4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Cm6(9)","voicing":[51,57,62,67],"voicing_names":["Eb3","A3","D4","G4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"CmM7","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Cm6","voicing":[57,63,67,72],"voicing_names":["A3","Eb4","G4","C5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Gm7b5(9,11)","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Gm7b5","voicing":[55,61,65,70],"voicing_names":["G3","Db4","F4","Bb4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"C7alt","voicing":[60,64,68,75],"voicing_names":["C4","Fb4","Ab4","Eb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"C7alt","voicing":[58,64,68,73],"voicing_names":["Bb3","Fb4","Ab4","Db5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Fm6(9)","voicing":[56,62,67,72],"voicing_names":["Ab3","D4","G4","C5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"FmM7","voicing":[52,56,60,67],"voicing_names":["E3","Ab3","C4","G4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Fm6","voicing":[50,56,60,65],"voicing_names":["D3","Ab3","C4","F4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1247, 'progression', 'survival',
  '両手ヴォイシング: マイナー II-Valt-I: Key of Bbm & Ebm',
  'Two-hand voicing: マイナー II-Valt-I: Key of Bbm & Ebm',
  'easy', '', 'Minor II-Valt-I', 'Minor II-Valt-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"Cm7b5(9,11)","voicing":[62,66,70,77],"voicing_names":["D4","Gb4","Bb4","F5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Cm7b5","voicing":[60,66,70,75],"voicing_names":["C4","Gb4","Bb4","Eb5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"F7alt","voicing":[65,69,73,80],"voicing_names":["F4","Bbb4","Db5","Ab5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"F7alt","voicing":[63,69,73,78],"voicing_names":["Eb4","Bbb4","Db5","Gb5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Bbm6(9)","voicing":[61,67,72,77],"voicing_names":["Db4","G4","C5","F5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"BbmM7","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Bbm6","voicing":[55,61,65,70],"voicing_names":["G3","Db4","F4","Bb4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Fm7b5(9,11)","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Fm7b5","voicing":[53,59,63,68],"voicing_names":["F3","Cb4","Eb4","Ab4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Bb7alt","voicing":[58,62,66,73],"voicing_names":["Bb3","Ebb4","Gb4","Db5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Bb7alt","voicing":[56,62,66,71],"voicing_names":["Ab3","Ebb4","Gb4","Cb5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Ebm6(9)","voicing":[54,60,65,70],"voicing_names":["Gb3","C4","F4","Bb4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"EbmM7","voicing":[62,66,70,77],"voicing_names":["D4","Gb4","Bb4","F5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Ebm6","voicing":[60,66,70,75],"voicing_names":["C4","Gb4","Bb4","Eb5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1248, 'progression', 'survival',
  '両手ヴォイシング: マイナー II-Valt-I: Key of G#m & C#m',
  'Two-hand voicing: マイナー II-Valt-I: Key of G#m & C#m',
  'easy', '', 'Minor II-Valt-I', 'Minor II-Valt-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"A#m7b5(9,11)","voicing":[60,64,68,75],"voicing_names":["B#3","E4","G#4","D#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"A#m7b5","voicing":[58,64,68,73],"voicing_names":["A#3","E4","G#4","C#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"D#7alt","voicing":[63,67,71,78],"voicing_names":["D#4","G4","B4","F#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"D#7alt","voicing":[61,67,71,76],"voicing_names":["C#4","G4","B4","E5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"G#m6(9)","voicing":[59,65,70,75],"voicing_names":["B3","E#4","A#4","D#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"G#mM7","voicing":[55,59,63,70],"voicing_names":["F##3","B3","D#4","A#4"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"G#m6","voicing":[53,59,63,68],"voicing_names":["E#3","B3","D#4","G#4"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"D#m7b5(9,11)","voicing":[53,57,61,68],"voicing_names":["E#3","A3","C#4","G#4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"D#m7b5","voicing":[51,57,61,66],"voicing_names":["D#3","A3","C#4","F#4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"G#7alt","voicing":[56,60,64,71],"voicing_names":["G#3","C4","E4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"G#7alt","voicing":[54,60,64,69],"voicing_names":["F#3","C4","E4","A4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"C#m6(9)","voicing":[52,58,63,68],"voicing_names":["E3","A#3","D#4","G#4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"C#mM7","voicing":[60,64,68,75],"voicing_names":["B#3","E4","G#4","D#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"C#m6","voicing":[58,64,68,73],"voicing_names":["A#3","E4","G#4","C#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1249, 'progression', 'survival',
  '両手ヴォイシング: マイナー II-Valt-I: Key of F#m & Bm',
  'Two-hand voicing: マイナー II-Valt-I: Key of F#m & Bm',
  'easy', '', 'Minor II-Valt-I', 'Minor II-Valt-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"G#m7b5(9,11)","voicing":[58,62,66,73],"voicing_names":["A#3","D4","F#4","C#5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"G#m7b5","voicing":[56,62,66,71],"voicing_names":["G#3","D4","F#4","B4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"C#7alt","voicing":[61,65,69,76],"voicing_names":["C#4","F4","A4","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"C#7alt","voicing":[59,65,69,74],"voicing_names":["B3","F4","A4","D5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"F#m6(9)","voicing":[57,63,68,73],"voicing_names":["A3","D#4","G#4","C#5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"F#mM7","voicing":[53,57,61,68],"voicing_names":["E#3","A3","C#4","G#4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"F#m6","voicing":[51,57,61,66],"voicing_names":["D#3","A3","C#4","F#4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"C#m7b5(9,11)","voicing":[63,67,71,78],"voicing_names":["D#4","G4","B4","F#5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"C#m7b5","voicing":[61,67,71,76],"voicing_names":["C#4","G4","B4","E5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"F#7alt","voicing":[66,70,74,81],"voicing_names":["F#4","Bb4","D5","A5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"F#7alt","voicing":[64,70,74,79],"voicing_names":["E4","Bb4","D5","G5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Bm6(9)","voicing":[62,68,73,78],"voicing_names":["D4","G#4","C#5","F#5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"BmM7","voicing":[58,62,66,73],"voicing_names":["A#3","D4","F#4","C#5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Bm6","voicing":[56,62,66,71],"voicing_names":["G#3","D4","F#4","B4"],"key_fifths":2,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1250, 'progression', 'survival',
  '両手ヴォイシング: マイナー II-Valt-I: Key of Em & Am',
  'Two-hand voicing: マイナー II-Valt-I: Key of Em & Am',
  'easy', '', 'Minor II-Valt-I', 'Minor II-Valt-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"F#m7b5(9,11)","voicing":[56,60,64,71],"voicing_names":["G#3","C4","E4","B4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"F#m7b5","voicing":[54,60,64,69],"voicing_names":["F#3","C4","E4","A4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"B7alt","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"B7alt","voicing":[57,63,67,72],"voicing_names":["A3","Eb4","G4","C5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"Em6(9)","voicing":[55,61,66,71],"voicing_names":["G3","C#4","F#4","B4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"EmM7","voicing":[63,67,71,78],"voicing_names":["D#4","G4","B4","F#5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"Em6","voicing":[61,67,71,76],"voicing_names":["C#4","G4","B4","E5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"Bm7b5(9,11)","voicing":[61,65,69,76],"voicing_names":["C#4","F4","A4","E5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Bm7b5","voicing":[59,65,69,74],"voicing_names":["B3","F4","A4","D5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"E7alt","voicing":[64,68,72,79],"voicing_names":["E4","Ab4","C5","G5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"E7alt","voicing":[62,68,72,77],"voicing_names":["D4","Ab4","C5","F5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Am6(9)","voicing":[60,66,71,76],"voicing_names":["C4","F#4","B4","E5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"AmM7","voicing":[56,60,64,71],"voicing_names":["G#3","C4","E4","B4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Am6","voicing":[54,60,64,69],"voicing_names":["F#3","C4","E4","A4"],"key_fifths":0,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1251, 'progression', 'survival',
  '両手ヴォイシング: マイナー II-Valt-I: Key of Dm & Gm',
  'Two-hand voicing: マイナー II-Valt-I: Key of Dm & Gm',
  'easy', '', 'Minor II-Valt-I', 'Minor II-Valt-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"Em7b5(9,11)","voicing":[54,58,62,69],"voicing_names":["F#3","Bb3","D4","A4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Em7b5","voicing":[52,58,62,67],"voicing_names":["E3","Bb3","D4","G4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"A7alt","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"A7alt","voicing":[55,61,65,70],"voicing_names":["G3","Db4","F4","Bb4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Dm6(9)","voicing":[53,59,64,69],"voicing_names":["F3","B3","E4","A4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"DmM7","voicing":[61,65,69,76],"voicing_names":["C#4","F4","A4","E5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Dm6","voicing":[59,65,69,74],"voicing_names":["B3","F4","A4","D5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Am7b5(9,11)","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Am7b5","voicing":[57,63,67,72],"voicing_names":["A3","Eb4","G4","C5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"D7alt","voicing":[62,66,70,77],"voicing_names":["D4","Gb4","Bb4","F5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"D7alt","voicing":[60,66,70,75],"voicing_names":["C4","Gb4","Bb4","Eb5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Gm6(9)","voicing":[58,64,69,74],"voicing_names":["Bb3","E4","A4","D5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"GmM7","voicing":[54,58,62,69],"voicing_names":["F#3","Bb3","D4","A4"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Gm6","voicing":[52,58,62,67],"voicing_names":["E3","Bb3","D4","G4"],"key_fifths":-2,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1252, 'progression', 'survival',
  '両手ヴォイシング: マイナー II-Valt-I: まとめ',
  'Two-hand voicing: マイナー II-Valt-I: まとめ',
  'easy', '', 'Minor II-Valt-I', 'Minor II-Valt-I',
  NULL, NULL, NULL,
  'II-V-I', false, NULL,
  '[{"name":"Dm7b5(9,11)","voicing":[52,56,60,67],"voicing_names":["E3","Ab3","C4","G4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Dm7b5","voicing":[50,56,60,65],"voicing_names":["D3","Ab3","C4","F4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"G7alt","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"G7alt","voicing":[53,59,63,68],"voicing_names":["F3","Cb4","Eb4","Ab4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Cm6(9)","voicing":[51,57,62,67],"voicing_names":["Eb3","A3","D4","G4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"CmM7","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Cm6","voicing":[57,63,67,72],"voicing_names":["A3","Eb4","G4","C5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"D#m7b5(9,11)","voicing":[53,57,61,68],"voicing_names":["E#3","A3","C#4","G#4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"D#m7b5","voicing":[51,57,61,66],"voicing_names":["D#3","A3","C#4","F#4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"G#7alt","voicing":[56,60,64,71],"voicing_names":["G#3","C4","E4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"G#7alt","voicing":[54,60,64,69],"voicing_names":["F#3","C4","E4","A4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"C#m6(9)","voicing":[52,58,63,68],"voicing_names":["E3","A#3","D#4","G#4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"C#mM7","voicing":[60,64,68,75],"voicing_names":["B#3","E4","G#4","D#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"C#m6","voicing":[58,64,68,73],"voicing_names":["A#3","E4","G#4","C#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"Em7b5(9,11)","voicing":[54,58,62,69],"voicing_names":["F#3","Bb3","D4","A4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Em7b5","voicing":[52,58,62,67],"voicing_names":["E3","Bb3","D4","G4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"A7alt","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"A7alt","voicing":[55,61,65,70],"voicing_names":["G3","Db4","F4","Bb4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Dm6(9)","voicing":[53,59,64,69],"voicing_names":["F3","B3","E4","A4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"DmM7","voicing":[61,65,69,76],"voicing_names":["C#4","F4","A4","E5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Dm6","voicing":[59,65,69,74],"voicing_names":["B3","F4","A4","D5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Fm7b5(9,11)","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Fm7b5","voicing":[53,59,63,68],"voicing_names":["F3","Cb4","Eb4","Ab4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Bb7alt","voicing":[58,62,66,73],"voicing_names":["Bb3","Ebb4","Gb4","Db5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Bb7alt","voicing":[56,62,66,71],"voicing_names":["Ab3","Ebb4","Gb4","Cb5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Ebm6(9)","voicing":[54,60,65,70],"voicing_names":["Gb3","C4","F4","Bb4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"EbmM7","voicing":[62,66,70,77],"voicing_names":["D4","Gb4","Bb4","F5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Ebm6","voicing":[60,66,70,75],"voicing_names":["C4","Gb4","Bb4","Eb5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"F#m7b5(9,11)","voicing":[56,60,64,71],"voicing_names":["G#3","C4","E4","B4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"F#m7b5","voicing":[54,60,64,69],"voicing_names":["F#3","C4","E4","A4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"B7alt","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"B7alt","voicing":[57,63,67,72],"voicing_names":["A3","Eb4","G4","C5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"Em6(9)","voicing":[55,61,66,71],"voicing_names":["G3","C#4","F#4","B4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"EmM7","voicing":[63,67,71,78],"voicing_names":["D#4","G4","B4","F#5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"Em6","voicing":[61,67,71,76],"voicing_names":["C#4","G4","B4","E5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"Gm7b5(9,11)","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Gm7b5","voicing":[55,61,65,70],"voicing_names":["G3","Db4","F4","Bb4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"C7alt","voicing":[60,64,68,75],"voicing_names":["C4","Fb4","Ab4","Eb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"C7alt","voicing":[58,64,68,73],"voicing_names":["Bb3","Fb4","Ab4","Db5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Fm6(9)","voicing":[56,62,67,72],"voicing_names":["Ab3","D4","G4","C5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"FmM7","voicing":[52,56,60,67],"voicing_names":["E3","Ab3","C4","G4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Fm6","voicing":[50,56,60,65],"voicing_names":["D3","Ab3","C4","F4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"G#m7b5(9,11)","voicing":[58,62,66,73],"voicing_names":["A#3","D4","F#4","C#5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"G#m7b5","voicing":[56,62,66,71],"voicing_names":["G#3","D4","F#4","B4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"C#7alt","voicing":[61,65,69,76],"voicing_names":["C#4","F4","A4","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"C#7alt","voicing":[59,65,69,74],"voicing_names":["B3","F4","A4","D5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"F#m6(9)","voicing":[57,63,68,73],"voicing_names":["A3","D#4","G#4","C#5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"F#mM7","voicing":[53,57,61,68],"voicing_names":["E#3","A3","C#4","G#4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"F#m6","voicing":[51,57,61,66],"voicing_names":["D#3","A3","C#4","F#4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Am7b5(9,11)","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Am7b5","voicing":[57,63,67,72],"voicing_names":["A3","Eb4","G4","C5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"D7alt","voicing":[62,66,70,77],"voicing_names":["D4","Gb4","Bb4","F5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"D7alt","voicing":[60,66,70,75],"voicing_names":["C4","Gb4","Bb4","Eb5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Gm6(9)","voicing":[58,64,69,74],"voicing_names":["Bb3","E4","A4","D5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"GmM7","voicing":[54,58,62,69],"voicing_names":["F#3","Bb3","D4","A4"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Gm6","voicing":[52,58,62,67],"voicing_names":["E3","Bb3","D4","G4"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"A#m7b5(9,11)","voicing":[60,64,68,75],"voicing_names":["B#3","E4","G#4","D#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"A#m7b5","voicing":[58,64,68,73],"voicing_names":["A#3","E4","G#4","C#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"D#7alt","voicing":[63,67,71,78],"voicing_names":["D#4","G4","B4","F#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"D#7alt","voicing":[61,67,71,76],"voicing_names":["C#4","G4","B4","E5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"G#m6(9)","voicing":[59,65,70,75],"voicing_names":["B3","E#4","A#4","D#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"G#mM7","voicing":[55,59,63,70],"voicing_names":["F##3","B3","D#4","A#4"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"G#m6","voicing":[53,59,63,68],"voicing_names":["E#3","B3","D#4","G#4"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"Bm7b5(9,11)","voicing":[61,65,69,76],"voicing_names":["C#4","F4","A4","E5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Bm7b5","voicing":[59,65,69,74],"voicing_names":["B3","F4","A4","D5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"E7alt","voicing":[64,68,72,79],"voicing_names":["E4","Ab4","C5","G5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"E7alt","voicing":[62,68,72,77],"voicing_names":["D4","Ab4","C5","F5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Am6(9)","voicing":[60,66,71,76],"voicing_names":["C4","F#4","B4","E5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"AmM7","voicing":[56,60,64,71],"voicing_names":["G#3","C4","E4","B4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Am6","voicing":[54,60,64,69],"voicing_names":["F#3","C4","E4","A4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Cm7b5(9,11)","voicing":[62,66,70,77],"voicing_names":["D4","Gb4","Bb4","F5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Cm7b5","voicing":[60,66,70,75],"voicing_names":["C4","Gb4","Bb4","Eb5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"F7alt","voicing":[65,69,73,80],"voicing_names":["F4","Bbb4","Db5","Ab5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"F7alt","voicing":[63,69,73,78],"voicing_names":["Eb4","Bbb4","Db5","Gb5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Bbm6(9)","voicing":[61,67,72,77],"voicing_names":["Db4","G4","C5","F5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"BbmM7","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Bbm6","voicing":[55,61,65,70],"voicing_names":["G3","Db4","F4","Bb4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"C#m7b5(9,11)","voicing":[63,67,71,78],"voicing_names":["D#4","G4","B4","F#5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"C#m7b5","voicing":[61,67,71,76],"voicing_names":["C#4","G4","B4","E5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"F#7alt","voicing":[66,70,74,81],"voicing_names":["F#4","Bb4","D5","A5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"F#7alt","voicing":[64,70,74,79],"voicing_names":["E4","Bb4","D5","G5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Bm6(9)","voicing":[62,68,73,78],"voicing_names":["D4","G#4","C#5","F#5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"BmM7","voicing":[58,62,66,73],"voicing_names":["A#3","D4","F#4","C#5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Bm6","voicing":[56,62,66,71],"voicing_names":["G#3","D4","F#4","B4"],"key_fifths":2,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz'),
  'thvi-b3-quiz-b3-minor-ii-valt-i-p1',
  'クイズ: Key of Cm & Fm',
  'Quiz: Key of Cm & Fm',
  '60秒以内に20問正解。Key of Cm & Fm のマイナー II-Valt-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of Cm & Fm minor II-Valt-I voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz'),
  0, 1, 1, 4,
  'Dm7b5(9,11)',
  ARRAY['E3', 'Ab3', 'C4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz'),
  1, 2, 1, 4,
  'Dm7b5',
  ARRAY['D3', 'Ab3', 'C4', 'F4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz'),
  2, 3, 1, 4,
  'G7alt',
  ARRAY['G3', 'Cb4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz'),
  3, 4, 1, 4,
  'G7alt',
  ARRAY['F3', 'Cb4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz'),
  4, 5, 1, 4,
  'Cm6(9)',
  ARRAY['Eb3', 'A3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz'),
  5, 6, 1, 4,
  'CmM7',
  ARRAY['B3', 'Eb4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz'),
  6, 7, 1, 4,
  'Cm6',
  ARRAY['A3', 'Eb4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz'),
  7, 8, 1, 4,
  'Gm7b5(9,11)',
  ARRAY['A3', 'Db4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz'),
  8, 9, 1, 4,
  'Gm7b5',
  ARRAY['G3', 'Db4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz'),
  9, 10, 1, 4,
  'C7alt',
  ARRAY['C4', 'Fb4', 'Ab4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz'),
  10, 11, 1, 4,
  'C7alt',
  ARRAY['Bb3', 'Fb4', 'Ab4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz'),
  11, 12, 1, 4,
  'Fm6(9)',
  ARRAY['Ab3', 'D4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz'),
  12, 13, 1, 4,
  'FmM7',
  ARRAY['E3', 'Ab3', 'C4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz'),
  13, 14, 1, 4,
  'Fm6',
  ARRAY['D3', 'Ab3', 'C4', 'F4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz'),
  'thvi-b3-quiz-b3-minor-ii-valt-i-p2',
  'クイズ: Key of Bbm & Ebm',
  'Quiz: Key of Bbm & Ebm',
  '60秒以内に20問正解。Key of Bbm & Ebm のマイナー II-Valt-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of Bbm & Ebm minor II-Valt-I voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz'),
  0, 1, 1, 4,
  'Cm7b5(9,11)',
  ARRAY['D4', 'Gb4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz'),
  1, 2, 1, 4,
  'Cm7b5',
  ARRAY['C4', 'Gb4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz'),
  2, 3, 1, 4,
  'F7alt',
  ARRAY['F4', 'Bbb4', 'Db5', 'Ab5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz'),
  3, 4, 1, 4,
  'F7alt',
  ARRAY['Eb4', 'Bbb4', 'Db5', 'Gb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz'),
  4, 5, 1, 4,
  'Bbm6(9)',
  ARRAY['Db4', 'G4', 'C5', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz'),
  5, 6, 1, 4,
  'BbmM7',
  ARRAY['A3', 'Db4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz'),
  6, 7, 1, 4,
  'Bbm6',
  ARRAY['G3', 'Db4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz'),
  7, 8, 1, 4,
  'Fm7b5(9,11)',
  ARRAY['G3', 'Cb4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz'),
  8, 9, 1, 4,
  'Fm7b5',
  ARRAY['F3', 'Cb4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz'),
  9, 10, 1, 4,
  'Bb7alt',
  ARRAY['Bb3', 'Ebb4', 'Gb4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz'),
  10, 11, 1, 4,
  'Bb7alt',
  ARRAY['Ab3', 'Ebb4', 'Gb4', 'Cb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz'),
  11, 12, 1, 4,
  'Ebm6(9)',
  ARRAY['Gb3', 'C4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz'),
  12, 13, 1, 4,
  'EbmM7',
  ARRAY['D4', 'Gb4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz'),
  13, 14, 1, 4,
  'Ebm6',
  ARRAY['C4', 'Gb4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz'),
  'thvi-b3-quiz-b3-minor-ii-valt-i-p3',
  'クイズ: Key of G#m & C#m',
  'Quiz: Key of G#m & C#m',
  '60秒以内に20問正解。Key of G#m & C#m のマイナー II-Valt-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of G#m & C#m minor II-Valt-I voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz'),
  0, 1, 1, 4,
  'A#m7b5(9,11)',
  ARRAY['B#3', 'E4', 'G#4', 'D#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz'),
  1, 2, 1, 4,
  'A#m7b5',
  ARRAY['A#3', 'E4', 'G#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz'),
  2, 3, 1, 4,
  'D#7alt',
  ARRAY['D#4', 'G4', 'B4', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz'),
  3, 4, 1, 4,
  'D#7alt',
  ARRAY['C#4', 'G4', 'B4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz'),
  4, 5, 1, 4,
  'G#m6(9)',
  ARRAY['B3', 'E#4', 'A#4', 'D#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz'),
  5, 6, 1, 4,
  'G#mM7',
  ARRAY['F##3', 'B3', 'D#4', 'A#4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz'),
  6, 7, 1, 4,
  'G#m6',
  ARRAY['E#3', 'B3', 'D#4', 'G#4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz'),
  7, 8, 1, 4,
  'D#m7b5(9,11)',
  ARRAY['E#3', 'A3', 'C#4', 'G#4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz'),
  8, 9, 1, 4,
  'D#m7b5',
  ARRAY['D#3', 'A3', 'C#4', 'F#4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz'),
  9, 10, 1, 4,
  'G#7alt',
  ARRAY['G#3', 'C4', 'E4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz'),
  10, 11, 1, 4,
  'G#7alt',
  ARRAY['F#3', 'C4', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz'),
  11, 12, 1, 4,
  'C#m6(9)',
  ARRAY['E3', 'A#3', 'D#4', 'G#4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz'),
  12, 13, 1, 4,
  'C#mM7',
  ARRAY['B#3', 'E4', 'G#4', 'D#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz'),
  13, 14, 1, 4,
  'C#m6',
  ARRAY['A#3', 'E4', 'G#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz'),
  'thvi-b3-quiz-b3-minor-ii-valt-i-p4',
  'クイズ: Key of F#m & Bm',
  'Quiz: Key of F#m & Bm',
  '60秒以内に20問正解。Key of F#m & Bm のマイナー II-Valt-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of F#m & Bm minor II-Valt-I voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz'),
  0, 1, 1, 4,
  'G#m7b5(9,11)',
  ARRAY['A#3', 'D4', 'F#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz'),
  1, 2, 1, 4,
  'G#m7b5',
  ARRAY['G#3', 'D4', 'F#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz'),
  2, 3, 1, 4,
  'C#7alt',
  ARRAY['C#4', 'F4', 'A4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz'),
  3, 4, 1, 4,
  'C#7alt',
  ARRAY['B3', 'F4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz'),
  4, 5, 1, 4,
  'F#m6(9)',
  ARRAY['A3', 'D#4', 'G#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz'),
  5, 6, 1, 4,
  'F#mM7',
  ARRAY['E#3', 'A3', 'C#4', 'G#4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz'),
  6, 7, 1, 4,
  'F#m6',
  ARRAY['D#3', 'A3', 'C#4', 'F#4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz'),
  7, 8, 1, 4,
  'C#m7b5(9,11)',
  ARRAY['D#4', 'G4', 'B4', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz'),
  8, 9, 1, 4,
  'C#m7b5',
  ARRAY['C#4', 'G4', 'B4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz'),
  9, 10, 1, 4,
  'F#7alt',
  ARRAY['F#4', 'Bb4', 'D5', 'A5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz'),
  10, 11, 1, 4,
  'F#7alt',
  ARRAY['E4', 'Bb4', 'D5', 'G5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz'),
  11, 12, 1, 4,
  'Bm6(9)',
  ARRAY['D4', 'G#4', 'C#5', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz'),
  12, 13, 1, 4,
  'BmM7',
  ARRAY['A#3', 'D4', 'F#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz'),
  13, 14, 1, 4,
  'Bm6',
  ARRAY['G#3', 'D4', 'F#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz'),
  'thvi-b3-quiz-b3-minor-ii-valt-i-p5',
  'クイズ: Key of Em & Am',
  'Quiz: Key of Em & Am',
  '60秒以内に20問正解。Key of Em & Am のマイナー II-Valt-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of Em & Am minor II-Valt-I voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz'),
  0, 1, 1, 4,
  'F#m7b5(9,11)',
  ARRAY['G#3', 'C4', 'E4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz'),
  1, 2, 1, 4,
  'F#m7b5',
  ARRAY['F#3', 'C4', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz'),
  2, 3, 1, 4,
  'B7alt',
  ARRAY['B3', 'Eb4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz'),
  3, 4, 1, 4,
  'B7alt',
  ARRAY['A3', 'Eb4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz'),
  4, 5, 1, 4,
  'Em6(9)',
  ARRAY['G3', 'C#4', 'F#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz'),
  5, 6, 1, 4,
  'EmM7',
  ARRAY['D#4', 'G4', 'B4', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz'),
  6, 7, 1, 4,
  'Em6',
  ARRAY['C#4', 'G4', 'B4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz'),
  7, 8, 1, 4,
  'Bm7b5(9,11)',
  ARRAY['C#4', 'F4', 'A4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz'),
  8, 9, 1, 4,
  'Bm7b5',
  ARRAY['B3', 'F4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz'),
  9, 10, 1, 4,
  'E7alt',
  ARRAY['E4', 'Ab4', 'C5', 'G5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz'),
  10, 11, 1, 4,
  'E7alt',
  ARRAY['D4', 'Ab4', 'C5', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz'),
  11, 12, 1, 4,
  'Am6(9)',
  ARRAY['C4', 'F#4', 'B4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz'),
  12, 13, 1, 4,
  'AmM7',
  ARRAY['G#3', 'C4', 'E4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz'),
  13, 14, 1, 4,
  'Am6',
  ARRAY['F#3', 'C4', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz'),
  'thvi-b3-quiz-b3-minor-ii-valt-i-p6',
  'クイズ: Key of Dm & Gm',
  'Quiz: Key of Dm & Gm',
  '60秒以内に20問正解。Key of Dm & Gm のマイナー II-Valt-I を弾きましょう。',
  'Answer 20 questions within 60 seconds using Key of Dm & Gm minor II-Valt-I voicings.',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz'),
  0, 1, 1, 4,
  'Em7b5(9,11)',
  ARRAY['F#3', 'Bb3', 'D4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz'),
  1, 2, 1, 4,
  'Em7b5',
  ARRAY['E3', 'Bb3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz'),
  2, 3, 1, 4,
  'A7alt',
  ARRAY['A3', 'Db4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz'),
  3, 4, 1, 4,
  'A7alt',
  ARRAY['G3', 'Db4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz'),
  4, 5, 1, 4,
  'Dm6(9)',
  ARRAY['F3', 'B3', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz'),
  5, 6, 1, 4,
  'DmM7',
  ARRAY['C#4', 'F4', 'A4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz'),
  6, 7, 1, 4,
  'Dm6',
  ARRAY['B3', 'F4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz'),
  7, 8, 1, 4,
  'Am7b5(9,11)',
  ARRAY['B3', 'Eb4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz'),
  8, 9, 1, 4,
  'Am7b5',
  ARRAY['A3', 'Eb4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz'),
  9, 10, 1, 4,
  'D7alt',
  ARRAY['D4', 'Gb4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz'),
  10, 11, 1, 4,
  'D7alt',
  ARRAY['C4', 'Gb4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz'),
  11, 12, 1, 4,
  'Gm6(9)',
  ARRAY['Bb3', 'E4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz'),
  12, 13, 1, 4,
  'GmM7',
  ARRAY['F#3', 'Bb3', 'D4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz'),
  13, 14, 1, 4,
  'Gm6',
  ARRAY['E3', 'Bb3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  'thvi-b3-quiz-b3-minor-ii-valt-i-summary',
  'クイズ: 全キーまとめ',
  'Quiz: All keys',
  '60秒以内に20問正解。全キーのマイナー II-Valt-I を順番に弾きましょう。',
  'Answer 20 questions within 60 seconds. Play minor II-Valt-I in all keys in order.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  0, 1, 1, 4,
  'Dm7b5',
  ARRAY['D3', 'Ab3', 'C4', 'F4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  1, 2, 1, 4,
  'G7alt',
  ARRAY['G3', 'Cb4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  2, 3, 1, 4,
  'CmM7',
  ARRAY['B3', 'Eb4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  3, 1, 1, 4,
  'D#m7b5',
  ARRAY['D#3', 'A3', 'C#4', 'F#4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  4, 2, 1, 4,
  'G#7alt',
  ARRAY['G#3', 'C4', 'E4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  5, 3, 1, 4,
  'C#mM7',
  ARRAY['B#3', 'E4', 'G#4', 'D#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  6, 1, 1, 4,
  'Em7b5',
  ARRAY['E3', 'Bb3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  7, 2, 1, 4,
  'A7alt',
  ARRAY['A3', 'Db4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  8, 3, 1, 4,
  'DmM7',
  ARRAY['C#4', 'F4', 'A4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  9, 1, 1, 4,
  'Fm7b5',
  ARRAY['F3', 'Cb4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  10, 2, 1, 4,
  'Bb7alt',
  ARRAY['Bb3', 'Ebb4', 'Gb4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  11, 3, 1, 4,
  'EbmM7',
  ARRAY['D4', 'Gb4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  12, 1, 1, 4,
  'F#m7b5',
  ARRAY['F#3', 'C4', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  13, 2, 1, 4,
  'B7alt',
  ARRAY['B3', 'Eb4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-14'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  14, 3, 1, 4,
  'EmM7',
  ARRAY['D#4', 'G4', 'B4', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  15, 1, 1, 4,
  'Gm7b5',
  ARRAY['G3', 'Db4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-16'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  16, 2, 1, 4,
  'C7alt',
  ARRAY['C4', 'Fb4', 'Ab4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-17'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  17, 3, 1, 4,
  'FmM7',
  ARRAY['E3', 'Ab3', 'C4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-18'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  18, 1, 1, 4,
  'G#m7b5',
  ARRAY['G#3', 'D4', 'F#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-19'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  19, 2, 1, 4,
  'C#7alt',
  ARRAY['C#4', 'F4', 'A4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  20, 3, 1, 4,
  'F#mM7',
  ARRAY['E#3', 'A3', 'C#4', 'G#4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-21'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  21, 1, 1, 4,
  'Am7b5',
  ARRAY['A3', 'Eb4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-22'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  22, 2, 1, 4,
  'D7alt',
  ARRAY['D4', 'Gb4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-23'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  23, 3, 1, 4,
  'GmM7',
  ARRAY['F#3', 'Bb3', 'D4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-24'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  24, 1, 1, 4,
  'A#m7b5',
  ARRAY['A#3', 'E4', 'G#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  25, 2, 1, 4,
  'D#7alt',
  ARRAY['D#4', 'G4', 'B4', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-26'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  26, 3, 1, 4,
  'G#mM7',
  ARRAY['F##3', 'B3', 'D#4', 'A#4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-27'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  27, 1, 1, 4,
  'Bm7b5',
  ARRAY['B3', 'F4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-28'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  28, 2, 1, 4,
  'E7alt',
  ARRAY['E4', 'Ab4', 'C5', 'G5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-29'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  29, 3, 1, 4,
  'AmM7',
  ARRAY['G#3', 'C4', 'E4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  30, 1, 1, 4,
  'Cm7b5',
  ARRAY['C4', 'Gb4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-31'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  31, 2, 1, 4,
  'F7alt',
  ARRAY['F4', 'Bbb4', 'Db5', 'Ab5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-32'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  32, 3, 1, 4,
  'BbmM7',
  ARRAY['A3', 'Db4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-33'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  33, 1, 1, 4,
  'C#m7b5',
  ARRAY['C#4', 'G4', 'B4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-34'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  34, 2, 1, 4,
  'F#7alt',
  ARRAY['F#4', 'Bb4', 'D5', 'A5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-item-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
  35, 3, 1, 4,
  'BmM7',
  ARRAY['A#3', 'D4', 'F#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[],
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

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'マイナー II-Valt-I',
  'Minor II-Valt-I',
  'マイナー II-Valt-I の Drop2 Resolution マイナー II-Valt-I ヴォイシングを練習します。',
  'Practice Drop 2 Resolution minor II-Valt-I voicings for Minor II-Valt-I.',
  true,
  21, 3,
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-demo-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, false, NULL,
   true, false,
   'thvi-b3-demo-b3-minor-ii-valt-i', NULL,
   NULL,
   'デモ', 'Demo', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of Cm & Fm', 'Quiz: Key of Cm & Fm', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p1-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1246, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of Cm & Fm', 'Survival: Key of Cm & Fm', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i'), NULL, 3, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of Bbm & Ebm', 'Quiz: Key of Bbm & Ebm', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p2-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i'), NULL, 4, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1247, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of Bbm & Ebm', 'Survival: Key of Bbm & Ebm', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i'), NULL, 5, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of G#m & C#m', 'Quiz: Key of G#m & C#m', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p3-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i'), NULL, 6, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1248, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of G#m & C#m', 'Survival: Key of G#m & C#m', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i'), NULL, 7, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of F#m & Bm', 'Quiz: Key of F#m & Bm', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p4-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i'), NULL, 8, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1249, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of F#m & Bm', 'Survival: Key of F#m & Bm', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i'), NULL, 9, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of Em & Am', 'Quiz: Key of Em & Am', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p5-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i'), NULL, 10, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1250, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of Em & Am', 'Survival: Key of Em & Am', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i'), NULL, 11, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Key of Dm & Gm', 'Quiz: Key of Dm & Gm', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-p6-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i'), NULL, 12, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1251, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Key of Dm & Gm', 'Survival: Key of Dm & Gm', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i'), NULL, 13, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: 全キーまとめ', 'Quiz: All keys', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i-summary-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-minor-ii-valt-i'), NULL, 14, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1252, 'lesson', false, NULL, false, NULL,
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
