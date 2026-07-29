-- メインクエスト Ch4（左手コンピング）+ Ch5（Jazzify Blues）
-- 生成: node scripts/generate-mq-block3-ch4-ch5-migration.mjs
-- 事前: node scripts/prepare-mq-b3-b4-assets.mjs && node scripts/upload-sozai-main-quest-block3-r2.mjs
-- 注意: mq-b3-4-2-4.mp3 が 4-1-4 と同一だった場合は音源差し替え後に再アップロードすること
BEGIN;


INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b3-q1-dialogue-v1',
  'MQ Ch4 Q1: 左手パターン紹介',
  'MQ Ch4 Q1: LH pattern intro',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenarioOverrides":{"hideStaffOnBSlotCompletion":false,"hideStaff":false},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"ここからは左手のコンピングじゃ。リズムでコードを支える力を鍛えるぞ。","en":"From here we build LH comping — the rhythm that holds the harmony."},{"speaker":"fai","ja":"右手だけじゃなくて、左手のパターンを覚えるんだね。","en":"So I learn left-hand patterns, not just the right hand."},{"speaker":"jajii","ja":"今日は3つ。まず「1頭と3ウラ」。次に「1ウラと3ウラ」。最後は「4ウラと2ウラ」じゃ。","en":"Three patterns today: beat 1 + and-of-3, then and-of-1 + and-of-3, then and-of-4 + and-of-2."},{"speaker":"fai","ja":"コードも少し変わるって聞いたよ。","en":"I heard the chords shift a little too."},{"speaker":"jajii","ja":"うむ。形は同じでも、響きが変わると左手の仕事が生きてくる。まずは1つずつ体に入れよう。","en":"Aye. Same shapes, new colors — that is when the left hand starts to speak. One pattern at a time."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b3-q2-dialogue-v1',
  'MQ Ch4 Q2: 両手導入',
  'MQ Ch4 Q2: Two-hand intro',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenarioOverrides":{"hideStaffOnBSlotCompletion":false,"hideStaff":false},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"左手が少し動けるようになったのう。次は右手のパターンと一緒に弾いてみるぞ。","en":"Your left hand is waking up. Next, play it with a right-hand pattern."},{"speaker":"fai","ja":"両手…難しそう。","en":"Both hands… that sounds hard."},{"speaker":"jajii","ja":"コールアンドレスポンスじゃ。聴いて、返して。完璧じゃなくても大丈夫。","en":"It is call and response — listen, then answer. It does not have to be perfect."},{"speaker":"jajii","ja":"このクエストの演奏課題はクリア必須ではない。ある程度練習したら、難しかったら先に進んでよいぞ。","en":"These performance tasks are optional. Practice a bit, and if it feels too hard, move on."},{"speaker":"fai","ja":"じゃあ、まずは様子を見ながらやってみる！","en":"Okay — I will try, and see how it feels!"}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.ear_training_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b4-q1-osmd-v1',
  'MQ Ch5 Q1: Jazzify Blues テーマ',
  'MQ Ch5 Q1: Jazzify Blues theme',
  '{"version":1,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideLobby":true,"hideMidiToggle":true,"hidePhraseIntroQuota":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{"mq-b4-5-1-1-osmd":{"stage":{"slug":"mq-b4-5-1-1-osmd","title":"Jazzify Blues テーマ（右手）","title_en":"Jazzify Blues theme (RH)","bpm":100,"key_fifths":0,"beats_per_measure":4,"beat_type":4,"loop_measures":25,"max_loops_per_phrase":2,"count_in_beats":0,"time_limit_sec":600,"player_hp":100,"enemy_hp":10000,"per_correct_note_damage":10,"good_completion_damage":30,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"chord_osmd","show_keyboard_hints_in_battle":true,"osmd_targets_from_score":true,"is_swing":true},"phrases":[{"order_index":0,"title":"Jazzify Blues テーマ","title_en":"Jazzify Blues theme","music_xml_url":"https://jazzify-cdn.com/sozai/mq-b4-5-1-1-guide-voice4-cue.musicxml?v=202607292330","audio_url":"https://jazzify-cdn.com/sozai/mq-b4-5-1-1.mp3?v=202607292330","loop_duration_sec":60,"audio_duration_sec":60,"note_count":0,"key_fifths":0}]}},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"ここからは Jazzify Blues じゃ。お前のテーマを、右手だけで確かめるぞ。","en":"Now comes Jazzify Blues. We check your theme with the right hand alone."},{"speaker":"fai","ja":"テーマ…曲の顔みたいなメロディだよね。","en":"The theme — like the face of the tune."},{"speaker":"jajii","ja":"そうじゃ。まずは譜面どおりに、右手でメロディを通してみるのじゃ。","en":"Aye. First, walk the melody from the score with your right hand."},{"speaker":"fai","ja":"よし、テーマ練習いってみよう！","en":"Alright — theme practice, here I go!"}]},{"type":"chord_osmd","contentRef":"mq-b4-5-1-1-osmd","requiredLoops":1},{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"よいぞ。テーマが口をついて出るようになれば、次は左手も足せる。","en":"Good. Once the theme is on your tongue, we can add the left hand."},{"speaker":"fai","ja":"次は両手だね。楽しみ！","en":"Next is both hands. I am ready!"}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b4-q2-dialogue-v1',
  'MQ Ch5 Q2: テーマ＋左手',
  'MQ Ch5 Q2: Theme + LH',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenarioOverrides":{"hideStaffOnBSlotCompletion":false,"hideStaff":false},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"テーマが右手で弾けるようになった。次はテーマを弾きながら、左手も入れるぞ。","en":"You can play the theme in the right hand. Next, keep the theme and add the left hand."},{"speaker":"fai","ja":"左手のパターン、前の章でやったやつ？","en":"The left-hand patterns from the last chapter?"},{"speaker":"jajii","ja":"うむ。まずは「1頭のみ」、次に「1頭と3ウラ」。難しかったら飛ばしてよい、おまけ課題じゃ。","en":"Aye. First beat-1 only, then beat 1 + and-of-3. Skip if needed — these are optional."},{"speaker":"fai","ja":"テーマを守りながら左手…やってみる！","en":"Hold the theme, add the left hand… I will try!"}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b4-q3-intro-v1',
  'MQ Ch5 Q3: まとめ導入',
  'MQ Ch5 Q3: Summary intro',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenarioOverrides":{"hideStaffOnBSlotCompletion":false,"hideStaff":false},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"まとめじゃ。Jazzify Blues は「テーマ → アドリブ → テーマ」で一曲になる。","en":"Summary time. Jazzify Blues becomes one tune: theme, then ad-lib, then theme."},{"speaker":"fai","ja":"最初と最後がテーマで、真ん中が自由なんだね。","en":"Theme at the start and end, freedom in the middle."},{"speaker":"jajii","ja":"そうじゃ。まずは片手で通す。余裕があれば両手、さらに精密にも挑戦してみるのじゃ。","en":"Aye. First one hand. If you have room, try two hands — and precision after that."},{"speaker":"fai","ja":"通しで弾くの、ちょっと緊張する…でもいこう！","en":"Playing it through is a little scary… but let us go!"}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b4-q3-outro-v1',
  'MQ Ch5 Q3: Fブルース展望',
  'MQ Ch5 Q3: F blues outlook',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenarioOverrides":{"hideStaffOnBSlotCompletion":false,"hideStaff":false},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"ようやった。Cブルースの土台と、Jazzify Blues のテーマが体に入ってきたのう。","en":"Well done. The C blues foundation and the Jazzify Blues theme are settling in."},{"speaker":"fai","ja":"左手のリズムも、少しずつ馴染んできた気がする。","en":"The left-hand rhythms are starting to feel familiar too."},{"speaker":"jajii","ja":"次のチャプターは Fブルースへの挑戦じゃ。キーが変わると景色も変わる。楽しみにしておれ。","en":"Next chapter: take on the F blues. A new key, a new landscape. Look forward to it."},{"speaker":"fai","ja":"Fブルース…いってみよう！","en":"F blues… I am in!"}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();


DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-1-2-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-1-2-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-1-2-stage'),
  'mq-b3-4-1-2-osmd',
  'パターン1（1頭3ウラ）',
  'Pattern 1 (beat 1 + and-of-3)',
  '左手コンピング：1頭と3ウラ。',
  'LH comping: beat 1 and the and-of-3.',
  100, 0, 4, 4, 25, 2,
  0, 600, 100, 96,
  1, 0, 0, 0,
  3, 5, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-1-2-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-1-2-stage'),
  0,
  'パターン1（1頭3ウラ）',
  'Pattern 1 (beat 1 + and-of-3)',
  'https://jazzify-cdn.com/sozai/mq-b3-4-1-2-guide-voice4-cue.musicxml?v=202607292330',
  'https://jazzify-cdn.com/sozai/mq-b3-4-1-2.mp3?v=202607292330',
  60,
  60,
  0,
  0
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-1-3-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-1-3-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-1-3-stage'),
  'mq-b3-4-1-3-osmd',
  'パターン2（1ウラ3ウラ）',
  'Pattern 2 (and-of-1 + and-of-3)',
  '左手コンピング：1ウラと3ウラ。',
  'LH comping: and-of-1 and and-of-3.',
  100, 0, 4, 4, 25, 2,
  0, 600, 100, 96,
  1, 0, 0, 0,
  3, 5, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-1-3-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-1-3-stage'),
  0,
  'パターン2（1ウラ3ウラ）',
  'Pattern 2 (and-of-1 + and-of-3)',
  'https://jazzify-cdn.com/sozai/mq-b3-4-1-3-guide-voice4-cue.musicxml?v=202607292330',
  'https://jazzify-cdn.com/sozai/mq-b3-4-1-3.mp3?v=202607292330',
  60,
  60,
  0,
  0
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-1-4-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-1-4-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-1-4-stage'),
  'mq-b3-4-1-4-osmd',
  'パターン3（4ウラ2ウラ）',
  'Pattern 3 (and-of-4 + and-of-2)',
  '左手コンピング：4ウラと2ウラ。',
  'LH comping: and-of-4 and and-of-2.',
  100, 0, 4, 4, 26, 2,
  0, 600, 100, 98,
  1, 0, 0, 0,
  3, 5, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-1-4-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-1-4-stage'),
  0,
  'パターン3（4ウラ2ウラ）',
  'Pattern 3 (and-of-4 + and-of-2)',
  'https://jazzify-cdn.com/sozai/mq-b3-4-1-4-guide-voice4-cue.musicxml?v=202607292330',
  'https://jazzify-cdn.com/sozai/mq-b3-4-1-4.mp3?v=202607292330',
  62.4,
  62.4,
  0,
  0
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-2-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-2-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-2-stage'),
  'mq-b3-4-2-2-osmd',
  '両手パターン1（1頭のみ）',
  'Two-hand pattern 1 (beat 1 only)',
  '右手と一緒に。コールアンドレスポンス（クリア必須ではない）。',
  'With RH. Call-and-response (optional clear).',
  100, 0, 4, 4, 25, 2,
  0, 600, 100, 128,
  1, 0, 0, 0,
  3, 5, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-2-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-2-stage'),
  0,
  '両手パターン1（1頭のみ）',
  'Two-hand pattern 1 (beat 1 only)',
  'https://jazzify-cdn.com/sozai/mq-b3-4-2-2-guide-voice4-cue.musicxml?v=202607292330',
  'https://jazzify-cdn.com/sozai/mq-b3-4-2-2.mp3?v=202607292330',
  60,
  60,
  0,
  0
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-2-prec-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-2-prec-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-2-prec-stage'),
  'mq-b3-4-2-2-precision',
  '両手パターン1・精密',
  'Two-hand pattern 1 · Precision',
  '精密モード（Voice4なし）。クリア必須ではない。',
  'Precision mode (no Voice4). Optional clear.',
  100, 0, 4, 4, 25, 2,
  0, 600, 100, 1,
  0, 0, 0, 0,
  0, 0, 4, 8,
  'blue_club', true, false, 'chord_precision',
  false, true, true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-2-prec-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-2-prec-stage'),
  0,
  '両手パターン1・精密',
  'Two-hand pattern 1 · Precision',
  'https://jazzify-cdn.com/sozai/mq-b3-4-2-2-precision.musicxml?v=202607292330',
  'https://jazzify-cdn.com/sozai/mq-b3-4-2-2.mp3?v=202607292330',
  60,
  60,
  0,
  0
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-4-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-4-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-4-stage'),
  'mq-b3-4-2-4-osmd',
  '両手パターン2（1頭3ウラ）',
  'Two-hand pattern 2 (beat 1 + and-of-3)',
  '右手と一緒に。コールアンドレスポンス（クリア必須ではない）。',
  'With RH. Call-and-response (optional clear).',
  100, 0, 4, 4, 25, 2,
  0, 600, 100, 168,
  1, 0, 0, 0,
  2, 3, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-4-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-4-stage'),
  0,
  '両手パターン2（1頭3ウラ）',
  'Two-hand pattern 2 (beat 1 + and-of-3)',
  'https://jazzify-cdn.com/sozai/mq-b3-4-2-4-guide-voice4-cue.musicxml?v=202607292330',
  'https://jazzify-cdn.com/sozai/mq-b3-4-2-4.mp3?v=202607292330',
  60,
  60,
  0,
  0
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-4-prec-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-4-prec-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-4-prec-stage'),
  'mq-b3-4-2-4-precision',
  '両手パターン2・精密',
  'Two-hand pattern 2 · Precision',
  '精密モード（Voice4なし）。クリア必須ではない。',
  'Precision mode (no Voice4). Optional clear.',
  100, 0, 4, 4, 25, 2,
  0, 600, 100, 1,
  0, 0, 0, 0,
  0, 0, 4, 8,
  'blue_club', true, false, 'chord_precision',
  false, true, true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-4-prec-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-4-prec-stage'),
  0,
  '両手パターン2・精密',
  'Two-hand pattern 2 · Precision',
  'https://jazzify-cdn.com/sozai/mq-b3-4-2-4-precision.musicxml?v=202607292330',
  'https://jazzify-cdn.com/sozai/mq-b3-4-2-4.mp3?v=202607292330',
  60,
  60,
  0,
  0
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-2-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-2-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-2-stage'),
  'mq-b4-5-2-2-osmd',
  'テーマ＋左手（1頭のみ）',
  'Theme + LH (beat 1 only)',
  'テーマを弾きながら左手（クリア必須ではない）。',
  'Play the theme with LH (optional clear).',
  100, 0, 4, 4, 25, 2,
  0, 600, 100, 140,
  1, 0, 0, 0,
  2, 3, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-2-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-2-stage'),
  0,
  'テーマ＋左手（1頭のみ）',
  'Theme + LH (beat 1 only)',
  'https://jazzify-cdn.com/sozai/mq-b4-5-2-2-guide-voice4-cue.musicxml?v=202607292330',
  'https://jazzify-cdn.com/sozai/mq-b4-5-2-2.mp3?v=202607292330',
  60,
  60,
  0,
  0
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-3-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-3-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-3-stage'),
  'mq-b4-5-2-3-precision',
  'テーマ＋左手（1頭）・精密',
  'Theme + LH (beat 1) · Precision',
  '5-2-2 の精密モード。クリア必須ではない。',
  'Precision version of 5-2-2. Optional clear.',
  100, 0, 4, 4, 25, 2,
  0, 600, 100, 1,
  0, 0, 0, 0,
  0, 0, 4, 8,
  'blue_club', true, false, 'chord_precision',
  false, true, true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-3-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-3-stage'),
  0,
  'テーマ＋左手（1頭）・精密',
  'Theme + LH (beat 1) · Precision',
  'https://jazzify-cdn.com/sozai/mq-b4-5-2-2-precision.musicxml?v=202607292330',
  'https://jazzify-cdn.com/sozai/mq-b4-5-2-2.mp3?v=202607292330',
  60,
  60,
  0,
  0
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-4-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-4-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-4-stage'),
  'mq-b4-5-2-4-osmd',
  'テーマ＋左手（1頭3ウラ）',
  'Theme + LH (beat 1 + and-of-3)',
  'テーマを弾きながら左手（クリア必須ではない）。',
  'Play the theme with LH (optional clear).',
  100, 0, 4, 4, 25, 2,
  0, 600, 100, 180,
  1, 0, 0, 0,
  2, 3, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-4-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-4-stage'),
  0,
  'テーマ＋左手（1頭3ウラ）',
  'Theme + LH (beat 1 + and-of-3)',
  'https://jazzify-cdn.com/sozai/mq-b4-5-2-4-guide-voice4-cue.musicxml?v=202607292330',
  'https://jazzify-cdn.com/sozai/mq-b4-5-2-4.mp3?v=202607292330',
  60,
  60,
  0,
  0
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-5-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-5-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-5-stage'),
  'mq-b4-5-2-5-precision',
  'テーマ＋左手（1頭3ウラ）・精密',
  'Theme + LH (1+and-of-3) · Precision',
  '5-2-4 の精密モード。クリア必須ではない。',
  'Precision version of 5-2-4. Optional clear.',
  100, 0, 4, 4, 25, 2,
  0, 600, 100, 1,
  0, 0, 0, 0,
  0, 0, 4, 8,
  'blue_club', true, false, 'chord_precision',
  false, true, true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-5-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-5-stage'),
  0,
  'テーマ＋左手（1頭3ウラ）・精密',
  'Theme + LH (1+and-of-3) · Precision',
  'https://jazzify-cdn.com/sozai/mq-b4-5-2-4-precision.musicxml?v=202607292330',
  'https://jazzify-cdn.com/sozai/mq-b4-5-2-4.mp3?v=202607292330',
  60,
  60,
  0,
  0
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-3-2-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-3-2-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-3-2-stage'),
  'mq-b4-5-3-2-osmd',
  'まとめ・片手',
  'Summary · One hand',
  'テーマ→アドリブ→テーマ。右手だけで通す。',
  'Theme–ad-lib–theme. One hand through.',
  100, 0, 4, 4, 37, 2,
  0, 600, 100, 124,
  1, 0, 0, 0,
  3, 5, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-3-2-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-3-2-stage'),
  0,
  'まとめ・片手',
  'Summary · One hand',
  'https://jazzify-cdn.com/sozai/mq-b4-5-3-2-guide-voice4-cue.musicxml?v=202607292330',
  'https://jazzify-cdn.com/sozai/mq-b4-5-3-2.mp3?v=202607292330',
  88.8,
  88.8,
  0,
  0
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-3-3-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-3-3-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-3-3-stage'),
  'mq-b4-5-3-3-osmd',
  'まとめ・両手',
  'Summary · Two hands',
  '両手で通す（クリア必須ではない）。',
  'Two hands through (optional clear).',
  100, 0, 4, 4, 37, 2,
  0, 600, 100, 260,
  1, 0, 0, 0,
  1, 2, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-3-3-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-3-3-stage'),
  0,
  'まとめ・両手',
  'Summary · Two hands',
  'https://jazzify-cdn.com/sozai/mq-b4-5-3-3-guide-voice4-cue.musicxml?v=202607292330',
  'https://jazzify-cdn.com/sozai/mq-b4-5-3-3.mp3?v=202607292330',
  88.8,
  88.8,
  0,
  0
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-3-3-prec-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-3-3-prec-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-3-3-prec-stage'),
  'mq-b4-5-3-3-precision',
  'まとめ・両手・精密',
  'Summary · Two hands · Precision',
  '両手の精密モード（クリア必須ではない）。',
  'Two-hand precision (optional clear).',
  100, 0, 4, 4, 37, 2,
  0, 600, 100, 1,
  0, 0, 0, 0,
  0, 0, 4, 8,
  'blue_club', true, false, 'chord_precision',
  false, true, true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-3-3-prec-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-3-3-prec-stage'),
  0,
  'まとめ・両手・精密',
  'Summary · Two hands · Precision',
  'https://jazzify-cdn.com/sozai/mq-b4-5-3-3-precision.musicxml?v=202607292330',
  'https://jazzify-cdn.com/sozai/mq-b4-5-3-3.mp3?v=202607292330',
  88.8,
  88.8,
  0,
  0
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en, block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en, manual_completion_disabled
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-q1-lesson'), 'a0000000-0000-0000-0000-000000000001'::uuid,
    'クエスト1：左手のパターン', 'Quest 1: Left-hand patterns',
    '左手コンピングの3リズムを覚える。', 'Learn three LH comping rhythms.',
    false, 0, 4,
    'Cブルース 左手コンピングのリズム', 'C Blues: LH Comping Rhythms',
    '左手でコードを支えるリズムを身につける。', 'Build rhythms that support the chords with the left hand.',
    '[]'::jsonb,
    '3つの左手パターンを練習しましょう。', 'Practice the three left-hand patterns.',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-q2-lesson'), 'a0000000-0000-0000-0000-000000000001'::uuid,
    'クエスト2：右手パターンと一緒に演奏', 'Quest 2: Play with a right-hand pattern',
    '左手と右手を合わせてコールアンドレスポンス。クリア必須ではない。', 'Combine hands in call-and-response. Clearing is optional.',
    false, 1, 4,
    'Cブルース 左手コンピングのリズム', 'C Blues: LH Comping Rhythms',
    '左手でコードを支えるリズムを身につける。', 'Build rhythms that support the chords with the left hand.',
    '[]'::jsonb,
    '両手の練習はおまけ課題です。難しかったら先へ進んでよいです。', 'Two-hand practice is optional. Move on if it is too hard.',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q1-lesson'), 'a0000000-0000-0000-0000-000000000001'::uuid,
    'クエスト1：テーマを右手だけで練習', 'Quest 1: Practice the theme with RH only',
    'Jazzify Blues のテーマを右手で通す。', 'Play the Jazzify Blues theme with the right hand.',
    false, 0, 5,
    'Jazzify Blues', 'Jazzify Blues',
    'テーマと左手コンピングを組み合わせて一曲にする。', 'Combine theme and LH comping into one tune.',
    '[]'::jsonb,
    'テーマを右手だけで練習しましょう。', 'Practice the theme with the right hand only.',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q2-lesson'), 'a0000000-0000-0000-0000-000000000001'::uuid,
    'クエスト2：テーマを弾きながら左手も入れる', 'Quest 2: Theme with left hand',
    'テーマに左手パターンを重ねる。クリア必須ではない。', 'Layer LH patterns under the theme. Clearing is optional.',
    false, 1, 5,
    'Jazzify Blues', 'Jazzify Blues',
    'テーマと左手コンピングを組み合わせて一曲にする。', 'Combine theme and LH comping into one tune.',
    '[]'::jsonb,
    '両手課題はおまけです。', 'Two-hand tasks are optional.',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q3-lesson'), 'a0000000-0000-0000-0000-000000000001'::uuid,
    'クエスト3：まとめ', 'Quest 3: Summary',
    'テーマ→アドリブ→テーマで通す。両手はおまけ。', 'Play theme–ad-lib–theme. Two hands are optional.',
    false, 2, 5,
    'Jazzify Blues', 'Jazzify Blues',
    'テーマと左手コンピングを組み合わせて一曲にする。', 'Combine theme and LH comping into one tune.',
    '[]'::jsonb,
    '片手で通し、余裕があれば両手・精密へ。', 'Clear one-hand; try two hands and precision if ready.',
    false
  )
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  assignment_description = EXCLUDED.assignment_description,
  assignment_description_en = EXCLUDED.assignment_description_en,
  manual_completion_disabled = EXCLUDED.manual_completion_disabled,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_ear_training, ear_training_stage_id,
  is_ear_training_tutorial, ear_training_tutorial_script_id,
  is_survival_tutorial, survival_tutorial_script_id,
  is_balloon_rush, balloon_rush_stage_id,
  survival_lesson_overrides, survival_random_chords,
  override_production_staff_hint_mode, override_production_keyboard_hint_mode,
  title, title_en, is_clear_required
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-q1-0-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-q1-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    false, NULL,
    false, NULL,
    true, 'mq-b3-q1-dialogue-v1',
    false, NULL, NULL, NULL, NULL, NULL,
    '1-0. 左手パターンの紹介', '1-0. LH pattern intro',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-q1-1-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-q1-lesson'), NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-1-2-stage'),
    false, NULL,
    false, NULL,
    false, NULL, NULL, NULL, NULL, NULL,
    '1-1. パターン1（1頭3ウラ）', '1-1. Pattern 1 (1 + and-of-3)',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-q1-2-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-q1-lesson'), NULL, 2,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-1-3-stage'),
    false, NULL,
    false, NULL,
    false, NULL, NULL, NULL, NULL, NULL,
    '1-2. パターン2（1ウラ3ウラ）', '1-2. Pattern 2 (and-of-1 + and-of-3)',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-q1-3-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-q1-lesson'), NULL, 3,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-1-4-stage'),
    false, NULL,
    false, NULL,
    false, NULL, NULL, NULL, NULL, NULL,
    '1-3. パターン3（4ウラ2ウラ）', '1-3. Pattern 3 (and-of-4 + and-of-2)',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-q2-0-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-q2-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    false, NULL,
    false, NULL,
    true, 'mq-b3-q2-dialogue-v1',
    false, NULL, NULL, NULL, NULL, NULL,
    '2-0. 右手と一緒に弾く準備', '2-0. Prep for RH + LH',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-q2-1-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-q2-lesson'), NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-2-stage'),
    false, NULL,
    false, NULL,
    false, NULL, NULL, NULL, NULL, NULL,
    '2-1. 両手パターン1（1頭のみ）', '2-1. Two-hand pattern 1',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-q2-2-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-q2-lesson'), NULL, 2,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-2-prec-stage'),
    false, NULL,
    false, NULL,
    false, NULL, NULL, NULL, NULL, NULL,
    '2-2. 両手パターン1・精密', '2-2. Two-hand pattern 1 · Precision',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-q2-3-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-q2-lesson'), NULL, 3,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-4-stage'),
    false, NULL,
    false, NULL,
    false, NULL, NULL, NULL, NULL, NULL,
    '2-3. 両手パターン2（1頭3ウラ）', '2-3. Two-hand pattern 2',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-q2-4-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-q2-lesson'), NULL, 4,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b3-4-2-4-prec-stage'),
    false, NULL,
    false, NULL,
    false, NULL, NULL, NULL, NULL, NULL,
    '2-4. 両手パターン2・精密', '2-4. Two-hand pattern 2 · Precision',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q1-0-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q1-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    false, NULL,
    true, 'mq-b4-q1-osmd-v1',
    false, NULL,
    false, NULL, NULL, NULL, NULL, NULL,
    '1-1. テーマを右手だけで練習', '1-1. Theme RH only',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q2-0-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q2-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    false, NULL,
    false, NULL,
    true, 'mq-b4-q2-dialogue-v1',
    false, NULL, NULL, NULL, NULL, NULL,
    '2-0. 左手を入れる準備', '2-0. Prep to add LH',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q2-1-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q2-lesson'), NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-2-stage'),
    false, NULL,
    false, NULL,
    false, NULL, NULL, NULL, NULL, NULL,
    '2-1. テーマ＋左手（1頭のみ）', '2-1. Theme + LH (beat 1)',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q2-2-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q2-lesson'), NULL, 2,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-3-stage'),
    false, NULL,
    false, NULL,
    false, NULL, NULL, NULL, NULL, NULL,
    '2-2. テーマ＋左手・精密', '2-2. Theme + LH · Precision',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q2-3-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q2-lesson'), NULL, 3,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-4-stage'),
    false, NULL,
    false, NULL,
    false, NULL, NULL, NULL, NULL, NULL,
    '2-3. テーマ＋左手（1頭3ウラ）', '2-3. Theme + LH (1 + and-of-3)',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q2-4-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q2-lesson'), NULL, 4,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-2-5-stage'),
    false, NULL,
    false, NULL,
    false, NULL, NULL, NULL, NULL, NULL,
    '2-4. テーマ＋左手（1頭3ウラ）・精密', '2-4. Theme + LH precision',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q3-0-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q3-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    false, NULL,
    false, NULL,
    true, 'mq-b4-q3-intro-v1',
    false, NULL, NULL, NULL, NULL, NULL,
    '3-0. テーマ・アドリブ・テーマの説明', '3-0. Theme–ad-lib–theme intro',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q3-1-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q3-lesson'), NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-3-2-stage'),
    false, NULL,
    false, NULL,
    false, NULL, NULL, NULL, NULL, NULL,
    '3-1. まとめ・片手', '3-1. Summary · One hand',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q3-2-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q3-lesson'), NULL, 2,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-3-3-stage'),
    false, NULL,
    false, NULL,
    false, NULL, NULL, NULL, NULL, NULL,
    '3-2. まとめ・両手', '3-2. Summary · Two hands',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q3-3-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q3-lesson'), NULL, 3,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-5-3-3-prec-stage'),
    false, NULL,
    false, NULL,
    false, NULL, NULL, NULL, NULL, NULL,
    '3-3. まとめ・両手・精密', '3-3. Summary · Two hands · Precision',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q3-4-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000003'::uuid, 'mq-b4-q3-lesson'), NULL, 4,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    false, NULL,
    false, NULL,
    true, 'mq-b4-q3-outro-v1',
    false, NULL, NULL, NULL, NULL, NULL,
    '3-4. 次はFブルースへ', '3-4. Next: F blues',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  is_ear_training_tutorial = EXCLUDED.is_ear_training_tutorial,
  ear_training_tutorial_script_id = EXCLUDED.ear_training_tutorial_script_id,
  is_survival_tutorial = EXCLUDED.is_survival_tutorial,
  survival_tutorial_script_id = EXCLUDED.survival_tutorial_script_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

COMMIT;
