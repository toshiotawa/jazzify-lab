-- 両手ヴォイシングコース(中級) Block 3 レッスン5-7: Drop 2 Resolution 応用
-- mM7 / Lydian dominant 7 / m7b5 × 12 lesson_songs
BEGIN;

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (
  'thvi-b3-demo-b3-mm7',
  '両手ヴォイシング デモ (マイナーメジャーセブンス)',
  'Two-hand voicing demo (Minor major sevenths)',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"Drop2 Resolution では、声部の動きを意識しながらヴォイシングを弾くのじゃ。","en":"In Drop 2 Resolution, play voicings while following the voice leading."},{"speaker":"fai","ja":"マイナーメジャーセブンス の進行を確認してから、弾いてみよう。","en":"Check the progression first, then try playing."},{"speaker":"jajii","ja":"コード表記は mM7・7・m7b5 で統一じゃ。焦らず形を覚えるんじゃ。","en":"Chord symbols stay mM7, 7, m7b5. Take your time learning the shapes."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (
  'thvi-b3-demo-b3-7',
  '両手ヴォイシング デモ (リディアンドミナントセブンス)',
  'Two-hand voicing demo (Lydian dominant sevenths)',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"Drop2 Resolution では、声部の動きを意識しながらヴォイシングを弾くのじゃ。","en":"In Drop 2 Resolution, play voicings while following the voice leading."},{"speaker":"fai","ja":"リディアンドミナントセブンス の進行を確認してから、弾いてみよう。","en":"Check the progression first, then try playing."},{"speaker":"jajii","ja":"コード表記は mM7・7・m7b5 で統一じゃ。焦らず形を覚えるんじゃ。","en":"Chord symbols stay mM7, 7, m7b5. Take your time learning the shapes."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (
  'thvi-b3-demo-b3-m7b5',
  '両手ヴォイシング デモ (マイナーセブンスフラットファイブス)',
  'Two-hand voicing demo (Half-diminished sevenths)',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"Drop2 Resolution では、声部の動きを意識しながらヴォイシングを弾くのじゃ。","en":"In Drop 2 Resolution, play voicings while following the voice leading."},{"speaker":"fai","ja":"マイナーセブンスフラットファイブス の進行を確認してから、弾いてみよう。","en":"Check the progression first, then try playing."},{"speaker":"jajii","ja":"コード表記は mM7・7・m7b5 で統一じゃ。焦らず形を覚えるんじゃ。","en":"Chord symbols stay mM7, 7, m7b5. Take your time learning the shapes."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
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
  'lesson', 1234, 'progression', 'survival',
  '両手ヴォイシング: マイナーメジャーセブンス: CmM7-FmM7-BbmM7-EbmM7',
  'Two-hand voicing: マイナーメジャーセブンス: CmM7-FmM7-BbmM7-EbmM7',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  'mM7', false, NULL,
  '[{"name":"CmM7","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"CmM7","voicing":[57,63,67,72],"voicing_names":["A3","Eb4","G4","C5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"FmM7","voicing":[52,56,60,67],"voicing_names":["E3","Ab3","C4","G4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"FmM7","voicing":[50,56,60,65],"voicing_names":["D3","Ab3","C4","F4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"BbmM7","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"BbmM7","voicing":[55,61,65,70],"voicing_names":["G3","Db4","F4","Bb4"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"EbmM7","voicing":[62,66,70,77],"voicing_names":["D4","Gb4","Bb4","F5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"EbmM7","voicing":[60,66,70,75],"voicing_names":["C4","Gb4","Bb4","Eb5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1235, 'progression', 'survival',
  '両手ヴォイシング: マイナーメジャーセブンス: AbmM7-DbmM7-GbmM7-BmM7',
  'Two-hand voicing: マイナーメジャーセブンス: AbmM7-DbmM7-GbmM7-BmM7',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  'mM7', false, NULL,
  '[{"name":"AbmM7","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"AbmM7","voicing":[53,59,63,68],"voicing_names":["F3","Cb4","Eb4","Ab4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"DbmM7","voicing":[60,64,68,75],"voicing_names":["C4","E4","Ab4","Eb5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"DbmM7","voicing":[58,64,68,73],"voicing_names":["Bb3","E4","Ab4","Db5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"GbmM7","voicing":[53,58,61,68],"voicing_names":["F3","Bb3","Db4","Ab4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"GbmM7","voicing":[51,58,61,66],"voicing_names":["Eb3","Bb3","Db4","Gb4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"BmM7","voicing":[58,62,66,73],"voicing_names":["A#3","D4","F#4","C#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"BmM7","voicing":[56,62,66,71],"voicing_names":["G#3","D4","F#4","B4"],"key_fifths":5,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1236, 'progression', 'survival',
  '両手ヴォイシング: マイナーメジャーセブンス: EmM7-AmM7-DmM7-GmM7',
  'Two-hand voicing: マイナーメジャーセブンス: EmM7-AmM7-DmM7-GmM7',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  'mM7', false, NULL,
  '[{"name":"EmM7","voicing":[63,67,71,78],"voicing_names":["D#4","G4","B4","F#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"EmM7","voicing":[61,67,71,76],"voicing_names":["C#4","G4","B4","E5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"AmM7","voicing":[56,60,64,71],"voicing_names":["G#3","C4","E4","B4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"AmM7","voicing":[54,60,64,69],"voicing_names":["F#3","C4","E4","A4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"DmM7","voicing":[61,65,69,76],"voicing_names":["C#4","F4","A4","E5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"DmM7","voicing":[59,65,69,74],"voicing_names":["B3","F4","A4","D5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"GmM7","voicing":[54,58,62,69],"voicing_names":["F#3","Bb3","D4","A4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"GmM7","voicing":[52,58,62,67],"voicing_names":["E3","Bb3","D4","G4"],"key_fifths":1,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1237, 'progression', 'survival',
  '両手ヴォイシング: マイナーメジャーセブンス: まとめ',
  'Two-hand voicing: マイナーメジャーセブンス: まとめ',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  'mM7', false, NULL,
  '[{"name":"CmM7","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"CmM7","voicing":[57,63,67,72],"voicing_names":["A3","Eb4","G4","C5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"FmM7","voicing":[52,56,60,67],"voicing_names":["E3","Ab3","C4","G4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"FmM7","voicing":[50,56,60,65],"voicing_names":["D3","Ab3","C4","F4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"BbmM7","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"BbmM7","voicing":[55,61,65,70],"voicing_names":["G3","Db4","F4","Bb4"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"EbmM7","voicing":[62,66,70,77],"voicing_names":["D4","Gb4","Bb4","F5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"EbmM7","voicing":[60,66,70,75],"voicing_names":["C4","Gb4","Bb4","Eb5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"AbmM7","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"AbmM7","voicing":[53,59,63,68],"voicing_names":["F3","Cb4","Eb4","Ab4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"DbmM7","voicing":[60,64,68,75],"voicing_names":["C4","E4","Ab4","Eb5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"DbmM7","voicing":[58,64,68,73],"voicing_names":["Bb3","E4","Ab4","Db5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"GbmM7","voicing":[53,58,61,68],"voicing_names":["F3","Bb3","Db4","Ab4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"GbmM7","voicing":[51,58,61,66],"voicing_names":["Eb3","Bb3","Db4","Gb4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"BmM7","voicing":[58,62,66,73],"voicing_names":["A#3","D4","F#4","C#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"BmM7","voicing":[56,62,66,71],"voicing_names":["G#3","D4","F#4","B4"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"EmM7","voicing":[63,67,71,78],"voicing_names":["D#4","G4","B4","F#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"EmM7","voicing":[61,67,71,76],"voicing_names":["C#4","G4","B4","E5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"AmM7","voicing":[56,60,64,71],"voicing_names":["G#3","C4","E4","B4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"AmM7","voicing":[54,60,64,69],"voicing_names":["F#3","C4","E4","A4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"DmM7","voicing":[61,65,69,76],"voicing_names":["C#4","F4","A4","E5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"DmM7","voicing":[59,65,69,74],"voicing_names":["B3","F4","A4","D5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"GmM7","voicing":[54,58,62,69],"voicing_names":["F#3","Bb3","D4","A4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"GmM7","voicing":[52,58,62,67],"voicing_names":["E3","Bb3","D4","G4"],"key_fifths":1,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1238, 'progression', 'survival',
  '両手ヴォイシング: リディアンドミナントセブンス: C7-F7-Bb7-Eb7',
  'Two-hand voicing: リディアンドミナントセブンス: C7-F7-Bb7-Eb7',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  '7', false, NULL,
  '[{"name":"C7","voicing":[54,58,62,69],"voicing_names":["F#3","Bb3","D4","A4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"C7","voicing":[52,58,62,67],"voicing_names":["E3","Bb3","D4","G4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"F7","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"F7","voicing":[57,63,67,72],"voicing_names":["A3","Eb4","G4","C5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Bb7","voicing":[52,56,60,67],"voicing_names":["E3","Ab3","C4","G4"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Bb7","voicing":[50,56,60,65],"voicing_names":["D3","Ab3","C4","F4"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Eb7","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Eb7","voicing":[55,61,65,70],"voicing_names":["G3","Db4","F4","Bb4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1239, 'progression', 'survival',
  '両手ヴォイシング: リディアンドミナントセブンス: Ab7-Db7-Gb7-B7',
  'Two-hand voicing: リディアンドミナントセブンス: Ab7-Db7-Gb7-B7',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  '7', false, NULL,
  '[{"name":"Ab7","voicing":[62,66,70,77],"voicing_names":["D4","Gb4","Bb4","F5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Ab7","voicing":[60,66,70,75],"voicing_names":["C4","Gb4","Bb4","Eb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Db7","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Db7","voicing":[53,59,63,68],"voicing_names":["F3","Cb4","Eb4","Ab4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Gb7","voicing":[60,64,68,75],"voicing_names":["C4","Fb4","Ab4","Eb5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Gb7","voicing":[58,64,68,73],"voicing_names":["Bb3","Fb4","Ab4","Db5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"B7","voicing":[53,57,61,68],"voicing_names":["E#3","A3","C#4","G#4"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"B7","voicing":[51,57,61,66],"voicing_names":["D#3","A3","C#4","F#4"],"key_fifths":5,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1240, 'progression', 'survival',
  '両手ヴォイシング: リディアンドミナントセブンス: E7-A7-D7-G7',
  'Two-hand voicing: リディアンドミナントセブンス: E7-A7-D7-G7',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  '7', false, NULL,
  '[{"name":"E7","voicing":[58,62,66,73],"voicing_names":["A#3","D4","F#4","C#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"E7","voicing":[56,62,66,71],"voicing_names":["G#3","D4","F#4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"A7","voicing":[63,67,71,78],"voicing_names":["D#4","G4","B4","F#5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"A7","voicing":[61,67,71,76],"voicing_names":["C#4","G4","B4","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"D7","voicing":[56,60,64,71],"voicing_names":["G#3","C4","E4","B4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"D7","voicing":[54,60,64,69],"voicing_names":["F#3","C4","E4","A4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"G7","voicing":[61,65,69,76],"voicing_names":["C#4","F4","A4","E5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"G7","voicing":[59,65,69,74],"voicing_names":["B3","F4","A4","D5"],"key_fifths":1,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1241, 'progression', 'survival',
  '両手ヴォイシング: リディアンドミナントセブンス: まとめ',
  'Two-hand voicing: リディアンドミナントセブンス: まとめ',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  '7', false, NULL,
  '[{"name":"C7","voicing":[54,58,62,69],"voicing_names":["F#3","Bb3","D4","A4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"C7","voicing":[52,58,62,67],"voicing_names":["E3","Bb3","D4","G4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"F7","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"F7","voicing":[57,63,67,72],"voicing_names":["A3","Eb4","G4","C5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Bb7","voicing":[52,56,60,67],"voicing_names":["E3","Ab3","C4","G4"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Bb7","voicing":[50,56,60,65],"voicing_names":["D3","Ab3","C4","F4"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Eb7","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Eb7","voicing":[55,61,65,70],"voicing_names":["G3","Db4","F4","Bb4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Ab7","voicing":[62,66,70,77],"voicing_names":["D4","Gb4","Bb4","F5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Ab7","voicing":[60,66,70,75],"voicing_names":["C4","Gb4","Bb4","Eb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Db7","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Db7","voicing":[53,59,63,68],"voicing_names":["F3","Cb4","Eb4","Ab4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Gb7","voicing":[60,64,68,75],"voicing_names":["C4","Fb4","Ab4","Eb5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Gb7","voicing":[58,64,68,73],"voicing_names":["Bb3","Fb4","Ab4","Db5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"B7","voicing":[53,57,61,68],"voicing_names":["E#3","A3","C#4","G#4"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"B7","voicing":[51,57,61,66],"voicing_names":["D#3","A3","C#4","F#4"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"E7","voicing":[58,62,66,73],"voicing_names":["A#3","D4","F#4","C#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"E7","voicing":[56,62,66,71],"voicing_names":["G#3","D4","F#4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"A7","voicing":[63,67,71,78],"voicing_names":["D#4","G4","B4","F#5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"A7","voicing":[61,67,71,76],"voicing_names":["C#4","G4","B4","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"D7","voicing":[56,60,64,71],"voicing_names":["G#3","C4","E4","B4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"D7","voicing":[54,60,64,69],"voicing_names":["F#3","C4","E4","A4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"G7","voicing":[61,65,69,76],"voicing_names":["C#4","F4","A4","E5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"G7","voicing":[59,65,69,74],"voicing_names":["B3","F4","A4","D5"],"key_fifths":1,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1242, 'progression', 'survival',
  '両手ヴォイシング: マイナーセブンスフラットファイブス: Am7b5-Dm7b5-Gm7b5-Cm7b5',
  'Two-hand voicing: マイナーセブンスフラットファイブス: Am7b5-Dm7b5-Gm7b5-Cm7b5',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  'm7b5', false, NULL,
  '[{"name":"Am7b5","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Am7b5","voicing":[57,63,67,72],"voicing_names":["A3","Eb4","G4","C5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Dm7b5","voicing":[52,56,60,67],"voicing_names":["E3","Ab3","C4","G4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Dm7b5","voicing":[50,56,60,65],"voicing_names":["D3","Ab3","C4","F4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Gm7b5","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"Gm7b5","voicing":[55,61,65,70],"voicing_names":["G3","Db4","F4","Bb4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"Cm7b5","voicing":[62,66,70,77],"voicing_names":["D4","Gb4","Bb4","F5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Cm7b5","voicing":[60,66,70,75],"voicing_names":["C4","Gb4","Bb4","Eb5"],"key_fifths":0,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1243, 'progression', 'survival',
  '両手ヴォイシング: マイナーセブンスフラットファイブス: Fm7b5-Bbm7b5-Ebm7b5-Abm7b5',
  'Two-hand voicing: マイナーセブンスフラットファイブス: Fm7b5-Bbm7b5-Ebm7b5-Abm7b5',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  'm7b5', false, NULL,
  '[{"name":"Fm7b5","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Fm7b5","voicing":[53,59,63,68],"voicing_names":["F3","Cb4","Eb4","Ab4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Bbm7b5","voicing":[60,64,68,75],"voicing_names":["C4","E4","Ab4","Eb5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Bbm7b5","voicing":[58,64,68,73],"voicing_names":["Bb3","E4","Ab4","Db5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Ebm7b5","voicing":[53,58,61,68],"voicing_names":["F3","Bb3","Db4","Ab4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Ebm7b5","voicing":[51,58,61,66],"voicing_names":["Eb3","Bb3","Db4","Gb4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Abm7b5","voicing":[58,63,66,73],"voicing_names":["Bb3","Eb4","Gb4","Db5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Abm7b5","voicing":[56,63,66,71],"voicing_names":["Ab3","Eb4","Gb4","Cb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1244, 'progression', 'survival',
  '両手ヴォイシング: マイナーセブンスフラットファイブス: C#m7b5-F#m7b5-Bm7b5-Em7b5',
  'Two-hand voicing: マイナーセブンスフラットファイブス: C#m7b5-F#m7b5-Bm7b5-Em7b5',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  'm7b5', false, NULL,
  '[{"name":"C#m7b5","voicing":[63,67,71,78],"voicing_names":["D#4","G4","B4","F#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"C#m7b5","voicing":[61,67,71,76],"voicing_names":["C#4","G4","B4","E5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"F#m7b5","voicing":[56,60,64,71],"voicing_names":["G#3","C4","E4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"F#m7b5","voicing":[54,60,64,69],"voicing_names":["F#3","C4","E4","A4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"Bm7b5","voicing":[61,65,69,76],"voicing_names":["C#4","F4","A4","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Bm7b5","voicing":[59,65,69,74],"voicing_names":["B3","F4","A4","D5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Em7b5","voicing":[54,58,62,69],"voicing_names":["F#3","Bb3","D4","A4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Em7b5","voicing":[52,58,62,67],"voicing_names":["E3","Bb3","D4","G4"],"key_fifths":2,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1245, 'progression', 'survival',
  '両手ヴォイシング: マイナーセブンスフラットファイブス: まとめ',
  'Two-hand voicing: マイナーセブンスフラットファイブス: まとめ',
  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',
  NULL, NULL, NULL,
  'm7b5', false, NULL,
  '[{"name":"Am7b5","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Am7b5","voicing":[57,63,67,72],"voicing_names":["A3","Eb4","G4","C5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Dm7b5","voicing":[52,56,60,67],"voicing_names":["E3","Ab3","C4","G4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Dm7b5","voicing":[50,56,60,65],"voicing_names":["D3","Ab3","C4","F4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Gm7b5","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"Gm7b5","voicing":[55,61,65,70],"voicing_names":["G3","Db4","F4","Bb4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"Cm7b5","voicing":[62,66,70,77],"voicing_names":["D4","Gb4","Bb4","F5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Cm7b5","voicing":[60,66,70,75],"voicing_names":["C4","Gb4","Bb4","Eb5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Fm7b5","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Fm7b5","voicing":[53,59,63,68],"voicing_names":["F3","Cb4","Eb4","Ab4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Bbm7b5","voicing":[60,64,68,75],"voicing_names":["C4","E4","Ab4","Eb5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Bbm7b5","voicing":[58,64,68,73],"voicing_names":["Bb3","E4","Ab4","Db5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Ebm7b5","voicing":[53,58,61,68],"voicing_names":["F3","Bb3","Db4","Ab4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Ebm7b5","voicing":[51,58,61,66],"voicing_names":["Eb3","Bb3","Db4","Gb4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Abm7b5","voicing":[58,63,66,73],"voicing_names":["Bb3","Eb4","Gb4","Db5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Abm7b5","voicing":[56,63,66,71],"voicing_names":["Ab3","Eb4","Gb4","Cb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"C#m7b5","voicing":[63,67,71,78],"voicing_names":["D#4","G4","B4","F#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"C#m7b5","voicing":[61,67,71,76],"voicing_names":["C#4","G4","B4","E5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"F#m7b5","voicing":[56,60,64,71],"voicing_names":["G#3","C4","E4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"F#m7b5","voicing":[54,60,64,69],"voicing_names":["F#3","C4","E4","A4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"Bm7b5","voicing":[61,65,69,76],"voicing_names":["C#4","F4","A4","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Bm7b5","voicing":[59,65,69,74],"voicing_names":["B3","F4","A4","D5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Em7b5","voicing":[54,58,62,69],"voicing_names":["F#3","Bb3","D4","A4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Em7b5","voicing":[52,58,62,67],"voicing_names":["E3","Bb3","D4","G4"],"key_fifths":2,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-quiz'),
  'thvi-b3-quiz-b3-mm7-p1',
  'クイズ: CmM7-FmM7-BbmM7-EbmM7',
  'Quiz: CmM7-FmM7-BbmM7-EbmM7',
  '60秒以内に20問正解。CmM7-FmM7-BbmM7-EbmM7 の Drop2 Resolution を弾きましょう。',
  'Answer 20 questions within 60 seconds using CmM7-FmM7-BbmM7-EbmM7 Drop 2 Resolution voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-quiz'),
  0, 1, 1, 4,
  'CmM7',
  ARRAY['B3', 'Eb4', 'G4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-quiz'),
  1, 1, 3, 4,
  'CmM7',
  ARRAY['A3', 'Eb4', 'G4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-quiz'),
  2, 2, 1, 4,
  'FmM7',
  ARRAY['E3', 'Ab3', 'C4', 'G4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-quiz'),
  3, 2, 3, 4,
  'FmM7',
  ARRAY['D3', 'Ab3', 'C4', 'F4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-quiz'),
  4, 3, 1, 4,
  'BbmM7',
  ARRAY['A3', 'Db4', 'F4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-quiz'),
  5, 3, 3, 4,
  'BbmM7',
  ARRAY['G3', 'Db4', 'F4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-quiz'),
  6, 4, 1, 4,
  'EbmM7',
  ARRAY['D4', 'Gb4', 'Bb4', 'F5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-quiz'),
  7, 4, 3, 4,
  'EbmM7',
  ARRAY['C4', 'Gb4', 'Bb4', 'Eb5']::text[],
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

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing'),
  'thvi-b3-voicing-b3-mm7-p1',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing'),
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing-ph0'),
  0,
  'CmM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing-ph0'),
  1,
  'CmM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing-ph0'),
  2,
  'FmM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing-ph0'),
  3,
  'FmM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing-ph0-c4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing-ph0'),
  4,
  'BbmM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing-ph0-c5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing-ph0'),
  5,
  'BbmM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing-ph0-c6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing-ph0'),
  6,
  'EbmM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing-ph0-c7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing-ph0'),
  7,
  'EbmM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-quiz'),
  'thvi-b3-quiz-b3-mm7-p2',
  'クイズ: AbmM7-DbmM7-GbmM7-BmM7',
  'Quiz: AbmM7-DbmM7-GbmM7-BmM7',
  '60秒以内に20問正解。AbmM7-DbmM7-GbmM7-BmM7 の Drop2 Resolution を弾きましょう。',
  'Answer 20 questions within 60 seconds using AbmM7-DbmM7-GbmM7-BmM7 Drop 2 Resolution voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-quiz'),
  0, 1, 1, 4,
  'AbmM7',
  ARRAY['G3', 'Cb4', 'Eb4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-quiz'),
  1, 1, 3, 4,
  'AbmM7',
  ARRAY['F3', 'Cb4', 'Eb4', 'Ab4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-quiz'),
  2, 2, 1, 4,
  'DbmM7',
  ARRAY['C4', 'E4', 'Ab4', 'Eb5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-quiz'),
  3, 2, 3, 4,
  'DbmM7',
  ARRAY['Bb3', 'E4', 'Ab4', 'Db5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-quiz'),
  4, 3, 1, 4,
  'GbmM7',
  ARRAY['F3', 'Bb3', 'Db4', 'Ab4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-quiz'),
  5, 3, 3, 4,
  'GbmM7',
  ARRAY['Eb3', 'Bb3', 'Db4', 'Gb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-quiz'),
  6, 4, 1, 4,
  'BmM7',
  ARRAY['A#3', 'D4', 'F#4', 'C#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-quiz'),
  7, 4, 3, 4,
  'BmM7',
  ARRAY['G#3', 'D4', 'F#4', 'B4']::text[],
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

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing'),
  'thvi-b3-voicing-b3-mm7-p2',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing'),
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing-ph0'),
  0,
  'AbmM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing-ph0'),
  1,
  'AbmM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing-ph0'),
  2,
  'DbmM7',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['C4', 'E4', 'Ab4', 'Eb5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing-ph0'),
  3,
  'DbmM7',
  2, 3, 4,
  2.4, 4.8,
  ARRAY['Bb3', 'E4', 'Ab4', 'Db5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing-ph0-c4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing-ph0'),
  4,
  'GbmM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing-ph0-c5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing-ph0'),
  5,
  'GbmM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing-ph0-c6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing-ph0'),
  6,
  'BmM7',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['A#3', 'D4', 'F#4', 'C#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing-ph0-c7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing-ph0'),
  7,
  'BmM7',
  4, 3, 4,
  7.199999999999999, 9.6,
  ARRAY['G#3', 'D4', 'F#4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-quiz'),
  'thvi-b3-quiz-b3-mm7-p3',
  'クイズ: EmM7-AmM7-DmM7-GmM7',
  'Quiz: EmM7-AmM7-DmM7-GmM7',
  '60秒以内に20問正解。EmM7-AmM7-DmM7-GmM7 の Drop2 Resolution を弾きましょう。',
  'Answer 20 questions within 60 seconds using EmM7-AmM7-DmM7-GmM7 Drop 2 Resolution voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-quiz'),
  0, 1, 1, 4,
  'EmM7',
  ARRAY['D#4', 'G4', 'B4', 'F#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-quiz'),
  1, 1, 3, 4,
  'EmM7',
  ARRAY['C#4', 'G4', 'B4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-quiz'),
  2, 2, 1, 4,
  'AmM7',
  ARRAY['G#3', 'C4', 'E4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-quiz'),
  3, 2, 3, 4,
  'AmM7',
  ARRAY['F#3', 'C4', 'E4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-quiz'),
  4, 3, 1, 4,
  'DmM7',
  ARRAY['C#4', 'F4', 'A4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-quiz'),
  5, 3, 3, 4,
  'DmM7',
  ARRAY['B3', 'F4', 'A4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-quiz'),
  6, 4, 1, 4,
  'GmM7',
  ARRAY['F#3', 'Bb3', 'D4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-quiz'),
  7, 4, 3, 4,
  'GmM7',
  ARRAY['E3', 'Bb3', 'D4', 'G4']::text[],
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

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing'),
  'thvi-b3-voicing-b3-mm7-p3',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing'),
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing-ph0'),
  0,
  'EmM7',
  1, 1, 4,
  0, 2.4,
  ARRAY['D#4', 'G4', 'B4', 'F#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing-ph0'),
  1,
  'EmM7',
  1, 3, 4,
  0, 2.4,
  ARRAY['C#4', 'G4', 'B4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing-ph0'),
  2,
  'AmM7',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['G#3', 'C4', 'E4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing-ph0'),
  3,
  'AmM7',
  2, 3, 4,
  2.4, 4.8,
  ARRAY['F#3', 'C4', 'E4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing-ph0-c4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing-ph0'),
  4,
  'DmM7',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['C#4', 'F4', 'A4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing-ph0-c5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing-ph0'),
  5,
  'DmM7',
  3, 3, 4,
  4.8, 7.199999999999999,
  ARRAY['B3', 'F4', 'A4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing-ph0-c6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing-ph0'),
  6,
  'GmM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing-ph0-c7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing-ph0'),
  7,
  'GmM7',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  'thvi-b3-quiz-b3-mm7-summary',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  0, 1, 1, 4,
  'CmM7',
  ARRAY['B3', 'Eb4', 'G4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  1, 1, 3, 4,
  'CmM7',
  ARRAY['A3', 'Eb4', 'G4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  2, 2, 1, 4,
  'FmM7',
  ARRAY['E3', 'Ab3', 'C4', 'G4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  3, 2, 3, 4,
  'FmM7',
  ARRAY['D3', 'Ab3', 'C4', 'F4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  4, 3, 1, 4,
  'BbmM7',
  ARRAY['A3', 'Db4', 'F4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  5, 3, 3, 4,
  'BbmM7',
  ARRAY['G3', 'Db4', 'F4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  6, 4, 1, 4,
  'EbmM7',
  ARRAY['D4', 'Gb4', 'Bb4', 'F5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  7, 4, 3, 4,
  'EbmM7',
  ARRAY['C4', 'Gb4', 'Bb4', 'Eb5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  8, 5, 1, 4,
  'AbmM7',
  ARRAY['G3', 'Cb4', 'Eb4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  9, 5, 3, 4,
  'AbmM7',
  ARRAY['F3', 'Cb4', 'Eb4', 'Ab4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  10, 6, 1, 4,
  'DbmM7',
  ARRAY['C4', 'E4', 'Ab4', 'Eb5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  11, 6, 3, 4,
  'DbmM7',
  ARRAY['Bb3', 'E4', 'Ab4', 'Db5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  12, 7, 1, 4,
  'GbmM7',
  ARRAY['F3', 'Bb3', 'Db4', 'Ab4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  13, 7, 3, 4,
  'GbmM7',
  ARRAY['Eb3', 'Bb3', 'Db4', 'Gb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-14'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  14, 8, 1, 4,
  'BmM7',
  ARRAY['A#3', 'D4', 'F#4', 'C#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  15, 8, 3, 4,
  'BmM7',
  ARRAY['G#3', 'D4', 'F#4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-16'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  16, 9, 1, 4,
  'EmM7',
  ARRAY['D#4', 'G4', 'B4', 'F#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-17'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  17, 9, 3, 4,
  'EmM7',
  ARRAY['C#4', 'G4', 'B4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-18'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  18, 10, 1, 4,
  'AmM7',
  ARRAY['G#3', 'C4', 'E4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-19'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  19, 10, 3, 4,
  'AmM7',
  ARRAY['F#3', 'C4', 'E4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  20, 11, 1, 4,
  'DmM7',
  ARRAY['C#4', 'F4', 'A4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-21'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  21, 11, 3, 4,
  'DmM7',
  ARRAY['B3', 'F4', 'A4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-22'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  22, 12, 1, 4,
  'GmM7',
  ARRAY['F#3', 'Bb3', 'D4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-item-23'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
  23, 12, 3, 4,
  'GmM7',
  ARRAY['E3', 'Bb3', 'D4', 'G4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-quiz'),
  'thvi-b3-quiz-b3-7-p1',
  'クイズ: C7-F7-Bb7-Eb7',
  'Quiz: C7-F7-Bb7-Eb7',
  '60秒以内に20問正解。C7-F7-Bb7-Eb7 の Drop2 Resolution を弾きましょう。',
  'Answer 20 questions within 60 seconds using C7-F7-Bb7-Eb7 Drop 2 Resolution voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-quiz'),
  0, 1, 1, 4,
  'C7',
  ARRAY['F#3', 'Bb3', 'D4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-quiz'),
  1, 1, 3, 4,
  'C7',
  ARRAY['E3', 'Bb3', 'D4', 'G4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-quiz'),
  2, 2, 1, 4,
  'F7',
  ARRAY['B3', 'Eb4', 'G4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-quiz'),
  3, 2, 3, 4,
  'F7',
  ARRAY['A3', 'Eb4', 'G4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-quiz'),
  4, 3, 1, 4,
  'Bb7',
  ARRAY['E3', 'Ab3', 'C4', 'G4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-quiz'),
  5, 3, 3, 4,
  'Bb7',
  ARRAY['D3', 'Ab3', 'C4', 'F4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-quiz'),
  6, 4, 1, 4,
  'Eb7',
  ARRAY['A3', 'Db4', 'F4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-quiz'),
  7, 4, 3, 4,
  'Eb7',
  ARRAY['G3', 'Db4', 'F4', 'Bb4']::text[],
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

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing'),
  'thvi-b3-voicing-b3-7-p1',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing'),
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing-ph0'),
  0,
  'C7',
  1, 1, 4,
  0, 2.4,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing-ph0'),
  1,
  'C7',
  1, 3, 4,
  0, 2.4,
  ARRAY['E3', 'Bb3', 'D4', 'G4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing-ph0'),
  2,
  'F7',
  2, 1, 4,
  2.4, 4.8,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing-ph0'),
  3,
  'F7',
  2, 3, 4,
  2.4, 4.8,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing-ph0-c4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing-ph0'),
  4,
  'Bb7',
  3, 1, 4,
  4.8, 7.199999999999999,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing-ph0-c5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing-ph0'),
  5,
  'Bb7',
  3, 3, 4,
  4.8, 7.199999999999999,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing-ph0-c6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing-ph0'),
  6,
  'Eb7',
  4, 1, 4,
  7.199999999999999, 9.6,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing-ph0-c7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing-ph0'),
  7,
  'Eb7',
  4, 3, 4,
  7.199999999999999, 9.6,
  ARRAY['G3', 'Db4', 'F4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-quiz'),
  'thvi-b3-quiz-b3-7-p2',
  'クイズ: Ab7-Db7-Gb7-B7',
  'Quiz: Ab7-Db7-Gb7-B7',
  '60秒以内に20問正解。Ab7-Db7-Gb7-B7 の Drop2 Resolution を弾きましょう。',
  'Answer 20 questions within 60 seconds using Ab7-Db7-Gb7-B7 Drop 2 Resolution voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-quiz'),
  0, 1, 1, 4,
  'Ab7',
  ARRAY['D4', 'Gb4', 'Bb4', 'F5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-quiz'),
  1, 1, 3, 4,
  'Ab7',
  ARRAY['C4', 'Gb4', 'Bb4', 'Eb5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-quiz'),
  2, 2, 1, 4,
  'Db7',
  ARRAY['G3', 'Cb4', 'Eb4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-quiz'),
  3, 2, 3, 4,
  'Db7',
  ARRAY['F3', 'Cb4', 'Eb4', 'Ab4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-quiz'),
  4, 3, 1, 4,
  'Gb7',
  ARRAY['C4', 'Fb4', 'Ab4', 'Eb5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-quiz'),
  5, 3, 3, 4,
  'Gb7',
  ARRAY['Bb3', 'Fb4', 'Ab4', 'Db5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-quiz'),
  6, 4, 1, 4,
  'B7',
  ARRAY['E#3', 'A3', 'C#4', 'G#4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-quiz'),
  7, 4, 3, 4,
  'B7',
  ARRAY['D#3', 'A3', 'C#4', 'F#4']::text[],
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

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing'),
  'thvi-b3-voicing-b3-7-p2',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing'),
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing-ph0'),
  0,
  'Ab7',
  1, 1, 4,
  0, 2.4,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing-ph0'),
  1,
  'Ab7',
  1, 3, 4,
  0, 2.4,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing-ph0'),
  2,
  'Db7',
  2, 1, 4,
  2.4, 4.8,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing-ph0'),
  3,
  'Db7',
  2, 3, 4,
  2.4, 4.8,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing-ph0-c4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing-ph0'),
  4,
  'Gb7',
  3, 1, 4,
  4.8, 7.199999999999999,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing-ph0-c5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing-ph0'),
  5,
  'Gb7',
  3, 3, 4,
  4.8, 7.199999999999999,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing-ph0-c6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing-ph0'),
  6,
  'B7',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['E#3', 'A3', 'C#4', 'G#4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing-ph0-c7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing-ph0'),
  7,
  'B7',
  4, 3, 4,
  7.199999999999999, 9.6,
  ARRAY['D#3', 'A3', 'C#4', 'F#4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-quiz'),
  'thvi-b3-quiz-b3-7-p3',
  'クイズ: E7-A7-D7-G7',
  'Quiz: E7-A7-D7-G7',
  '60秒以内に20問正解。E7-A7-D7-G7 の Drop2 Resolution を弾きましょう。',
  'Answer 20 questions within 60 seconds using E7-A7-D7-G7 Drop 2 Resolution voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-quiz'),
  0, 1, 1, 4,
  'E7',
  ARRAY['A#3', 'D4', 'F#4', 'C#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-quiz'),
  1, 1, 3, 4,
  'E7',
  ARRAY['G#3', 'D4', 'F#4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-quiz'),
  2, 2, 1, 4,
  'A7',
  ARRAY['D#4', 'G4', 'B4', 'F#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-quiz'),
  3, 2, 3, 4,
  'A7',
  ARRAY['C#4', 'G4', 'B4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-quiz'),
  4, 3, 1, 4,
  'D7',
  ARRAY['G#3', 'C4', 'E4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-quiz'),
  5, 3, 3, 4,
  'D7',
  ARRAY['F#3', 'C4', 'E4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-quiz'),
  6, 4, 1, 4,
  'G7',
  ARRAY['C#4', 'F4', 'A4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-quiz'),
  7, 4, 3, 4,
  'G7',
  ARRAY['B3', 'F4', 'A4', 'D5']::text[],
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

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing'),
  'thvi-b3-voicing-b3-7-p3',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing'),
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing-ph0'),
  0,
  'E7',
  1, 1, 4,
  0, 2.4,
  ARRAY['A#3', 'D4', 'F#4', 'C#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing-ph0'),
  1,
  'E7',
  1, 3, 4,
  0, 2.4,
  ARRAY['G#3', 'D4', 'F#4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing-ph0'),
  2,
  'A7',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['D#4', 'G4', 'B4', 'F#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing-ph0'),
  3,
  'A7',
  2, 3, 4,
  2.4, 4.8,
  ARRAY['C#4', 'G4', 'B4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing-ph0-c4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing-ph0'),
  4,
  'D7',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['G#3', 'C4', 'E4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing-ph0-c5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing-ph0'),
  5,
  'D7',
  3, 3, 4,
  4.8, 7.199999999999999,
  ARRAY['F#3', 'C4', 'E4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing-ph0-c6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing-ph0'),
  6,
  'G7',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['C#4', 'F4', 'A4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing-ph0-c7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing-ph0'),
  7,
  'G7',
  4, 3, 4,
  7.199999999999999, 9.6,
  ARRAY['B3', 'F4', 'A4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  'thvi-b3-quiz-b3-7-summary',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  0, 1, 1, 4,
  'C7',
  ARRAY['F#3', 'Bb3', 'D4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  1, 1, 3, 4,
  'C7',
  ARRAY['E3', 'Bb3', 'D4', 'G4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  2, 2, 1, 4,
  'F7',
  ARRAY['B3', 'Eb4', 'G4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  3, 2, 3, 4,
  'F7',
  ARRAY['A3', 'Eb4', 'G4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  4, 3, 1, 4,
  'Bb7',
  ARRAY['E3', 'Ab3', 'C4', 'G4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  5, 3, 3, 4,
  'Bb7',
  ARRAY['D3', 'Ab3', 'C4', 'F4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  6, 4, 1, 4,
  'Eb7',
  ARRAY['A3', 'Db4', 'F4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  7, 4, 3, 4,
  'Eb7',
  ARRAY['G3', 'Db4', 'F4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  8, 5, 1, 4,
  'Ab7',
  ARRAY['D4', 'Gb4', 'Bb4', 'F5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  9, 5, 3, 4,
  'Ab7',
  ARRAY['C4', 'Gb4', 'Bb4', 'Eb5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  10, 6, 1, 4,
  'Db7',
  ARRAY['G3', 'Cb4', 'Eb4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  11, 6, 3, 4,
  'Db7',
  ARRAY['F3', 'Cb4', 'Eb4', 'Ab4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  12, 7, 1, 4,
  'Gb7',
  ARRAY['C4', 'Fb4', 'Ab4', 'Eb5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  13, 7, 3, 4,
  'Gb7',
  ARRAY['Bb3', 'Fb4', 'Ab4', 'Db5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-14'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  14, 8, 1, 4,
  'B7',
  ARRAY['E#3', 'A3', 'C#4', 'G#4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  15, 8, 3, 4,
  'B7',
  ARRAY['D#3', 'A3', 'C#4', 'F#4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-16'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  16, 9, 1, 4,
  'E7',
  ARRAY['A#3', 'D4', 'F#4', 'C#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-17'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  17, 9, 3, 4,
  'E7',
  ARRAY['G#3', 'D4', 'F#4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-18'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  18, 10, 1, 4,
  'A7',
  ARRAY['D#4', 'G4', 'B4', 'F#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-19'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  19, 10, 3, 4,
  'A7',
  ARRAY['C#4', 'G4', 'B4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  20, 11, 1, 4,
  'D7',
  ARRAY['G#3', 'C4', 'E4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-21'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  21, 11, 3, 4,
  'D7',
  ARRAY['F#3', 'C4', 'E4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-22'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  22, 12, 1, 4,
  'G7',
  ARRAY['C#4', 'F4', 'A4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-item-23'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
  23, 12, 3, 4,
  'G7',
  ARRAY['B3', 'F4', 'A4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-quiz'),
  'thvi-b3-quiz-b3-m7b5-p1',
  'クイズ: Am7b5-Dm7b5-Gm7b5-Cm7b5',
  'Quiz: Am7b5-Dm7b5-Gm7b5-Cm7b5',
  '60秒以内に20問正解。Am7b5-Dm7b5-Gm7b5-Cm7b5 の Drop2 Resolution を弾きましょう。',
  'Answer 20 questions within 60 seconds using Am7b5-Dm7b5-Gm7b5-Cm7b5 Drop 2 Resolution voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-quiz'),
  0, 1, 1, 4,
  'Am7b5',
  ARRAY['B3', 'Eb4', 'G4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-quiz'),
  1, 1, 3, 4,
  'Am7b5',
  ARRAY['A3', 'Eb4', 'G4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-quiz'),
  2, 2, 1, 4,
  'Dm7b5',
  ARRAY['E3', 'Ab3', 'C4', 'G4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-quiz'),
  3, 2, 3, 4,
  'Dm7b5',
  ARRAY['D3', 'Ab3', 'C4', 'F4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-quiz'),
  4, 3, 1, 4,
  'Gm7b5',
  ARRAY['A3', 'Db4', 'F4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-quiz'),
  5, 3, 3, 4,
  'Gm7b5',
  ARRAY['G3', 'Db4', 'F4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-quiz'),
  6, 4, 1, 4,
  'Cm7b5',
  ARRAY['D4', 'Gb4', 'Bb4', 'F5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-quiz'),
  7, 4, 3, 4,
  'Cm7b5',
  ARRAY['C4', 'Gb4', 'Bb4', 'Eb5']::text[],
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
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing'),
  'thvi-b3-voicing-b3-m7b5-p1',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing'),
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing-ph0'),
  0,
  'Am7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing-ph0'),
  1,
  'Am7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing-ph0'),
  2,
  'Dm7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing-ph0'),
  3,
  'Dm7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing-ph0-c4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing-ph0'),
  4,
  'Gm7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing-ph0-c5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing-ph0'),
  5,
  'Gm7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing-ph0-c6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing-ph0'),
  6,
  'Cm7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing-ph0-c7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing-ph0'),
  7,
  'Cm7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-quiz'),
  'thvi-b3-quiz-b3-m7b5-p2',
  'クイズ: Fm7b5-Bbm7b5-Ebm7b5-Abm7b5',
  'Quiz: Fm7b5-Bbm7b5-Ebm7b5-Abm7b5',
  '60秒以内に20問正解。Fm7b5-Bbm7b5-Ebm7b5-Abm7b5 の Drop2 Resolution を弾きましょう。',
  'Answer 20 questions within 60 seconds using Fm7b5-Bbm7b5-Ebm7b5-Abm7b5 Drop 2 Resolution voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-quiz'),
  0, 1, 1, 4,
  'Fm7b5',
  ARRAY['G3', 'Cb4', 'Eb4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-quiz'),
  1, 1, 3, 4,
  'Fm7b5',
  ARRAY['F3', 'Cb4', 'Eb4', 'Ab4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-quiz'),
  2, 2, 1, 4,
  'Bbm7b5',
  ARRAY['C4', 'E4', 'Ab4', 'Eb5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-quiz'),
  3, 2, 3, 4,
  'Bbm7b5',
  ARRAY['Bb3', 'E4', 'Ab4', 'Db5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-quiz'),
  4, 3, 1, 4,
  'Ebm7b5',
  ARRAY['F3', 'Bb3', 'Db4', 'Ab4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-quiz'),
  5, 3, 3, 4,
  'Ebm7b5',
  ARRAY['Eb3', 'Bb3', 'Db4', 'Gb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-quiz'),
  6, 4, 1, 4,
  'Abm7b5',
  ARRAY['Bb3', 'Eb4', 'Gb4', 'Db5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-quiz'),
  7, 4, 3, 4,
  'Abm7b5',
  ARRAY['Ab3', 'Eb4', 'Gb4', 'Cb5']::text[],
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
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing'),
  'thvi-b3-voicing-b3-m7b5-p2',
  'バトル: Fm7b5-Bbm7b5-Ebm7b5-Abm7b5',
  'Ear training: Fm7b5-Bbm7b5-Ebm7b5-Abm7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing'),
  0,
  'Fm7b5-Bbm7b5-Ebm7b5-Abm7b5',
  'Fm7b5-Bbm7b5-Ebm7b5-Abm7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing-ph0'),
  0,
  'Fm7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing-ph0'),
  1,
  'Fm7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing-ph0'),
  2,
  'Bbm7b5',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['C4', 'E4', 'Ab4', 'Eb5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing-ph0'),
  3,
  'Bbm7b5',
  2, 3, 4,
  2.4, 4.8,
  ARRAY['Bb3', 'E4', 'Ab4', 'Db5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing-ph0-c4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing-ph0'),
  4,
  'Ebm7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing-ph0-c5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing-ph0'),
  5,
  'Ebm7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing-ph0-c6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing-ph0'),
  6,
  'Abm7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing-ph0-c7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing-ph0'),
  7,
  'Abm7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-quiz'),
  'thvi-b3-quiz-b3-m7b5-p3',
  'クイズ: C#m7b5-F#m7b5-Bm7b5-Em7b5',
  'Quiz: C#m7b5-F#m7b5-Bm7b5-Em7b5',
  '60秒以内に20問正解。C#m7b5-F#m7b5-Bm7b5-Em7b5 の Drop2 Resolution を弾きましょう。',
  'Answer 20 questions within 60 seconds using C#m7b5-F#m7b5-Bm7b5-Em7b5 Drop 2 Resolution voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-quiz'),
  0, 1, 1, 4,
  'C#m7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-quiz'),
  1, 1, 3, 4,
  'C#m7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-quiz'),
  2, 2, 1, 4,
  'F#m7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-quiz'),
  3, 2, 3, 4,
  'F#m7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-quiz'),
  4, 3, 1, 4,
  'Bm7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-quiz'),
  5, 3, 3, 4,
  'Bm7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-quiz'),
  6, 4, 1, 4,
  'Em7b5',
  ARRAY['F#3', 'Bb3', 'D4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-quiz'),
  7, 4, 3, 4,
  'Em7b5',
  ARRAY['E3', 'Bb3', 'D4', 'G4']::text[],
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
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing'),
  'thvi-b3-voicing-b3-m7b5-p3',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing'),
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing-ph0'),
  0,
  'C#m7b5',
  1, 1, 4,
  0, 2.4,
  ARRAY['D#4', 'G4', 'B4', 'F#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing-ph0'),
  1,
  'C#m7b5',
  1, 3, 4,
  0, 2.4,
  ARRAY['C#4', 'G4', 'B4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing-ph0'),
  2,
  'F#m7b5',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['G#3', 'C4', 'E4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing-ph0'),
  3,
  'F#m7b5',
  2, 3, 4,
  2.4, 4.8,
  ARRAY['F#3', 'C4', 'E4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing-ph0-c4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing-ph0'),
  4,
  'Bm7b5',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['C#4', 'F4', 'A4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing-ph0-c5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing-ph0'),
  5,
  'Bm7b5',
  3, 3, 4,
  4.8, 7.199999999999999,
  ARRAY['B3', 'F4', 'A4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing-ph0-c6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing-ph0'),
  6,
  'Em7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing-ph0-c7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing-ph0'),
  7,
  'Em7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  'thvi-b3-quiz-b3-m7b5-summary',
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
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  0, 1, 1, 4,
  'Am7b5',
  ARRAY['B3', 'Eb4', 'G4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  1, 1, 3, 4,
  'Am7b5',
  ARRAY['A3', 'Eb4', 'G4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  2, 2, 1, 4,
  'Dm7b5',
  ARRAY['E3', 'Ab3', 'C4', 'G4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  3, 2, 3, 4,
  'Dm7b5',
  ARRAY['D3', 'Ab3', 'C4', 'F4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  4, 3, 1, 4,
  'Gm7b5',
  ARRAY['A3', 'Db4', 'F4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  5, 3, 3, 4,
  'Gm7b5',
  ARRAY['G3', 'Db4', 'F4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  6, 4, 1, 4,
  'Cm7b5',
  ARRAY['D4', 'Gb4', 'Bb4', 'F5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  7, 4, 3, 4,
  'Cm7b5',
  ARRAY['C4', 'Gb4', 'Bb4', 'Eb5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  8, 5, 1, 4,
  'Fm7b5',
  ARRAY['G3', 'Cb4', 'Eb4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  9, 5, 3, 4,
  'Fm7b5',
  ARRAY['F3', 'Cb4', 'Eb4', 'Ab4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  10, 6, 1, 4,
  'Bbm7b5',
  ARRAY['C4', 'E4', 'Ab4', 'Eb5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  11, 6, 3, 4,
  'Bbm7b5',
  ARRAY['Bb3', 'E4', 'Ab4', 'Db5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  12, 7, 1, 4,
  'Ebm7b5',
  ARRAY['F3', 'Bb3', 'Db4', 'Ab4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  13, 7, 3, 4,
  'Ebm7b5',
  ARRAY['Eb3', 'Bb3', 'Db4', 'Gb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-14'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  14, 8, 1, 4,
  'Abm7b5',
  ARRAY['Bb3', 'Eb4', 'Gb4', 'Db5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  15, 8, 3, 4,
  'Abm7b5',
  ARRAY['Ab3', 'Eb4', 'Gb4', 'Cb5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-16'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  16, 9, 1, 4,
  'C#m7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-17'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  17, 9, 3, 4,
  'C#m7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-18'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  18, 10, 1, 4,
  'F#m7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-19'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  19, 10, 3, 4,
  'F#m7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  20, 11, 1, 4,
  'Bm7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-21'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  21, 11, 3, 4,
  'Bm7b5',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-22'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  22, 12, 1, 4,
  'Em7b5',
  ARRAY['F#3', 'Bb3', 'D4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-item-23'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
  23, 12, 3, 4,
  'Em7b5',
  ARRAY['E3', 'Bb3', 'D4', 'G4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'マイナーメジャーセブンス',
  'Minor major sevenths',
  'マイナーメジャーセブンス の Drop2 Resolution ヴォイシングを練習します。',
  'Practice Drop 2 Resolution voicings for Minor major sevenths.',
  true,
  18, 3,
  'Drop 2 Resolution 基礎編',
  'Drop 2 Resolution Basics',
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-demo-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, false, NULL,
   true, false,
   'thvi-b3-demo-b3-mm7', NULL,
   NULL,
   'デモ', 'Demo', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: CmM7-FmM7-BbmM7-EbmM7', 'Quiz: CmM7-FmM7-BbmM7-EbmM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7'), NULL, 2, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル: CmM7-FmM7-BbmM7-EbmM7', 'Battle: CmM7-FmM7-BbmM7-EbmM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p1-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7'), NULL, 3, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1234, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: CmM7-FmM7-BbmM7-EbmM7', 'Survival: CmM7-FmM7-BbmM7-EbmM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7'), NULL, 4, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: AbmM7-DbmM7-GbmM7-BmM7', 'Quiz: AbmM7-DbmM7-GbmM7-BmM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7'), NULL, 5, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル: AbmM7-DbmM7-GbmM7-BmM7', 'Battle: AbmM7-DbmM7-GbmM7-BmM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p2-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7'), NULL, 6, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1235, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: AbmM7-DbmM7-GbmM7-BmM7', 'Survival: AbmM7-DbmM7-GbmM7-BmM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7'), NULL, 7, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: EmM7-AmM7-DmM7-GmM7', 'Quiz: EmM7-AmM7-DmM7-GmM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7'), NULL, 8, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル: EmM7-AmM7-DmM7-GmM7', 'Battle: EmM7-AmM7-DmM7-GmM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-p3-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7'), NULL, 9, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1236, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: EmM7-AmM7-DmM7-GmM7', 'Survival: EmM7-AmM7-DmM7-GmM7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7'), NULL, 10, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: 全キーまとめ', 'Quiz: All keys', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7-summary-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-mm7'), NULL, 11, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1237, 'lesson', false, NULL, false, NULL,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'リディアンドミナントセブンス',
  'Lydian dominant sevenths',
  'リディアンドミナントセブンス の Drop2 Resolution ヴォイシングを練習します。',
  'Practice Drop 2 Resolution voicings for Lydian dominant sevenths.',
  true,
  19, 3,
  'Drop 2 Resolution 基礎編',
  'Drop 2 Resolution Basics',
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-demo-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, false, NULL,
   true, false,
   'thvi-b3-demo-b3-7', NULL,
   NULL,
   'デモ', 'Demo', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: C7-F7-Bb7-Eb7', 'Quiz: C7-F7-Bb7-Eb7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7'), NULL, 2, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル: C7-F7-Bb7-Eb7', 'Battle: C7-F7-Bb7-Eb7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p1-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7'), NULL, 3, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1238, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: C7-F7-Bb7-Eb7', 'Survival: C7-F7-Bb7-Eb7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7'), NULL, 4, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Ab7-Db7-Gb7-B7', 'Quiz: Ab7-Db7-Gb7-B7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7'), NULL, 5, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル: Ab7-Db7-Gb7-B7', 'Battle: Ab7-Db7-Gb7-B7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p2-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7'), NULL, 6, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1239, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Ab7-Db7-Gb7-B7', 'Survival: Ab7-Db7-Gb7-B7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7'), NULL, 7, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: E7-A7-D7-G7', 'Quiz: E7-A7-D7-G7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7'), NULL, 8, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル: E7-A7-D7-G7', 'Battle: E7-A7-D7-G7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-p3-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7'), NULL, 9, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1240, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: E7-A7-D7-G7', 'Survival: E7-A7-D7-G7', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7'), NULL, 10, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: 全キーまとめ', 'Quiz: All keys', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7-summary-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-7'), NULL, 11, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1241, 'lesson', false, NULL, false, NULL,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'マイナーセブンスフラットファイブス',
  'Half-diminished sevenths',
  'マイナーセブンスフラットファイブス の Drop2 Resolution ヴォイシングを練習します。',
  'Practice Drop 2 Resolution voicings for Half-diminished sevenths.',
  true,
  20, 3,
  'Drop 2 Resolution 基礎編',
  'Drop 2 Resolution Basics',
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-demo-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, false, NULL,
   true, false,
   'thvi-b3-demo-b3-m7b5', NULL,
   NULL,
   'デモ', 'Demo', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Am7b5-Dm7b5-Gm7b5-Cm7b5', 'Quiz: Am7b5-Dm7b5-Gm7b5-Cm7b5', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5'), NULL, 2, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル: Am7b5-Dm7b5-Gm7b5-Cm7b5', 'Battle: Am7b5-Dm7b5-Gm7b5-Cm7b5', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p1-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5'), NULL, 3, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1242, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Am7b5-Dm7b5-Gm7b5-Cm7b5', 'Survival: Am7b5-Dm7b5-Gm7b5-Cm7b5', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5'), NULL, 4, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: Fm7b5-Bbm7b5-Ebm7b5-Abm7b5', 'Quiz: Fm7b5-Bbm7b5-Ebm7b5-Abm7b5', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5'), NULL, 5, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル: Fm7b5-Bbm7b5-Ebm7b5-Abm7b5', 'Battle: Fm7b5-Bbm7b5-Ebm7b5-Abm7b5', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p2-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5'), NULL, 6, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1243, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: Fm7b5-Bbm7b5-Ebm7b5-Abm7b5', 'Survival: Fm7b5-Bbm7b5-Ebm7b5-Abm7b5', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5'), NULL, 7, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: C#m7b5-F#m7b5-Bm7b5-Em7b5', 'Quiz: C#m7b5-F#m7b5-Bm7b5-Em7b5', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5'), NULL, 8, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル: C#m7b5-F#m7b5-Bm7b5-Em7b5', 'Battle: C#m7b5-F#m7b5-Bm7b5-Em7b5', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-p3-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5'), NULL, 9, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1244, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル: C#m7b5-F#m7b5-Bm7b5-Em7b5', 'Survival: C#m7b5-F#m7b5-Bm7b5-Em7b5', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5'), NULL, 10, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ: 全キーまとめ', 'Quiz: All keys', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5-summary-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b3-m7b5'), NULL, 11, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1245, 'lesson', false, NULL, false, NULL,
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
