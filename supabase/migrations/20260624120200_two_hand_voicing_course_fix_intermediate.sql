-- 目的別コース: 両手ヴォイシングコース(中級)
-- Drop2 II-V-I A-B-A / B-A-B、2ブロック × 7レッスン
BEGIN;

INSERT INTO public.courses (
  id, title, title_en, description, description_en,
  premium_only, order_index, audience, is_tutorial, is_visible,
  difficulty_tier, is_developer_only, is_main_course
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  '両手ヴォイシングコース(中級)',
  'Two-Hand Voicing (Intermediate)',
  'Drop2 の II-V-I ヴォイシングを、クイズ・バトル・サバイバルで身につけましょう。',
  'Master Drop 2 II-V-I voicings through quiz, battle, and survival modes.',
  true,
  COALESCE((SELECT MAX(c.order_index) FROM public.courses c
    WHERE COALESCE(c.is_developer_only, false) = false
      AND COALESCE(c.is_visible, true) = true), 0) + 1,
  'both', false, true, 'intermediate', false, false
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
  'thvi-demo-b1-q1',
  '両手ヴォイシング デモ (Key of C & F)',
  'Two-hand voicing demo (Key of C & F)',
  '{"version":3,"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{},"scenes":[{"type":"demo_play","bpm":100,"beatsPerMeasure":4,"keyFifths":0,"audio":{"url_ja":"https://jazzify-cdn.com/sozai/drop2_iivi_aba_demo_100bpm_bgm.mp3","url_en":"https://jazzify-cdn.com/sozai/drop2_iivi_aba_demo_100bpm_bgm_en.mp3","volume":0.28},"introLines":[{"ja":"Drop2じゃ。","en":"This is Drop 2.","speaker":"jajii"},{"ja":"Drop2？","en":"Drop 2?","speaker":"fai"},{"ja":"クローズド・ボイシングを、弾きやすく広げる技じゃ。","en":"It spreads a closed voicing into a playable shape.","speaker":"jajii"},{"ja":"今日は Dm7、G7、CM7。II-V-Iで見るぞい。","en":"Today, Dm7, G7, CM7. We will see it in a II-V-I.","speaker":"jajii"}],"chords":[{"startBeat":0,"durationBeats":4,"chordName":"Dm7 closed","voicing":[53,57,60,64],"voicingNames":["F3","A3","C4","E4"],"voicing_staves":[2,2,1,1],"measureNumber":1,"keyFifths":0},{"startBeat":4,"durationBeats":1,"chordName":"3rd","voicing":[53],"voicingNames":["F3"],"voicing_staves":[2],"measureNumber":2,"keyFifths":0},{"startBeat":5,"durationBeats":1,"chordName":"5th","voicing":[57],"voicingNames":["A3"],"voicing_staves":[2],"measureNumber":2,"keyFifths":0},{"startBeat":6,"durationBeats":1,"chordName":"7th","voicing":[60],"voicingNames":["C4"],"voicing_staves":[1],"measureNumber":2,"keyFifths":0},{"startBeat":7,"durationBeats":1,"chordName":"9th","voicing":[64],"voicingNames":["E4"],"voicing_staves":[1],"measureNumber":2,"keyFifths":0},{"startBeat":8,"durationBeats":4,"chordName":"G7 closed","voicing":[53,57,59,64],"voicingNames":["F3","A3","B3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":3,"keyFifths":0},{"startBeat":12,"durationBeats":4,"chordName":"CM7 closed","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,1],"measureNumber":4,"keyFifths":0},{"startBeat":16,"durationBeats":2,"chordName":"Dm7 closed","voicing":[53,57,60,64],"voicingNames":["F3","A3","C4","E4"],"voicing_staves":[2,2,1,1],"measureNumber":5,"keyFifths":0},{"startBeat":18,"durationBeats":1,"chordName":"2nd from top","voicing":[60],"voicingNames":["C4"],"voicing_staves":[1],"measureNumber":5,"keyFifths":0},{"startBeat":19,"durationBeats":1,"chordName":"drop","voicing":[48],"voicingNames":["C3"],"voicing_staves":[2],"measureNumber":5,"keyFifths":0},{"startBeat":20,"durationBeats":4,"chordName":"Dm7","voicing":[48,53,57,64],"voicingNames":["C3","F3","A3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":6,"keyFifths":0},{"startBeat":24,"durationBeats":4,"chordName":"","voicing":[],"measureNumber":7,"keyFifths":0},{"startBeat":28,"durationBeats":4,"chordName":"G7 closed","voicing":[53,57,59,64],"voicingNames":["F3","A3","B3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":8,"keyFifths":0},{"startBeat":32,"durationBeats":2,"chordName":"2nd from top","voicing":[59],"voicingNames":["B3"],"voicing_staves":[2],"measureNumber":9,"keyFifths":0},{"startBeat":34,"durationBeats":2,"chordName":"drop","voicing":[47],"voicingNames":["B2"],"voicing_staves":[2],"measureNumber":9,"keyFifths":0},{"startBeat":36,"durationBeats":4,"chordName":"G7","voicing":[47,53,57,64],"voicingNames":["B2","F3","A3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":10,"keyFifths":0},{"startBeat":40,"durationBeats":4,"chordName":"CM7 closed","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,1],"measureNumber":11,"keyFifths":0},{"startBeat":44,"durationBeats":2,"chordName":"2nd from top","voicing":[59],"voicingNames":["B3"],"voicing_staves":[2],"measureNumber":12,"keyFifths":0},{"startBeat":46,"durationBeats":2,"chordName":"drop","voicing":[47],"voicingNames":["B2"],"voicing_staves":[2],"measureNumber":12,"keyFifths":0},{"startBeat":48,"durationBeats":4,"chordName":"CM7","voicing":[47,52,55,62],"voicingNames":["B2","E3","G3","D4"],"voicing_staves":[2,2,2,1],"measureNumber":13,"keyFifths":0},{"startBeat":52,"durationBeats":4,"chordName":"","voicing":[],"measureNumber":14,"keyFifths":0},{"startBeat":56,"durationBeats":4,"chordName":"Dm7","voicing":[48,53,57,64],"voicingNames":["C3","F3","A3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":15,"keyFifths":0},{"startBeat":60,"durationBeats":4,"chordName":"G7","voicing":[47,53,57,64],"voicingNames":["B2","F3","A3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":16,"keyFifths":0},{"startBeat":64,"durationBeats":2,"chordName":"Dm7 LH","voicing":[48],"voicingNames":["C3"],"voicing_staves":[2],"measureNumber":17,"keyFifths":0},{"startBeat":66,"durationBeats":2,"chordName":"G7 LH","voicing":[47],"voicingNames":["B2"],"voicing_staves":[2],"measureNumber":17,"keyFifths":0},{"startBeat":68,"durationBeats":4,"chordName":"G7","voicing":[47,53,57,64],"voicingNames":["B2","F3","A3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":18,"keyFifths":0},{"startBeat":72,"durationBeats":4,"chordName":"CM7","voicing":[47,52,55,62],"voicingNames":["B2","E3","G3","D4"],"voicing_staves":[2,2,2,1],"measureNumber":19,"keyFifths":0},{"startBeat":76,"durationBeats":2,"chordName":"G7 RH","voicing":[53,57,64],"voicingNames":["F3","A3","E4"],"voicing_staves":[2,2,1],"measureNumber":20,"keyFifths":0},{"startBeat":78,"durationBeats":2,"chordName":"CM7 RH","voicing":[52,55,62],"voicingNames":["E3","G3","D4"],"voicing_staves":[2,2,1],"measureNumber":20,"keyFifths":0},{"startBeat":80,"durationBeats":4,"chordName":"","voicing":[],"measureNumber":21,"keyFifths":0},{"startBeat":84,"durationBeats":4,"chordName":"Dm7","voicing":[48,53,57,64],"voicingNames":["C3","F3","A3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":22,"keyFifths":0},{"startBeat":88,"durationBeats":4,"chordName":"G7","voicing":[47,53,57,64],"voicingNames":["B2","F3","A3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":23,"keyFifths":0},{"startBeat":92,"durationBeats":4,"chordName":"CM7","voicing":[47,52,55,62],"voicingNames":["B2","E3","G3","D4"],"voicing_staves":[2,2,2,1],"measureNumber":24,"keyFifths":0},{"startBeat":96,"durationBeats":4,"chordName":"","voicing":[],"measureNumber":25,"keyFifths":0},{"startBeat":100,"durationBeats":2,"chordName":"Dm7","voicing":[48,53,57,64],"voicingNames":["C3","F3","A3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":26,"keyFifths":0},{"startBeat":102,"durationBeats":2,"chordName":"G7","voicing":[47,53,57,64],"voicingNames":["B2","F3","A3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":26,"keyFifths":0},{"startBeat":104,"durationBeats":4,"chordName":"CM7","voicing":[47,52,55,62],"voicingNames":["B2","E3","G3","D4"],"voicing_staves":[2,2,2,1],"measureNumber":27,"keyFifths":0},{"startBeat":108,"durationBeats":2,"chordName":"Dm7","voicing":[48,53,57,64],"voicingNames":["C3","F3","A3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":28,"keyFifths":0},{"startBeat":110,"durationBeats":2,"chordName":"G7","voicing":[47,53,57,64],"voicingNames":["B2","F3","A3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":28,"keyFifths":0},{"startBeat":112,"durationBeats":4,"chordName":"CM7","voicing":[47,52,55,62],"voicingNames":["B2","E3","G3","D4"],"voicing_staves":[2,2,2,1],"measureNumber":29,"keyFifths":0},{"startBeat":116,"durationBeats":2,"chordName":"Dm7","voicing":[48,53,57,64],"voicingNames":["C3","F3","A3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":30,"keyFifths":0},{"startBeat":118,"durationBeats":2,"chordName":"G7","voicing":[47,53,57,64],"voicingNames":["B2","F3","A3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":30,"keyFifths":0},{"startBeat":120,"durationBeats":4,"chordName":"CM7","voicing":[47,52,55,62],"voicingNames":["B2","E3","G3","D4"],"voicing_staves":[2,2,2,1],"measureNumber":31,"keyFifths":0}],"lines":[{"ja":"まずはクローズド・ボイシングじゃ。ルートは抜いて、コードの中身を近くに集める。","en":"First, a closed voicing. Omit the root and gather the chord tones close together.","speaker":"jajii","startBeat":0,"durationBeats":4},{"ja":"Dm7は、3・5・7・9。F、A、C、Eじゃ。","en":"Dm7 is 3, 5, 7, 9. F, A, C, E.","speaker":"jajii","startBeat":4,"durationBeats":4},{"ja":"G7は、7・9・3・13。F、A、B、Eじゃ。","en":"G7 is 7, 9, 3, 13. F, A, B, E.","speaker":"jajii","startBeat":8,"durationBeats":4},{"ja":"CM7は、3・5・7・9。E、G、B、Dじゃ。","en":"CM7 is 3, 5, 7, 9. E, G, B, D.","speaker":"jajii","startBeat":12,"durationBeats":4},{"ja":"では Dm7 に戻るぞい。この、上から2番目の C を見るんじゃ。","en":"Now back to Dm7. Look at the C, the second note from the top.","speaker":"jajii","startBeat":16,"durationBeats":2},{"ja":"その C を、1オクターブ下に落とす。","en":"Drop that C down one octave.","speaker":"jajii","startBeat":18,"durationBeats":2},{"ja":"これが Dm7 の Drop2 じゃ。C、F、A、E。","en":"This is Dm7 Drop 2. C, F, A, E.","speaker":"jajii","startBeat":20,"durationBeats":4},{"ja":"理屈を増やしすぎるな。上から2番目を落とす。それだけじゃ。","en":"Do not overthink it. Drop the second note from the top. That is it.","speaker":"jajii","startBeat":24,"durationBeats":4},{"ja":"G7 でも同じじゃ。まずはクローズド。","en":"Same for G7. First, closed.","speaker":"jajii","startBeat":28,"durationBeats":4},{"ja":"上から2番目の B を落とす。","en":"Drop the B, the second note from the top.","speaker":"jajii","startBeat":32,"durationBeats":4},{"ja":"これが G7 の Drop2。B、F、A、E。","en":"This is G7 Drop 2. B, F, A, E.","speaker":"jajii","startBeat":36,"durationBeats":4},{"ja":"CM7 でも同じ。まずはクローズド。","en":"Same for CM7. First, closed.","speaker":"jajii","startBeat":40,"durationBeats":4},{"ja":"上から2番目の B を下に落とす。","en":"Drop the B, the second note from the top.","speaker":"jajii","startBeat":44,"durationBeats":4},{"ja":"これが CM7 の Drop2。B、E、G、D。","en":"This is CM7 Drop 2. B, E, G, D.","speaker":"jajii","startBeat":48,"durationBeats":4},{"ja":"ここからが大事じゃ。進行で見るぞい。","en":"Now the important part. Watch the progression.","speaker":"jajii","startBeat":52,"durationBeats":4},{"ja":"Dm7 から G7。","en":"Dm7 to G7.","speaker":"fai","startBeat":56,"durationBeats":4},{"ja":"左手だけ見ろ。C から B に半音下がるだけじゃ。","en":"Watch only the left hand. C moves down to B.","speaker":"jajii","startBeat":60,"durationBeats":4},{"ja":"C、B。ここだけで II-V の感じが出る。","en":"C, B. This alone gives the II-V sound.","speaker":"jajii","startBeat":64,"durationBeats":4},{"ja":"次は G7 から CM7。","en":"Next, G7 to CM7.","speaker":"fai","startBeat":68,"durationBeats":4},{"ja":"左手の B はキープじゃ。","en":"Keep the left-hand B.","speaker":"jajii","startBeat":72,"durationBeats":4},{"ja":"右手の3声が、スケール上に下がる。F-A-E から E-G-D。","en":"The three right-hand notes move down the scale. F-A-E to E-G-D.","speaker":"jajii","startBeat":76,"durationBeats":4},{"ja":"つまり、全部を動かそうとしなくていい。動く場所だけ見ればよい。","en":"So you do not need to move everything. Watch only the moving parts.","speaker":"jajii","startBeat":80,"durationBeats":4},{"ja":"流れで弾くぞい。Dm7。","en":"Now in flow. Dm7.","speaker":"jajii","startBeat":84,"durationBeats":4},{"ja":"G7。左手が半音下がる。","en":"G7. The left hand moves down a half step.","speaker":"jajii","startBeat":88,"durationBeats":4},{"ja":"CM7。左手はキープ、右手が下がる。","en":"CM7. Keep the left hand, move the right hand down.","speaker":"jajii","startBeat":92,"durationBeats":4},{"ja":"もう一度じゃ。見る場所は少ない。","en":"Again. There are only a few things to watch.","speaker":"jajii","startBeat":96,"durationBeats":4},{"ja":"Dm7、G7。","en":"Dm7, G7.","speaker":"fai","startBeat":100,"durationBeats":4},{"ja":"CM7。","en":"CM7.","speaker":"fai","startBeat":104,"durationBeats":4},{"ja":"最後にもう一回。形を耳と手に焼きつけるんじゃ。","en":"One last time. Burn the shape into your ears and hands.","speaker":"jajii","startBeat":108,"durationBeats":4},{"ja":"Drop2は、難しい名前ではない。上から2番目を落とした形じゃ。","en":"Drop 2 is not a difficult name. It is the shape made by dropping the second note from the top.","speaker":"jajii","startBeat":112,"durationBeats":4},{"ja":"II-V-Iでは、左手と右手の動きが少ない。そこがこの形の強みじゃ。","en":"In a II-V-I, the left and right hands move very little. That is the strength of this shape.","speaker":"jajii","startBeat":116,"durationBeats":4},{"ja":"まずはこの3つだけ覚えろ。Dm7、G7、CM7じゃ。","en":"For now, learn only these three. Dm7, G7, CM7.","speaker":"jajii","startBeat":120,"durationBeats":4}],"endHoldBeats":4},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (
  'thvi-demo-b2-q1',
  '両手ヴォイシング デモ (Key of C & F)',
  'Two-hand voicing demo (Key of C & F)',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"ブロック2では、Drop2 の II-V-I ヴォイシングを身につけるのじゃ。","en":"In block 2, you will learn Drop 2 II-V-I voicings."},{"speaker":"fai","ja":"まずは流れを確認してから、弾いてみよう。","en":"Let us check the flow first, then try playing."},{"speaker":"jajii","ja":"焦らず、最低音から形を覚えるんじゃ。","en":"Take your time and learn the shape from the bottom note."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
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
  'lesson', 1201, 'progression', 'survival',
  '両手ヴォイシング: Key of C & F',
  'Two-hand voicing: Key of C & F',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"Dm7(9)","voicing":[60,65,69,76],"voicing_names":["C4","F4","A4","E5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"G7(9.13)","voicing":[59,65,69,76],"voicing_names":["B3","F4","A4","E5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"CM7(9)","voicing":[59,64,67,74],"voicing_names":["B3","E4","G4","D5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Gm7(9)","voicing":[53,58,62,69],"voicing_names":["F3","Bb3","D4","A4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"C7(9.13)","voicing":[52,58,62,69],"voicing_names":["E3","Bb3","D4","A4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"FM7(9)","voicing":[52,57,60,67],"voicing_names":["E3","A3","C4","G4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1202, 'progression', 'survival',
  '両手ヴォイシング: Key of Bb & Eb',
  'Two-hand voicing: Key of Bb & Eb',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"Cm7(9)","voicing":[58,63,67,74],"voicing_names":["Bb3","Eb4","G4","D5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"F7(9.13)","voicing":[57,63,67,74],"voicing_names":["A3","Eb4","G4","D5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"BbM7(9)","voicing":[57,62,65,72],"voicing_names":["A3","D4","F4","C5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Fm7(9)","voicing":[63,68,72,79],"voicing_names":["Eb4","Ab4","C5","G5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Bb7(9.13)","voicing":[62,68,72,79],"voicing_names":["D4","Ab4","C5","G5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"EbM7(9)","voicing":[62,67,70,77],"voicing_names":["D4","G4","Bb4","F5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1203, 'progression', 'survival',
  '両手ヴォイシング: Key of Ab & Db',
  'Two-hand voicing: Key of Ab & Db',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"Bbm7(9)","voicing":[56,61,65,72],"voicing_names":["Ab3","Db4","F4","C5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Eb7(9.13)","voicing":[55,61,65,72],"voicing_names":["G3","Db4","F4","C5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"AbM7(9)","voicing":[55,60,63,70],"voicing_names":["G3","C4","Eb4","Bb4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Ebm7(9)","voicing":[61,66,70,77],"voicing_names":["Db4","Gb4","Bb4","F5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Ab7(9.13)","voicing":[60,66,70,77],"voicing_names":["C4","Gb4","Bb4","F5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"DbM7(9)","voicing":[60,65,68,75],"voicing_names":["C4","F4","Ab4","Eb5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1204, 'progression', 'survival',
  '両手ヴォイシング: Key of Gb & B',
  'Two-hand voicing: Key of Gb & B',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"Abm7(9)","voicing":[54,59,63,70],"voicing_names":["Gb3","Cb4","Eb4","Bb4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Db7(9.13)","voicing":[53,59,63,70],"voicing_names":["F3","Cb4","Eb4","Bb4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"GbM7(9)","voicing":[53,58,61,68],"voicing_names":["F3","Bb3","Db4","Ab4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"C#m7(9)","voicing":[59,64,68,75],"voicing_names":["B3","E4","G#4","D#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"F#7(9.13)","voicing":[58,64,68,75],"voicing_names":["A#3","E4","G#4","D#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"BM7(9)","voicing":[58,63,66,73],"voicing_names":["A#3","D#4","F#4","C#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1205, 'progression', 'survival',
  '両手ヴォイシング: Key of E & A',
  'Two-hand voicing: Key of E & A',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"F#m7(9)","voicing":[64,69,73,80],"voicing_names":["E4","A4","C#5","G#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"B7(9.13)","voicing":[63,69,73,80],"voicing_names":["D#4","A4","C#5","G#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"EM7(9)","voicing":[63,68,71,78],"voicing_names":["D#4","G#4","B4","F#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"Bm7(9)","voicing":[57,62,66,73],"voicing_names":["A3","D4","F#4","C#5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"E7(9.13)","voicing":[56,62,66,73],"voicing_names":["G#3","D4","F#4","C#5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"AM7(9)","voicing":[56,61,64,71],"voicing_names":["G#3","C#4","E4","B4"],"key_fifths":3,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1206, 'progression', 'survival',
  '両手ヴォイシング: Key of D & G',
  'Two-hand voicing: Key of D & G',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"Em7(9)","voicing":[62,67,71,78],"voicing_names":["D4","G4","B4","F#5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"A7(9.13)","voicing":[61,67,71,78],"voicing_names":["C#4","G4","B4","F#5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"DM7(9)","voicing":[61,66,69,76],"voicing_names":["C#4","F#4","A4","E5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Am7(9)","voicing":[55,60,64,71],"voicing_names":["G3","C4","E4","B4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"D7(9.13)","voicing":[54,60,64,71],"voicing_names":["F#3","C4","E4","B4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"GM7(9)","voicing":[54,59,62,69],"voicing_names":["F#3","B3","D4","A4"],"key_fifths":1,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1207, 'progression', 'survival',
  '両手ヴォイシング: まとめ',
  'Two-hand voicing: All keys',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"Dm7(9)","voicing":[60,65,69,76],"voicing_names":["C4","F4","A4","E5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"G7(9.13)","voicing":[59,65,69,76],"voicing_names":["B3","F4","A4","E5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"CM7(9)","voicing":[59,64,67,74],"voicing_names":["B3","E4","G4","D5"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Gm7(9)","voicing":[53,58,62,69],"voicing_names":["F3","Bb3","D4","A4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"C7(9.13)","voicing":[52,58,62,69],"voicing_names":["E3","Bb3","D4","A4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"FM7(9)","voicing":[52,57,60,67],"voicing_names":["E3","A3","C4","G4"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Cm7(9)","voicing":[58,63,67,74],"voicing_names":["Bb3","Eb4","G4","D5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"F7(9.13)","voicing":[57,63,67,74],"voicing_names":["A3","Eb4","G4","D5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"BbM7(9)","voicing":[57,62,65,72],"voicing_names":["A3","D4","F4","C5"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Fm7(9)","voicing":[63,68,72,79],"voicing_names":["Eb4","Ab4","C5","G5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Bb7(9.13)","voicing":[62,68,72,79],"voicing_names":["D4","Ab4","C5","G5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"EbM7(9)","voicing":[62,67,70,77],"voicing_names":["D4","G4","Bb4","F5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Bbm7(9)","voicing":[56,61,65,72],"voicing_names":["Ab3","Db4","F4","C5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Eb7(9.13)","voicing":[55,61,65,72],"voicing_names":["G3","Db4","F4","C5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"AbM7(9)","voicing":[55,60,63,70],"voicing_names":["G3","C4","Eb4","Bb4"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Ebm7(9)","voicing":[61,66,70,77],"voicing_names":["Db4","Gb4","Bb4","F5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Ab7(9.13)","voicing":[60,66,70,77],"voicing_names":["C4","Gb4","Bb4","F5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"DbM7(9)","voicing":[60,65,68,75],"voicing_names":["C4","F4","Ab4","Eb5"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Abm7(9)","voicing":[54,59,63,70],"voicing_names":["Gb3","Cb4","Eb4","Bb4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Db7(9.13)","voicing":[53,59,63,70],"voicing_names":["F3","Cb4","Eb4","Bb4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"GbM7(9)","voicing":[53,58,61,68],"voicing_names":["F3","Bb3","Db4","Ab4"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"C#m7(9)","voicing":[59,64,68,75],"voicing_names":["B3","E4","G#4","D#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"F#7(9.13)","voicing":[58,64,68,75],"voicing_names":["A#3","E4","G#4","D#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"BM7(9)","voicing":[58,63,66,73],"voicing_names":["A#3","D#4","F#4","C#5"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"F#m7(9)","voicing":[64,69,73,80],"voicing_names":["E4","A4","C#5","G#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"B7(9.13)","voicing":[63,69,73,80],"voicing_names":["D#4","A4","C#5","G#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"EM7(9)","voicing":[63,68,71,78],"voicing_names":["D#4","G#4","B4","F#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"Bm7(9)","voicing":[57,62,66,73],"voicing_names":["A3","D4","F#4","C#5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"E7(9.13)","voicing":[56,62,66,73],"voicing_names":["G#3","D4","F#4","C#5"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"AM7(9)","voicing":[56,61,64,71],"voicing_names":["G#3","C#4","E4","B4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Em7(9)","voicing":[62,67,71,78],"voicing_names":["D4","G4","B4","F#5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"A7(9.13)","voicing":[61,67,71,78],"voicing_names":["C#4","G4","B4","F#5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"DM7(9)","voicing":[61,66,69,76],"voicing_names":["C#4","F#4","A4","E5"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Am7(9)","voicing":[55,60,64,71],"voicing_names":["G3","C4","E4","B4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"D7(9.13)","voicing":[54,60,64,71],"voicing_names":["F#3","C4","E4","B4"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"GM7(9)","voicing":[54,59,62,69],"voicing_names":["F#3","B3","D4","A4"],"key_fifths":1,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1208, 'progression', 'survival',
  '両手ヴォイシング: Key of C & F',
  'Two-hand voicing: Key of C & F',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"Dm7(9)","voicing":[53,60,64,69],"voicing_names":["F3","C4","E4","A4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"G7(9.13)","voicing":[53,59,64,69],"voicing_names":["F3","B3","E4","A4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"CM7(9)","voicing":[52,59,62,67],"voicing_names":["E3","B3","D4","G4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Gm7(9)","voicing":[58,65,69,74],"voicing_names":["Bb3","F4","A4","D5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"C7(9.13)","voicing":[58,64,69,74],"voicing_names":["Bb3","E4","A4","D5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"FM7(9)","voicing":[57,64,67,72],"voicing_names":["A3","E4","G4","C5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1209, 'progression', 'survival',
  '両手ヴォイシング: Key of Bb & Eb',
  'Two-hand voicing: Key of Bb & Eb',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"Cm7(9)","voicing":[51,58,62,67],"voicing_names":["Eb3","Bb3","D4","G4"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"F7(9.13)","voicing":[51,57,62,67],"voicing_names":["Eb3","A3","D4","G4"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"BbM7(9)","voicing":[50,57,60,65],"voicing_names":["D3","A3","C4","F4"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Fm7(9)","voicing":[56,63,67,72],"voicing_names":["Ab3","Eb4","G4","C5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Bb7(9.13)","voicing":[56,62,67,72],"voicing_names":["Ab3","D4","G4","C5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"EbM7(9)","voicing":[55,62,65,70],"voicing_names":["G3","D4","F4","Bb4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1210, 'progression', 'survival',
  '両手ヴォイシング: Key of Ab & Db',
  'Two-hand voicing: Key of Ab & Db',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"Bbm7(9)","voicing":[61,68,72,77],"voicing_names":["Db4","Ab4","C5","F5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Eb7(9.13)","voicing":[61,67,72,77],"voicing_names":["Db4","G4","C5","F5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"AbM7(9)","voicing":[60,67,70,75],"voicing_names":["C4","G4","Bb4","Eb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Ebm7(9)","voicing":[54,61,65,70],"voicing_names":["Gb3","Db4","F4","Bb4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Ab7(9.13)","voicing":[54,60,65,70],"voicing_names":["Gb3","C4","F4","Bb4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"DbM7(9)","voicing":[53,60,63,68],"voicing_names":["F3","C4","Eb4","Ab4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1211, 'progression', 'survival',
  '両手ヴォイシング: Key of Gb & B',
  'Two-hand voicing: Key of Gb & B',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"Abm7(9)","voicing":[59,66,70,75],"voicing_names":["Cb4","Gb4","Bb4","Eb5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Db7(9.13)","voicing":[59,65,70,75],"voicing_names":["Cb4","F4","Bb4","Eb5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"GbM7(9)","voicing":[58,65,68,73],"voicing_names":["Bb3","F4","Ab4","Db5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"C#m7(9)","voicing":[52,59,63,68],"voicing_names":["E3","B3","D#4","G#4"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"F#7(9.13)","voicing":[52,58,63,68],"voicing_names":["E3","A#3","D#4","G#4"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"BM7(9)","voicing":[51,58,61,66],"voicing_names":["D#3","A#3","C#4","F#4"],"key_fifths":5,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1212, 'progression', 'survival',
  '両手ヴォイシング: Key of E & A',
  'Two-hand voicing: Key of E & A',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"F#m7(9)","voicing":[57,64,68,73],"voicing_names":["A3","E4","G#4","C#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"B7(9.13)","voicing":[57,63,68,73],"voicing_names":["A3","D#4","G#4","C#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"EM7(9)","voicing":[56,63,66,71],"voicing_names":["G#3","D#4","F#4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"Bm7(9)","voicing":[50,57,61,66],"voicing_names":["D3","A3","C#4","F#4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"E7(9.13)","voicing":[50,56,61,66],"voicing_names":["D3","G#3","C#4","F#4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"AM7(9)","voicing":[49,56,59,64],"voicing_names":["C#3","G#3","B3","E4"],"key_fifths":3,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1213, 'progression', 'survival',
  '両手ヴォイシング: Key of D & G',
  'Two-hand voicing: Key of D & G',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"Em7(9)","voicing":[55,62,66,71],"voicing_names":["G3","D4","F#4","B4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"A7(9.13)","voicing":[55,61,66,71],"voicing_names":["G3","C#4","F#4","B4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"DM7(9)","voicing":[54,61,64,69],"voicing_names":["F#3","C#4","E4","A4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Am7(9)","voicing":[60,67,71,76],"voicing_names":["C4","G4","B4","E5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"D7(9.13)","voicing":[60,66,71,76],"voicing_names":["C4","F#4","B4","E5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"GM7(9)","voicing":[59,66,69,74],"voicing_names":["B3","F#4","A4","D5"],"key_fifths":1,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  'lesson', 1214, 'progression', 'survival',
  '両手ヴォイシング: まとめ',
  'Two-hand voicing: All keys',
  'easy', '', 'II-V-I', 'II-V-I',
  NULL, NULL, NULL,
  'M7', false, NULL,
  '[{"name":"Dm7(9)","voicing":[53,60,64,69],"voicing_names":["F3","C4","E4","A4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"G7(9.13)","voicing":[53,59,64,69],"voicing_names":["F3","B3","E4","A4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"CM7(9)","voicing":[52,59,62,67],"voicing_names":["E3","B3","D4","G4"],"key_fifths":0,"voicing_staves":[2,1,1,1]},{"name":"Gm7(9)","voicing":[58,65,69,74],"voicing_names":["Bb3","F4","A4","D5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"C7(9.13)","voicing":[58,64,69,74],"voicing_names":["Bb3","E4","A4","D5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"FM7(9)","voicing":[57,64,67,72],"voicing_names":["A3","E4","G4","C5"],"key_fifths":-1,"voicing_staves":[2,1,1,1]},{"name":"Cm7(9)","voicing":[51,58,62,67],"voicing_names":["Eb3","Bb3","D4","G4"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"F7(9.13)","voicing":[51,57,62,67],"voicing_names":["Eb3","A3","D4","G4"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"BbM7(9)","voicing":[50,57,60,65],"voicing_names":["D3","A3","C4","F4"],"key_fifths":-2,"voicing_staves":[2,1,1,1]},{"name":"Fm7(9)","voicing":[56,63,67,72],"voicing_names":["Ab3","Eb4","G4","C5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Bb7(9.13)","voicing":[56,62,67,72],"voicing_names":["Ab3","D4","G4","C5"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"EbM7(9)","voicing":[55,62,65,70],"voicing_names":["G3","D4","F4","Bb4"],"key_fifths":-3,"voicing_staves":[2,1,1,1]},{"name":"Bbm7(9)","voicing":[61,68,72,77],"voicing_names":["Db4","Ab4","C5","F5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Eb7(9.13)","voicing":[61,67,72,77],"voicing_names":["Db4","G4","C5","F5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"AbM7(9)","voicing":[60,67,70,75],"voicing_names":["C4","G4","Bb4","Eb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1]},{"name":"Ebm7(9)","voicing":[54,61,65,70],"voicing_names":["Gb3","Db4","F4","Bb4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Ab7(9.13)","voicing":[54,60,65,70],"voicing_names":["Gb3","C4","F4","Bb4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"DbM7(9)","voicing":[53,60,63,68],"voicing_names":["F3","C4","Eb4","Ab4"],"key_fifths":-5,"voicing_staves":[2,1,1,1]},{"name":"Abm7(9)","voicing":[59,66,70,75],"voicing_names":["Cb4","Gb4","Bb4","Eb5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"Db7(9.13)","voicing":[59,65,70,75],"voicing_names":["Cb4","F4","Bb4","Eb5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"GbM7(9)","voicing":[58,65,68,73],"voicing_names":["Bb3","F4","Ab4","Db5"],"key_fifths":-6,"voicing_staves":[2,1,1,1]},{"name":"C#m7(9)","voicing":[52,59,63,68],"voicing_names":["E3","B3","D#4","G#4"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"F#7(9.13)","voicing":[52,58,63,68],"voicing_names":["E3","A#3","D#4","G#4"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"BM7(9)","voicing":[51,58,61,66],"voicing_names":["D#3","A#3","C#4","F#4"],"key_fifths":5,"voicing_staves":[2,1,1,1]},{"name":"F#m7(9)","voicing":[57,64,68,73],"voicing_names":["A3","E4","G#4","C#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"B7(9.13)","voicing":[57,63,68,73],"voicing_names":["A3","D#4","G#4","C#5"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"EM7(9)","voicing":[56,63,66,71],"voicing_names":["G#3","D#4","F#4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1]},{"name":"Bm7(9)","voicing":[50,57,61,66],"voicing_names":["D3","A3","C#4","F#4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"E7(9.13)","voicing":[50,56,61,66],"voicing_names":["D3","G#3","C#4","F#4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"AM7(9)","voicing":[49,56,59,64],"voicing_names":["C#3","G#3","B3","E4"],"key_fifths":3,"voicing_staves":[2,1,1,1]},{"name":"Em7(9)","voicing":[55,62,66,71],"voicing_names":["G3","D4","F#4","B4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"A7(9.13)","voicing":[55,61,66,71],"voicing_names":["G3","C#4","F#4","B4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"DM7(9)","voicing":[54,61,64,69],"voicing_names":["F#3","C#4","E4","A4"],"key_fifths":2,"voicing_staves":[2,1,1,1]},{"name":"Am7(9)","voicing":[60,67,71,76],"voicing_names":["C4","G4","B4","E5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"D7(9.13)","voicing":[60,66,71,76],"voicing_names":["C4","F#4","B4","E5"],"key_fifths":1,"voicing_staves":[2,1,1,1]},{"name":"GM7(9)","voicing":[59,66,69,74],"voicing_names":["B3","F#4","A4","D5"],"key_fifths":1,"voicing_staves":[2,1,1,1]}]'::jsonb,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz'),
  'thvi-quiz-b1-q1',
  'クイズ: Key of C & F',
  'Quiz: Key of C & F',
  '60秒以内に20問正解。II-V-I の Drop2 ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using Drop 2 II-V-I voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz'),
  0, 1, 1, 4,
  'Dm7(9)',
  ARRAY['C4', 'F4', 'A4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz'),
  1, 2, 1, 4,
  'G7(9.13)',
  ARRAY['B3', 'F4', 'A4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz'),
  2, 3, 1, 4,
  'CM7(9)',
  ARRAY['B3', 'E4', 'G4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz'),
  3, 4, 1, 4,
  'Gm7(9)',
  ARRAY['F3', 'Bb3', 'D4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz'),
  4, 5, 1, 4,
  'C7(9.13)',
  ARRAY['E3', 'Bb3', 'D4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz'),
  5, 6, 1, 4,
  'FM7(9)',
  ARRAY['E3', 'A3', 'C4', 'G4']::text[],
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

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing'),
  'thvi-voicing-b1-q1',
  'バトル: Key of C & F',
  'Ear training: Key of C & F',
  'BPM100・3ループ以内に II-V-I を弾きましょう。',
  'Play II-V-I within 3 loops at 100 BPM.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing'),
  0,
  'フレーズ1',
  'Phrase 1',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph0'),
  0,
  'Dm7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['C4', 'F4', 'A4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph0'),
  1,
  'G7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['B3', 'F4', 'A4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph0'),
  2,
  'CM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['B3', 'E4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph0'),
  3,
  'CM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['B3', 'E4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing'),
  1,
  'フレーズ2',
  'Phrase 2',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph1-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph1'),
  0,
  'Gm7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['F3', 'Bb3', 'D4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph1-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph1'),
  1,
  'C7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['E3', 'Bb3', 'D4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph1-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph1'),
  2,
  'FM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['E3', 'A3', 'C4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph1-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph1'),
  3,
  'FM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['E3', 'A3', 'C4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz'),
  'thvi-quiz-b1-q2',
  'クイズ: Key of Bb & Eb',
  'Quiz: Key of Bb & Eb',
  '60秒以内に20問正解。II-V-I の Drop2 ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using Drop 2 II-V-I voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz'),
  0, 1, 1, 4,
  'Cm7(9)',
  ARRAY['Bb3', 'Eb4', 'G4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz'),
  1, 2, 1, 4,
  'F7(9.13)',
  ARRAY['A3', 'Eb4', 'G4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz'),
  2, 3, 1, 4,
  'BbM7(9)',
  ARRAY['A3', 'D4', 'F4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz'),
  3, 4, 1, 4,
  'Fm7(9)',
  ARRAY['Eb4', 'Ab4', 'C5', 'G5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz'),
  4, 5, 1, 4,
  'Bb7(9.13)',
  ARRAY['D4', 'Ab4', 'C5', 'G5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz'),
  5, 6, 1, 4,
  'EbM7(9)',
  ARRAY['D4', 'G4', 'Bb4', 'F5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing'),
  'thvi-voicing-b1-q2',
  'バトル: Key of Bb & Eb',
  'Ear training: Key of Bb & Eb',
  'BPM100・3ループ以内に II-V-I を弾きましょう。',
  'Play II-V-I within 3 loops at 100 BPM.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing'),
  0,
  'フレーズ1',
  'Phrase 1',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph0'),
  0,
  'Cm7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['Bb3', 'Eb4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph0'),
  1,
  'F7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['A3', 'Eb4', 'G4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph0'),
  2,
  'BbM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['A3', 'D4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph0'),
  3,
  'BbM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['A3', 'D4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing'),
  1,
  'フレーズ2',
  'Phrase 2',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph1-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph1'),
  0,
  'Fm7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['Eb4', 'Ab4', 'C5', 'G5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph1-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph1'),
  1,
  'Bb7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['D4', 'Ab4', 'C5', 'G5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph1-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph1'),
  2,
  'EbM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['D4', 'G4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph1-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph1'),
  3,
  'EbM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['D4', 'G4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz'),
  'thvi-quiz-b1-q3',
  'クイズ: Key of Ab & Db',
  'Quiz: Key of Ab & Db',
  '60秒以内に20問正解。II-V-I の Drop2 ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using Drop 2 II-V-I voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz'),
  0, 1, 1, 4,
  'Bbm7(9)',
  ARRAY['Ab3', 'Db4', 'F4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz'),
  1, 2, 1, 4,
  'Eb7(9.13)',
  ARRAY['G3', 'Db4', 'F4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz'),
  2, 3, 1, 4,
  'AbM7(9)',
  ARRAY['G3', 'C4', 'Eb4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz'),
  3, 4, 1, 4,
  'Ebm7(9)',
  ARRAY['Db4', 'Gb4', 'Bb4', 'F5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz'),
  4, 5, 1, 4,
  'Ab7(9.13)',
  ARRAY['C4', 'Gb4', 'Bb4', 'F5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz'),
  5, 6, 1, 4,
  'DbM7(9)',
  ARRAY['C4', 'F4', 'Ab4', 'Eb5']::text[],
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

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing'),
  'thvi-voicing-b1-q3',
  'バトル: Key of Ab & Db',
  'Ear training: Key of Ab & Db',
  'BPM100・3ループ以内に II-V-I を弾きましょう。',
  'Play II-V-I within 3 loops at 100 BPM.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing'),
  0,
  'フレーズ1',
  'Phrase 1',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph0'),
  0,
  'Bbm7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['Ab3', 'Db4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph0'),
  1,
  'Eb7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['G3', 'Db4', 'F4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph0'),
  2,
  'AbM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['G3', 'C4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph0'),
  3,
  'AbM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['G3', 'C4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing'),
  1,
  'フレーズ2',
  'Phrase 2',
  NULL,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3',
  9.6, 57.6, 0,
  -5
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph1-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph1'),
  0,
  'Ebm7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['Db4', 'Gb4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph1-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph1'),
  1,
  'Ab7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['C4', 'Gb4', 'Bb4', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph1-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph1'),
  2,
  'DbM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['C4', 'F4', 'Ab4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph1-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph1'),
  3,
  'DbM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['C4', 'F4', 'Ab4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz'),
  'thvi-quiz-b1-q4',
  'クイズ: Key of Gb & B',
  'Quiz: Key of Gb & B',
  '60秒以内に20問正解。II-V-I の Drop2 ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using Drop 2 II-V-I voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz'),
  0, 1, 1, 4,
  'Abm7(9)',
  ARRAY['Gb3', 'Cb4', 'Eb4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz'),
  1, 2, 1, 4,
  'Db7(9.13)',
  ARRAY['F3', 'Cb4', 'Eb4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz'),
  2, 3, 1, 4,
  'GbM7(9)',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz'),
  3, 4, 1, 4,
  'C#m7(9)',
  ARRAY['B3', 'E4', 'G#4', 'D#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz'),
  4, 5, 1, 4,
  'F#7(9.13)',
  ARRAY['A#3', 'E4', 'G#4', 'D#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz'),
  5, 6, 1, 4,
  'BM7(9)',
  ARRAY['A#3', 'D#4', 'F#4', 'C#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing'),
  'thvi-voicing-b1-q4',
  'バトル: Key of Gb & B',
  'Ear training: Key of Gb & B',
  'BPM100・3ループ以内に II-V-I を弾きましょう。',
  'Play II-V-I within 3 loops at 100 BPM.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing'),
  0,
  'フレーズ1',
  'Phrase 1',
  NULL,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3',
  9.6, 57.6, 0,
  -6
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph0'),
  0,
  'Abm7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['Gb3', 'Cb4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph0'),
  1,
  'Db7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['F3', 'Cb4', 'Eb4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph0'),
  2,
  'GbM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['F3', 'Bb3', 'Db4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph0'),
  3,
  'GbM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['F3', 'Bb3', 'Db4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing'),
  1,
  'フレーズ2',
  'Phrase 2',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph1-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph1'),
  0,
  'C#m7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['B3', 'E4', 'G#4', 'D#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph1-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph1'),
  1,
  'F#7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['A#3', 'E4', 'G#4', 'D#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph1-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph1'),
  2,
  'BM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['A#3', 'D#4', 'F#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph1-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph1'),
  3,
  'BM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['A#3', 'D#4', 'F#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz'),
  'thvi-quiz-b1-q5',
  'クイズ: Key of E & A',
  'Quiz: Key of E & A',
  '60秒以内に20問正解。II-V-I の Drop2 ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using Drop 2 II-V-I voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz'),
  0, 1, 1, 4,
  'F#m7(9)',
  ARRAY['E4', 'A4', 'C#5', 'G#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz'),
  1, 2, 1, 4,
  'B7(9.13)',
  ARRAY['D#4', 'A4', 'C#5', 'G#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz'),
  2, 3, 1, 4,
  'EM7(9)',
  ARRAY['D#4', 'G#4', 'B4', 'F#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz'),
  3, 4, 1, 4,
  'Bm7(9)',
  ARRAY['A3', 'D4', 'F#4', 'C#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz'),
  4, 5, 1, 4,
  'E7(9.13)',
  ARRAY['G#3', 'D4', 'F#4', 'C#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz'),
  5, 6, 1, 4,
  'AM7(9)',
  ARRAY['G#3', 'C#4', 'E4', 'B4']::text[],
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

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing'),
  'thvi-voicing-b1-q5',
  'バトル: Key of E & A',
  'Ear training: Key of E & A',
  'BPM100・3ループ以内に II-V-I を弾きましょう。',
  'Play II-V-I within 3 loops at 100 BPM.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing'),
  0,
  'フレーズ1',
  'Phrase 1',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph0'),
  0,
  'F#m7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['E4', 'A4', 'C#5', 'G#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph0'),
  1,
  'B7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['D#4', 'A4', 'C#5', 'G#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph0'),
  2,
  'EM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['D#4', 'G#4', 'B4', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph0'),
  3,
  'EM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['D#4', 'G#4', 'B4', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing'),
  1,
  'フレーズ2',
  'Phrase 2',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph1-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph1'),
  0,
  'Bm7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['A3', 'D4', 'F#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph1-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph1'),
  1,
  'E7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['G#3', 'D4', 'F#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph1-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph1'),
  2,
  'AM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['G#3', 'C#4', 'E4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph1-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph1'),
  3,
  'AM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['G#3', 'C#4', 'E4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz'),
  'thvi-quiz-b1-q6',
  'クイズ: Key of D & G',
  'Quiz: Key of D & G',
  '60秒以内に20問正解。II-V-I の Drop2 ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using Drop 2 II-V-I voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz'),
  0, 1, 1, 4,
  'Em7(9)',
  ARRAY['D4', 'G4', 'B4', 'F#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz'),
  1, 2, 1, 4,
  'A7(9.13)',
  ARRAY['C#4', 'G4', 'B4', 'F#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz'),
  2, 3, 1, 4,
  'DM7(9)',
  ARRAY['C#4', 'F#4', 'A4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz'),
  3, 4, 1, 4,
  'Am7(9)',
  ARRAY['G3', 'C4', 'E4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz'),
  4, 5, 1, 4,
  'D7(9.13)',
  ARRAY['F#3', 'C4', 'E4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz'),
  5, 6, 1, 4,
  'GM7(9)',
  ARRAY['F#3', 'B3', 'D4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing'),
  'thvi-voicing-b1-q6',
  'バトル: Key of D & G',
  'Ear training: Key of D & G',
  'BPM100・3ループ以内に II-V-I を弾きましょう。',
  'Play II-V-I within 3 loops at 100 BPM.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing'),
  0,
  'フレーズ1',
  'Phrase 1',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph0'),
  0,
  'Em7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['D4', 'G4', 'B4', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph0'),
  1,
  'A7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['C#4', 'G4', 'B4', 'F#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph0'),
  2,
  'DM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['C#4', 'F#4', 'A4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph0'),
  3,
  'DM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['C#4', 'F#4', 'A4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing'),
  1,
  'フレーズ2',
  'Phrase 2',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph1-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph1'),
  0,
  'Am7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['G3', 'C4', 'E4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph1-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph1'),
  1,
  'D7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['F#3', 'C4', 'E4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph1-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph1'),
  2,
  'GM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['F#3', 'B3', 'D4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph1-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph1'),
  3,
  'GM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['F#3', 'B3', 'D4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  'thvi-quiz-b1-q7',
  'クイズ: まとめ',
  'Quiz: All keys',
  '60秒以内に20問正解。II-V-I の Drop2 ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using Drop 2 II-V-I voicings.',
  100, 0, 4, 4, 6, 6,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  0, 1, 1, 4,
  'Dm7(9)',
  ARRAY['C4', 'F4', 'A4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  1, 2, 1, 4,
  'G7(9.13)',
  ARRAY['B3', 'F4', 'A4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  2, 3, 1, 4,
  'CM7(9)',
  ARRAY['B3', 'E4', 'G4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  3, 1, 1, 4,
  'Gm7(9)',
  ARRAY['F3', 'Bb3', 'D4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  4, 2, 1, 4,
  'C7(9.13)',
  ARRAY['E3', 'Bb3', 'D4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  5, 3, 1, 4,
  'FM7(9)',
  ARRAY['E3', 'A3', 'C4', 'G4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  6, 1, 1, 4,
  'Cm7(9)',
  ARRAY['Bb3', 'Eb4', 'G4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  7, 2, 1, 4,
  'F7(9.13)',
  ARRAY['A3', 'Eb4', 'G4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  8, 3, 1, 4,
  'BbM7(9)',
  ARRAY['A3', 'D4', 'F4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  9, 1, 1, 4,
  'Fm7(9)',
  ARRAY['Eb4', 'Ab4', 'C5', 'G5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  10, 2, 1, 4,
  'Bb7(9.13)',
  ARRAY['D4', 'Ab4', 'C5', 'G5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  11, 3, 1, 4,
  'EbM7(9)',
  ARRAY['D4', 'G4', 'Bb4', 'F5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  12, 1, 1, 4,
  'Bbm7(9)',
  ARRAY['Ab3', 'Db4', 'F4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  13, 2, 1, 4,
  'Eb7(9.13)',
  ARRAY['G3', 'Db4', 'F4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-14'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  14, 3, 1, 4,
  'AbM7(9)',
  ARRAY['G3', 'C4', 'Eb4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  15, 1, 1, 4,
  'Ebm7(9)',
  ARRAY['Db4', 'Gb4', 'Bb4', 'F5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-16'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  16, 2, 1, 4,
  'Ab7(9.13)',
  ARRAY['C4', 'Gb4', 'Bb4', 'F5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-17'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  17, 3, 1, 4,
  'DbM7(9)',
  ARRAY['C4', 'F4', 'Ab4', 'Eb5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-18'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  18, 1, 1, 4,
  'Abm7(9)',
  ARRAY['Gb3', 'Cb4', 'Eb4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-19'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  19, 2, 1, 4,
  'Db7(9.13)',
  ARRAY['F3', 'Cb4', 'Eb4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  20, 3, 1, 4,
  'GbM7(9)',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-21'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  21, 1, 1, 4,
  'C#m7(9)',
  ARRAY['B3', 'E4', 'G#4', 'D#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-22'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  22, 2, 1, 4,
  'F#7(9.13)',
  ARRAY['A#3', 'E4', 'G#4', 'D#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-23'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  23, 3, 1, 4,
  'BM7(9)',
  ARRAY['A#3', 'D#4', 'F#4', 'C#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-24'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  24, 1, 1, 4,
  'F#m7(9)',
  ARRAY['E4', 'A4', 'C#5', 'G#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  25, 2, 1, 4,
  'B7(9.13)',
  ARRAY['D#4', 'A4', 'C#5', 'G#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-26'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  26, 3, 1, 4,
  'EM7(9)',
  ARRAY['D#4', 'G#4', 'B4', 'F#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-27'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  27, 1, 1, 4,
  'Bm7(9)',
  ARRAY['A3', 'D4', 'F#4', 'C#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-28'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  28, 2, 1, 4,
  'E7(9.13)',
  ARRAY['G#3', 'D4', 'F#4', 'C#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-29'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  29, 3, 1, 4,
  'AM7(9)',
  ARRAY['G#3', 'C#4', 'E4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  30, 1, 1, 4,
  'Em7(9)',
  ARRAY['D4', 'G4', 'B4', 'F#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-31'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  31, 2, 1, 4,
  'A7(9.13)',
  ARRAY['C#4', 'G4', 'B4', 'F#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-32'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  32, 3, 1, 4,
  'DM7(9)',
  ARRAY['C#4', 'F#4', 'A4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-33'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  33, 1, 1, 4,
  'Am7(9)',
  ARRAY['G3', 'C4', 'E4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-34'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  34, 2, 1, 4,
  'D7(9.13)',
  ARRAY['F#3', 'C4', 'E4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-item-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
  35, 3, 1, 4,
  'GM7(9)',
  ARRAY['F#3', 'B3', 'D4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz'),
  'thvi-quiz-b2-q1',
  'クイズ: Key of C & F',
  'Quiz: Key of C & F',
  '60秒以内に20問正解。II-V-I の Drop2 ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using Drop 2 II-V-I voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz'),
  0, 1, 1, 4,
  'Dm7(9)',
  ARRAY['F3', 'C4', 'E4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz'),
  1, 2, 1, 4,
  'G7(9.13)',
  ARRAY['F3', 'B3', 'E4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz'),
  2, 3, 1, 4,
  'CM7(9)',
  ARRAY['E3', 'B3', 'D4', 'G4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz'),
  3, 4, 1, 4,
  'Gm7(9)',
  ARRAY['Bb3', 'F4', 'A4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz'),
  4, 5, 1, 4,
  'C7(9.13)',
  ARRAY['Bb3', 'E4', 'A4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz'),
  5, 6, 1, 4,
  'FM7(9)',
  ARRAY['A3', 'E4', 'G4', 'C5']::text[],
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

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing'),
  'thvi-voicing-b2-q1',
  'バトル: Key of C & F',
  'Ear training: Key of C & F',
  'BPM100・3ループ以内に II-V-I を弾きましょう。',
  'Play II-V-I within 3 loops at 100 BPM.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing'),
  0,
  'フレーズ1',
  'Phrase 1',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph0'),
  0,
  'Dm7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['F3', 'C4', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph0'),
  1,
  'G7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['F3', 'B3', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph0'),
  2,
  'CM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['E3', 'B3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph0'),
  3,
  'CM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['E3', 'B3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing'),
  1,
  'フレーズ2',
  'Phrase 2',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph1-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph1'),
  0,
  'Gm7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['Bb3', 'F4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph1-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph1'),
  1,
  'C7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['Bb3', 'E4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph1-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph1'),
  2,
  'FM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['A3', 'E4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph1-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph1'),
  3,
  'FM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['A3', 'E4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz'),
  'thvi-quiz-b2-q2',
  'クイズ: Key of Bb & Eb',
  'Quiz: Key of Bb & Eb',
  '60秒以内に20問正解。II-V-I の Drop2 ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using Drop 2 II-V-I voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz'),
  0, 1, 1, 4,
  'Cm7(9)',
  ARRAY['Eb3', 'Bb3', 'D4', 'G4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz'),
  1, 2, 1, 4,
  'F7(9.13)',
  ARRAY['Eb3', 'A3', 'D4', 'G4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz'),
  2, 3, 1, 4,
  'BbM7(9)',
  ARRAY['D3', 'A3', 'C4', 'F4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz'),
  3, 4, 1, 4,
  'Fm7(9)',
  ARRAY['Ab3', 'Eb4', 'G4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz'),
  4, 5, 1, 4,
  'Bb7(9.13)',
  ARRAY['Ab3', 'D4', 'G4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz'),
  5, 6, 1, 4,
  'EbM7(9)',
  ARRAY['G3', 'D4', 'F4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing'),
  'thvi-voicing-b2-q2',
  'バトル: Key of Bb & Eb',
  'Ear training: Key of Bb & Eb',
  'BPM100・3ループ以内に II-V-I を弾きましょう。',
  'Play II-V-I within 3 loops at 100 BPM.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing'),
  0,
  'フレーズ1',
  'Phrase 1',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph0'),
  0,
  'Cm7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['Eb3', 'Bb3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph0'),
  1,
  'F7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['Eb3', 'A3', 'D4', 'G4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph0'),
  2,
  'BbM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['D3', 'A3', 'C4', 'F4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph0'),
  3,
  'BbM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['D3', 'A3', 'C4', 'F4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing'),
  1,
  'フレーズ2',
  'Phrase 2',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph1-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph1'),
  0,
  'Fm7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['Ab3', 'Eb4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph1-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph1'),
  1,
  'Bb7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['Ab3', 'D4', 'G4', 'C5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph1-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph1'),
  2,
  'EbM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['G3', 'D4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph1-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph1'),
  3,
  'EbM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['G3', 'D4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz'),
  'thvi-quiz-b2-q3',
  'クイズ: Key of Ab & Db',
  'Quiz: Key of Ab & Db',
  '60秒以内に20問正解。II-V-I の Drop2 ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using Drop 2 II-V-I voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz'),
  0, 1, 1, 4,
  'Bbm7(9)',
  ARRAY['Db4', 'Ab4', 'C5', 'F5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz'),
  1, 2, 1, 4,
  'Eb7(9.13)',
  ARRAY['Db4', 'G4', 'C5', 'F5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz'),
  2, 3, 1, 4,
  'AbM7(9)',
  ARRAY['C4', 'G4', 'Bb4', 'Eb5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz'),
  3, 4, 1, 4,
  'Ebm7(9)',
  ARRAY['Gb3', 'Db4', 'F4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz'),
  4, 5, 1, 4,
  'Ab7(9.13)',
  ARRAY['Gb3', 'C4', 'F4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz'),
  5, 6, 1, 4,
  'DbM7(9)',
  ARRAY['F3', 'C4', 'Eb4', 'Ab4']::text[],
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

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing'),
  'thvi-voicing-b2-q3',
  'バトル: Key of Ab & Db',
  'Ear training: Key of Ab & Db',
  'BPM100・3ループ以内に II-V-I を弾きましょう。',
  'Play II-V-I within 3 loops at 100 BPM.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing'),
  0,
  'フレーズ1',
  'Phrase 1',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph0'),
  0,
  'Bbm7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['Db4', 'Ab4', 'C5', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph0'),
  1,
  'Eb7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['Db4', 'G4', 'C5', 'F5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph0'),
  2,
  'AbM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['C4', 'G4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph0'),
  3,
  'AbM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['C4', 'G4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing'),
  1,
  'フレーズ2',
  'Phrase 2',
  NULL,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3',
  9.6, 57.6, 0,
  -5
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph1-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph1'),
  0,
  'Ebm7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['Gb3', 'Db4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph1-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph1'),
  1,
  'Ab7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['Gb3', 'C4', 'F4', 'Bb4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph1-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph1'),
  2,
  'DbM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['F3', 'C4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph1-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph1'),
  3,
  'DbM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['F3', 'C4', 'Eb4', 'Ab4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz'),
  'thvi-quiz-b2-q4',
  'クイズ: Key of Gb & B',
  'Quiz: Key of Gb & B',
  '60秒以内に20問正解。II-V-I の Drop2 ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using Drop 2 II-V-I voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz'),
  0, 1, 1, 4,
  'Abm7(9)',
  ARRAY['Cb4', 'Gb4', 'Bb4', 'Eb5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz'),
  1, 2, 1, 4,
  'Db7(9.13)',
  ARRAY['Cb4', 'F4', 'Bb4', 'Eb5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz'),
  2, 3, 1, 4,
  'GbM7(9)',
  ARRAY['Bb3', 'F4', 'Ab4', 'Db5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz'),
  3, 4, 1, 4,
  'C#m7(9)',
  ARRAY['E3', 'B3', 'D#4', 'G#4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz'),
  4, 5, 1, 4,
  'F#7(9.13)',
  ARRAY['E3', 'A#3', 'D#4', 'G#4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz'),
  5, 6, 1, 4,
  'BM7(9)',
  ARRAY['D#3', 'A#3', 'C#4', 'F#4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing'),
  'thvi-voicing-b2-q4',
  'バトル: Key of Gb & B',
  'Ear training: Key of Gb & B',
  'BPM100・3ループ以内に II-V-I を弾きましょう。',
  'Play II-V-I within 3 loops at 100 BPM.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing'),
  0,
  'フレーズ1',
  'Phrase 1',
  NULL,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3',
  9.6, 57.6, 0,
  -6
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph0'),
  0,
  'Abm7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['Cb4', 'Gb4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph0'),
  1,
  'Db7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['Cb4', 'F4', 'Bb4', 'Eb5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph0'),
  2,
  'GbM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['Bb3', 'F4', 'Ab4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph0'),
  3,
  'GbM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['Bb3', 'F4', 'Ab4', 'Db5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing'),
  1,
  'フレーズ2',
  'Phrase 2',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph1-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph1'),
  0,
  'C#m7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['E3', 'B3', 'D#4', 'G#4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph1-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph1'),
  1,
  'F#7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['E3', 'A#3', 'D#4', 'G#4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph1-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph1'),
  2,
  'BM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['D#3', 'A#3', 'C#4', 'F#4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph1-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph1'),
  3,
  'BM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['D#3', 'A#3', 'C#4', 'F#4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz'),
  'thvi-quiz-b2-q5',
  'クイズ: Key of E & A',
  'Quiz: Key of E & A',
  '60秒以内に20問正解。II-V-I の Drop2 ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using Drop 2 II-V-I voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz'),
  0, 1, 1, 4,
  'F#m7(9)',
  ARRAY['A3', 'E4', 'G#4', 'C#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz'),
  1, 2, 1, 4,
  'B7(9.13)',
  ARRAY['A3', 'D#4', 'G#4', 'C#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz'),
  2, 3, 1, 4,
  'EM7(9)',
  ARRAY['G#3', 'D#4', 'F#4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz'),
  3, 4, 1, 4,
  'Bm7(9)',
  ARRAY['D3', 'A3', 'C#4', 'F#4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz'),
  4, 5, 1, 4,
  'E7(9.13)',
  ARRAY['D3', 'G#3', 'C#4', 'F#4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz'),
  5, 6, 1, 4,
  'AM7(9)',
  ARRAY['C#3', 'G#3', 'B3', 'E4']::text[],
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

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing'),
  'thvi-voicing-b2-q5',
  'バトル: Key of E & A',
  'Ear training: Key of E & A',
  'BPM100・3ループ以内に II-V-I を弾きましょう。',
  'Play II-V-I within 3 loops at 100 BPM.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing'),
  0,
  'フレーズ1',
  'Phrase 1',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph0'),
  0,
  'F#m7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['A3', 'E4', 'G#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph0'),
  1,
  'B7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['A3', 'D#4', 'G#4', 'C#5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph0'),
  2,
  'EM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['G#3', 'D#4', 'F#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph0'),
  3,
  'EM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['G#3', 'D#4', 'F#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing'),
  1,
  'フレーズ2',
  'Phrase 2',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph1-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph1'),
  0,
  'Bm7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['D3', 'A3', 'C#4', 'F#4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph1-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph1'),
  1,
  'E7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['D3', 'G#3', 'C#4', 'F#4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph1-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph1'),
  2,
  'AM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['C#3', 'G#3', 'B3', 'E4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph1-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph1'),
  3,
  'AM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['C#3', 'G#3', 'B3', 'E4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz'),
  'thvi-quiz-b2-q6',
  'クイズ: Key of D & G',
  'Quiz: Key of D & G',
  '60秒以内に20問正解。II-V-I の Drop2 ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using Drop 2 II-V-I voicings.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz'),
  0, 1, 1, 4,
  'Em7(9)',
  ARRAY['G3', 'D4', 'F#4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz'),
  1, 2, 1, 4,
  'A7(9.13)',
  ARRAY['G3', 'C#4', 'F#4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz'),
  2, 3, 1, 4,
  'DM7(9)',
  ARRAY['F#3', 'C#4', 'E4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz'),
  3, 4, 1, 4,
  'Am7(9)',
  ARRAY['C4', 'G4', 'B4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz'),
  4, 5, 1, 4,
  'D7(9.13)',
  ARRAY['C4', 'F#4', 'B4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz'),
  5, 6, 1, 4,
  'GM7(9)',
  ARRAY['B3', 'F#4', 'A4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing'),
  'thvi-voicing-b2-q6',
  'バトル: Key of D & G',
  'Ear training: Key of D & G',
  'BPM100・3ループ以内に II-V-I を弾きましょう。',
  'Play II-V-I within 3 loops at 100 BPM.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing'),
  0,
  'フレーズ1',
  'Phrase 1',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph0-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph0'),
  0,
  'Em7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['G3', 'D4', 'F#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph0-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph0'),
  1,
  'A7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['G3', 'C#4', 'F#4', 'B4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph0-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph0'),
  2,
  'DM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['F#3', 'C#4', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph0-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph0'),
  3,
  'DM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['F#3', 'C#4', 'E4', 'A4']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing'),
  1,
  'フレーズ2',
  'Phrase 2',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph1-c0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph1'),
  0,
  'Am7(9)',
  1, 1, 4,
  0, 2.4,
  ARRAY['C4', 'G4', 'B4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph1-c1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph1'),
  1,
  'D7(9.13)',
  2, 1, 4,
  2.4, 4.8,
  ARRAY['C4', 'F#4', 'B4', 'E5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph1-c2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph1'),
  2,
  'GM7(9)',
  3, 1, 4,
  4.8, 7.199999999999999,
  ARRAY['B3', 'F#4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves;
INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,
  voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph1-c3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph1'),
  3,
  'GM7(9)',
  4, 1, 4,
  7.199999999999999, 9.6,
  ARRAY['B3', 'F#4', 'A4', 'D5']::text[],
  ARRAY[2, 1, 1, 1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  chord_name = EXCLUDED.chord_name,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  'thvi-quiz-b2-q7',
  'クイズ: まとめ',
  'Quiz: All keys',
  '60秒以内に20問正解。II-V-I の Drop2 ヴォイシングを弾きましょう。',
  'Answer 20 questions within 60 seconds using Drop 2 II-V-I voicings.',
  100, 0, 4, 4, 6, 6,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  0, 1, 1, 4,
  'Dm7(9)',
  ARRAY['F3', 'C4', 'E4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  1, 2, 1, 4,
  'G7(9.13)',
  ARRAY['F3', 'B3', 'E4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  2, 3, 1, 4,
  'CM7(9)',
  ARRAY['E3', 'B3', 'D4', 'G4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  3, 1, 1, 4,
  'Gm7(9)',
  ARRAY['Bb3', 'F4', 'A4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  4, 2, 1, 4,
  'C7(9.13)',
  ARRAY['Bb3', 'E4', 'A4', 'D5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  5, 3, 1, 4,
  'FM7(9)',
  ARRAY['A3', 'E4', 'G4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  6, 1, 1, 4,
  'Cm7(9)',
  ARRAY['Eb3', 'Bb3', 'D4', 'G4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  7, 2, 1, 4,
  'F7(9.13)',
  ARRAY['Eb3', 'A3', 'D4', 'G4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  8, 3, 1, 4,
  'BbM7(9)',
  ARRAY['D3', 'A3', 'C4', 'F4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  9, 1, 1, 4,
  'Fm7(9)',
  ARRAY['Ab3', 'Eb4', 'G4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  10, 2, 1, 4,
  'Bb7(9.13)',
  ARRAY['Ab3', 'D4', 'G4', 'C5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  11, 3, 1, 4,
  'EbM7(9)',
  ARRAY['G3', 'D4', 'F4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  12, 1, 1, 4,
  'Bbm7(9)',
  ARRAY['Db4', 'Ab4', 'C5', 'F5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  13, 2, 1, 4,
  'Eb7(9.13)',
  ARRAY['Db4', 'G4', 'C5', 'F5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-14'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  14, 3, 1, 4,
  'AbM7(9)',
  ARRAY['C4', 'G4', 'Bb4', 'Eb5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  15, 1, 1, 4,
  'Ebm7(9)',
  ARRAY['Gb3', 'Db4', 'F4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-16'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  16, 2, 1, 4,
  'Ab7(9.13)',
  ARRAY['Gb3', 'C4', 'F4', 'Bb4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-17'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  17, 3, 1, 4,
  'DbM7(9)',
  ARRAY['F3', 'C4', 'Eb4', 'Ab4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-18'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  18, 1, 1, 4,
  'Abm7(9)',
  ARRAY['Cb4', 'Gb4', 'Bb4', 'Eb5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-19'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  19, 2, 1, 4,
  'Db7(9.13)',
  ARRAY['Cb4', 'F4', 'Bb4', 'Eb5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  20, 3, 1, 4,
  'GbM7(9)',
  ARRAY['Bb3', 'F4', 'Ab4', 'Db5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-21'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  21, 1, 1, 4,
  'C#m7(9)',
  ARRAY['E3', 'B3', 'D#4', 'G#4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-22'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  22, 2, 1, 4,
  'F#7(9.13)',
  ARRAY['E3', 'A#3', 'D#4', 'G#4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-23'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  23, 3, 1, 4,
  'BM7(9)',
  ARRAY['D#3', 'A#3', 'C#4', 'F#4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-24'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  24, 1, 1, 4,
  'F#m7(9)',
  ARRAY['A3', 'E4', 'G#4', 'C#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  25, 2, 1, 4,
  'B7(9.13)',
  ARRAY['A3', 'D#4', 'G#4', 'C#5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-26'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  26, 3, 1, 4,
  'EM7(9)',
  ARRAY['G#3', 'D#4', 'F#4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-27'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  27, 1, 1, 4,
  'Bm7(9)',
  ARRAY['D3', 'A3', 'C#4', 'F#4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-28'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  28, 2, 1, 4,
  'E7(9.13)',
  ARRAY['D3', 'G#3', 'C#4', 'F#4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-29'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  29, 3, 1, 4,
  'AM7(9)',
  ARRAY['C#3', 'G#3', 'B3', 'E4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  30, 1, 1, 4,
  'Em7(9)',
  ARRAY['G3', 'D4', 'F#4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-31'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  31, 2, 1, 4,
  'A7(9.13)',
  ARRAY['G3', 'C#4', 'F#4', 'B4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-32'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  32, 3, 1, 4,
  'DM7(9)',
  ARRAY['F#3', 'C#4', 'E4', 'A4']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-33'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  33, 1, 1, 4,
  'Am7(9)',
  ARRAY['C4', 'G4', 'B4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-34'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  34, 2, 1, 4,
  'D7(9.13)',
  ARRAY['C4', 'F#4', 'B4', 'E5']::text[],
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-item-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
  35, 3, 1, 4,
  'GM7(9)',
  ARRAY['B3', 'F#4', 'A4', 'D5']::text[],
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

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'Key of C & F',
  'Key of C & F',
  'Key of C & F の II-V-I Drop2 ヴォイシングを練習します。',
  'Practice Drop 2 II-V-I voicings in Key of C & F.',
  true,
  0, 1,
  'II-V-I Drop2 Voicing A-B-Aフォーム',
  'II-V-I Drop2 Voicing A-B-A Form',
  '[]'::jsonb,
  '①クイズ ②バトル ③サバイバル',
  '① Quiz ② Battle ③ Survival'
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-demo-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, false, NULL,
   true, false,
   'thvi-demo-b1-q1', NULL,
   NULL,
   'デモ', 'Demo', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ', 'Quiz', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1'), NULL, 2, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル', 'Battle', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1'), NULL, 3, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1201, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル', 'Survival', true)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'Key of Bb & Eb',
  'Key of Bb & Eb',
  'Key of Bb & Eb の II-V-I Drop2 ヴォイシングを練習します。',
  'Practice Drop 2 II-V-I voicings in Key of Bb & Eb.',
  true,
  1, 1,
  'II-V-I Drop2 Voicing A-B-Aフォーム',
  'II-V-I Drop2 Voicing A-B-A Form',
  '[]'::jsonb,
  '①クイズ ②バトル ③サバイバル',
  '① Quiz ② Battle ③ Survival'
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2'), NULL, 0, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ', 'Quiz', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル', 'Battle', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1202, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル', 'Survival', true)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'Key of Ab & Db',
  'Key of Ab & Db',
  'Key of Ab & Db の II-V-I Drop2 ヴォイシングを練習します。',
  'Practice Drop 2 II-V-I voicings in Key of Ab & Db.',
  true,
  2, 1,
  'II-V-I Drop2 Voicing A-B-Aフォーム',
  'II-V-I Drop2 Voicing A-B-A Form',
  '[]'::jsonb,
  '①クイズ ②バトル ③サバイバル',
  '① Quiz ② Battle ③ Survival'
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3'), NULL, 0, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ', 'Quiz', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル', 'Battle', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1203, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル', 'Survival', true)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'Key of Gb & B',
  'Key of Gb & B',
  'Key of Gb & B の II-V-I Drop2 ヴォイシングを練習します。',
  'Practice Drop 2 II-V-I voicings in Key of Gb & B.',
  true,
  3, 1,
  'II-V-I Drop2 Voicing A-B-Aフォーム',
  'II-V-I Drop2 Voicing A-B-A Form',
  '[]'::jsonb,
  '①クイズ ②バトル ③サバイバル',
  '① Quiz ② Battle ③ Survival'
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4'), NULL, 0, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ', 'Quiz', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル', 'Battle', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1204, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル', 'Survival', true)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'Key of E & A',
  'Key of E & A',
  'Key of E & A の II-V-I Drop2 ヴォイシングを練習します。',
  'Practice Drop 2 II-V-I voicings in Key of E & A.',
  true,
  4, 1,
  'II-V-I Drop2 Voicing A-B-Aフォーム',
  'II-V-I Drop2 Voicing A-B-A Form',
  '[]'::jsonb,
  '①クイズ ②バトル ③サバイバル',
  '① Quiz ② Battle ③ Survival'
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5'), NULL, 0, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ', 'Quiz', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル', 'Battle', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1205, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル', 'Survival', true)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'Key of D & G',
  'Key of D & G',
  'Key of D & G の II-V-I Drop2 ヴォイシングを練習します。',
  'Practice Drop 2 II-V-I voicings in Key of D & G.',
  true,
  5, 1,
  'II-V-I Drop2 Voicing A-B-Aフォーム',
  'II-V-I Drop2 Voicing A-B-A Form',
  '[]'::jsonb,
  '①クイズ ②バトル ③サバイバル',
  '① Quiz ② Battle ③ Survival'
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6'), NULL, 0, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ', 'Quiz', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル', 'Battle', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1206, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル', 'Survival', true)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'まとめ',
  'All keys',
  '全キーの II-V-I Drop2 ヴォイシングを総復習します。',
  'Review Drop 2 II-V-I voicings in all keys.',
  true,
  6, 1,
  'II-V-I Drop2 Voicing A-B-Aフォーム',
  'II-V-I Drop2 Voicing A-B-A Form',
  '[]'::jsonb,
  '①クイズ: 60秒20問 ②サバイバル: 全キー順番',
  '① Quiz: 20 in 60s ② Survival: all keys in order'
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7'), NULL, 0, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ', 'Quiz', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1207, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル', 'Survival', true)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'Key of C & F',
  'Key of C & F',
  'Key of C & F の II-V-I Drop2 ヴォイシングを練習します。',
  'Practice Drop 2 II-V-I voicings in Key of C & F.',
  true,
  7, 2,
  'II-V-I Drop2 Voicing B-A-Bフォーム',
  'II-V-I Drop2 Voicing B-A-B Form',
  '[]'::jsonb,
  '①クイズ ②バトル ③サバイバル',
  '① Quiz ② Battle ③ Survival'
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-demo-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, false, NULL,
   true, false,
   'thvi-demo-b2-q1', NULL,
   NULL,
   'デモ', 'Demo', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ', 'Quiz', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1'), NULL, 2, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル', 'Battle', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1'), NULL, 3, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1208, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル', 'Survival', true)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'Key of Bb & Eb',
  'Key of Bb & Eb',
  'Key of Bb & Eb の II-V-I Drop2 ヴォイシングを練習します。',
  'Practice Drop 2 II-V-I voicings in Key of Bb & Eb.',
  true,
  8, 2,
  'II-V-I Drop2 Voicing B-A-Bフォーム',
  'II-V-I Drop2 Voicing B-A-B Form',
  '[]'::jsonb,
  '①クイズ ②バトル ③サバイバル',
  '① Quiz ② Battle ③ Survival'
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2'), NULL, 0, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ', 'Quiz', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル', 'Battle', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1209, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル', 'Survival', true)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'Key of Ab & Db',
  'Key of Ab & Db',
  'Key of Ab & Db の II-V-I Drop2 ヴォイシングを練習します。',
  'Practice Drop 2 II-V-I voicings in Key of Ab & Db.',
  true,
  9, 2,
  'II-V-I Drop2 Voicing B-A-Bフォーム',
  'II-V-I Drop2 Voicing B-A-B Form',
  '[]'::jsonb,
  '①クイズ ②バトル ③サバイバル',
  '① Quiz ② Battle ③ Survival'
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3'), NULL, 0, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ', 'Quiz', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル', 'Battle', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1210, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル', 'Survival', true)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'Key of Gb & B',
  'Key of Gb & B',
  'Key of Gb & B の II-V-I Drop2 ヴォイシングを練習します。',
  'Practice Drop 2 II-V-I voicings in Key of Gb & B.',
  true,
  10, 2,
  'II-V-I Drop2 Voicing B-A-Bフォーム',
  'II-V-I Drop2 Voicing B-A-B Form',
  '[]'::jsonb,
  '①クイズ ②バトル ③サバイバル',
  '① Quiz ② Battle ③ Survival'
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4'), NULL, 0, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ', 'Quiz', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル', 'Battle', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1211, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル', 'Survival', true)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'Key of E & A',
  'Key of E & A',
  'Key of E & A の II-V-I Drop2 ヴォイシングを練習します。',
  'Practice Drop 2 II-V-I voicings in Key of E & A.',
  true,
  11, 2,
  'II-V-I Drop2 Voicing B-A-Bフォーム',
  'II-V-I Drop2 Voicing B-A-B Form',
  '[]'::jsonb,
  '①クイズ ②バトル ③サバイバル',
  '① Quiz ② Battle ③ Survival'
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5'), NULL, 0, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ', 'Quiz', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル', 'Battle', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1212, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル', 'Survival', true)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'Key of D & G',
  'Key of D & G',
  'Key of D & G の II-V-I Drop2 ヴォイシングを練習します。',
  'Practice Drop 2 II-V-I voicings in Key of D & G.',
  true,
  12, 2,
  'II-V-I Drop2 Voicing B-A-Bフォーム',
  'II-V-I Drop2 Voicing B-A-B Form',
  '[]'::jsonb,
  '①クイズ ②バトル ③サバイバル',
  '① Quiz ② Battle ③ Survival'
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6'), NULL, 0, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ', 'Quiz', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6'), NULL, 1, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing'),
   false, false, NULL, NULL,
   NULL,
   'バトル', 'Battle', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1213, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル', 'Survival', true)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-two-hand-voicing-intermediate'),
  'まとめ',
  'All keys',
  '全キーの II-V-I Drop2 ヴォイシングを総復習します。',
  'Review Drop 2 II-V-I voicings in all keys.',
  true,
  13, 2,
  'II-V-I Drop2 Voicing B-A-Bフォーム',
  'II-V-I Drop2 Voicing B-A-B Form',
  '[]'::jsonb,
  '①クイズ: 60秒20問 ②サバイバル: 全キー順番',
  '① Quiz: 20 in 60s ② Survival: all keys in order'
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7'), NULL, 0, '{"count":1,"rank":"B"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz'),
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'クイズ', 'Quiz', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-survival-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true,
   1214, 'lesson', false, NULL, false, NULL,
   false, false, NULL, NULL,
   '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb,
   'サバイバル', 'Survival', true)
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
