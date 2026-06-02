-- developer-full-v1: アドリブ・ペアアドリブ・複合フレーズシーン追加
-- 開発者テストコース: 3モード単体チュートリアル課題（is_clear_required = false）

BEGIN;

UPDATE public.ear_training_tutorial_scripts
SET
  script = '{"version":1,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideLobby":true,"hideMidiToggle":true,"hidePhraseIntroQuota":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{"quiz-pool":{"stage":{"slug":"tutorial-quiz-pool","title":"チュートリアル・コードクイズ","title_en":"Tutorial chord quiz","bpm":100,"key_fifths":0,"beats_per_measure":4,"beat_type":4,"loop_measures":2,"max_loops_per_phrase":6,"count_in_beats":0,"time_limit_sec":180,"player_hp":100,"enemy_hp":10000,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"chord_quiz","quiz_duration_seconds":300,"quiz_question_order":"random","quiz_show_notation_in_battle":true,"quiz_required_correct_count":99,"show_keyboard_hints_in_battle":true},"chord_quiz_items":[{"order_index":0,"chord_name":"CM7","voicing":["C3","E3","G3","B3"],"voicing_staves":[2,2,2,2]},{"order_index":1,"chord_name":"Dm7","voicing":["D3","F3","A3","C4"],"voicing_staves":[2,2,2,1]},{"order_index":2,"chord_name":"G7","voicing":["G3","B3","D4","F4"],"voicing_staves":[2,2,1,1]}]},"self-paced-ii-vi":{"stage":{"slug":"tutorial-self-paced","title":"チュートリアル・セルフペース","title_en":"Tutorial self-paced","bpm":120,"key_fifths":0,"beats_per_measure":4,"beat_type":4,"loop_measures":4,"max_loops_per_phrase":8,"count_in_beats":0,"time_limit_sec":300,"player_hp":100,"enemy_hp":10000,"per_correct_note_damage":5,"good_completion_damage":20,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"chord_voicing","chord_voicing_self_paced":true,"show_keyboard_hints_in_battle":true},"phrases":[{"order_index":0,"title":"II-V-I","loop_duration_sec":8,"chords":[{"order_index":0,"chord_name":"Dm7","measure_number":1,"beat_offset":1,"duration_beats":4,"start_time_sec":0,"end_time_sec":2,"voicing":["D3","F3","A3","C4"],"voicing_staves":[2,2,2,1],"quote":{"ja":"Dm7（II）。このヴォイシングをドラムに合わせて。","en":"Dm7 (II). Play this voicing with the drums."}},{"order_index":1,"chord_name":"G7","measure_number":2,"beat_offset":1,"duration_beats":4,"start_time_sec":2,"end_time_sec":4,"voicing":["G3","B3","D4","F4"],"voicing_staves":[2,2,1,1],"quote":{"ja":"G7（V）。次はこちらです。","en":"G7 (V). Next chord."}},{"order_index":2,"chord_name":"CM7","measure_number":3,"beat_offset":1,"duration_beats":4,"start_time_sec":4,"end_time_sec":8,"voicing":["C3","E3","G3","B3"],"voicing_staves":[2,2,2,2],"quote":{"ja":"CM7（I）。聴き分けて演奏しよう。","en":"CM7 (I). Hear the voicing and play."}}]}]},"osmd-lesson7":{"stage":{"slug":"tutorial-osmd-l7","title":"チュートリアル・OSMD","title_en":"Tutorial OSMD","bpm":120,"key_fifths":0,"beats_per_measure":4,"beat_type":4,"loop_measures":4,"max_loops_per_phrase":4,"count_in_beats":4,"time_limit_sec":300,"player_hp":100,"enemy_hp":10000,"per_correct_note_damage":10,"good_completion_damage":30,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"chord_osmd","show_keyboard_hints_in_battle":true},"phrases":[{"order_index":0,"title":"Finale 全音符","music_xml_url":"https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-lesson7-whole.musicxml","audio_url":"https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-phrase-01.mp3","loop_duration_sec":8,"audio_duration_sec":8,"note_count":4,"chords":[{"order_index":0,"chord_name":"Dm7","measure_number":1,"beat_offset":1,"duration_beats":4,"start_time_sec":0,"end_time_sec":2,"voicing":["D4"],"voicing_staves":[1]},{"order_index":1,"chord_name":"G7","measure_number":2,"beat_offset":1,"duration_beats":4,"start_time_sec":2,"end_time_sec":4,"voicing":["G4"],"voicing_staves":[1]},{"order_index":2,"chord_name":"CM7","measure_number":3,"beat_offset":1,"duration_beats":4,"start_time_sec":4,"end_time_sec":6,"voicing":["C4"],"voicing_staves":[1]},{"order_index":3,"chord_name":"A7","measure_number":4,"beat_offset":1,"duration_beats":4,"start_time_sec":6,"end_time_sec":8,"voicing":["A4"],"voicing_staves":[1]}]}]},"tutorial-adlib":{"stage":{"slug":"tutorial-adlib","title":"チュートリアル・アドリブ","title_en":"Tutorial adlib","bpm":100,"key_fifths":0,"beats_per_measure":4,"beat_type":4,"loop_measures":4,"max_loops_per_phrase":4,"count_in_beats":4,"time_limit_sec":300,"player_hp":100,"enemy_hp":10000,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"adlib","show_keyboard_hints_in_battle":true},"phrases":[{"order_index":0,"title":"Adlib loop","audio_url":"https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3","loop_duration_sec":4,"audio_duration_sec":4,"note_count":0,"chords":[{"order_index":0,"chord_name":"Dm7","measure_number":1,"duration_beats":4,"voicing":["D3","F3","A3","C4"],"voicing_staves":[2,2,2,1],"quote":{"ja":"1 小節目：弾いてみよう。","en":"Measure 1: try playing."}},{"order_index":1,"chord_name":"—","measure_number":2,"duration_beats":4,"input_disabled":true,"voicing":[],"voicing_staves":[],"quote":{"ja":"2 小節目：聴くだけ。","en":"Measure 2: listen only."}},{"order_index":2,"chord_name":"G7","measure_number":3,"duration_beats":4,"voicing":["G3","B3","D4","F4"],"voicing_staves":[2,2,1,1]},{"order_index":3,"chord_name":"CM7","measure_number":4,"duration_beats":4,"voicing":["C3","E3","G3","B3"],"voicing_staves":[2,2,2,2]}]}]},"tutorial-pair-adlib":{"stage":{"slug":"tutorial-pair-adlib","title":"チュートリアル・ペアアドリブ","title_en":"Tutorial phrase-pair adlib","bpm":100,"key_fifths":0,"beats_per_measure":4,"beat_type":4,"loop_measures":4,"max_loops_per_phrase":4,"count_in_beats":4,"time_limit_sec":300,"player_hp":100,"enemy_hp":10000,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"phrase_pair_adlib","show_keyboard_hints_in_battle":true},"phrase_pair_adlib":{"bgm_url":"https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3","key_fifths":0,"loop_duration_sec":4,"steps":[{"order_index":0,"chord_name":"Dm7","pattern_group_key":"cm7","measure_number":1,"start_time_sec":0,"end_time_sec":1,"quote":{"ja":"1 小節目","en":"Measure 1"}},{"order_index":1,"chord_name":"—","pattern_group_key":"cm7","measure_number":2,"start_time_sec":1,"end_time_sec":2,"input_disabled":true,"quote":{"ja":"2 小節目：聴くだけ","en":"Measure 2: listen"}},{"order_index":2,"chord_name":"G7","pattern_group_key":"cm7","measure_number":3,"start_time_sec":2,"end_time_sec":3},{"order_index":3,"chord_name":"CM7","pattern_group_key":"cm7","measure_number":4,"start_time_sec":3,"end_time_sec":4}],"patterns":[{"group_key":"cm7","label":"A","pcs":[0,2],"family_id":"CM7-A","carry_tail_length":0,"priority":0},{"group_key":"cm7","label":"B","pcs":[4,7],"family_id":"CM7-B","carry_tail_length":0,"priority":0}]}},"tutorial-composite":{"stage":{"slug":"tutorial-composite","title":"チュートリアル・複合フレーズ","title_en":"Tutorial composite phrase","bpm":120,"key_fifths":0,"beats_per_measure":4,"beat_type":4,"loop_measures":2,"max_loops_per_phrase":8,"count_in_beats":0,"time_limit_sec":300,"player_hp":100,"enemy_hp":10000,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"chord_voicing","chord_voicing_composite_phrase":true,"show_keyboard_hints_in_battle":true},"composite_config":{"bgm_url":"https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3","key_fifths":0,"source_phrase_order_indices":[0,1]},"phrases":[{"order_index":0,"title":"Phrase A","loop_duration_sec":4,"chords":[{"order_index":0,"chord_name":"Dm7","measure_number":1,"duration_beats":4,"voicing":["D3","F3","A3","C4"],"voicing_staves":[2,2,2,1]},{"order_index":1,"chord_name":"G7","measure_number":2,"duration_beats":4,"voicing":["G3","B3","D4","F4"],"voicing_staves":[2,2,1,1]}]},{"order_index":1,"title":"Phrase B","loop_duration_sec":4,"chords":[{"order_index":0,"chord_name":"CM7","measure_number":1,"duration_beats":4,"voicing":["C3","E3","G3","B3"],"voicing_staves":[2,2,2,2]},{"order_index":1,"chord_name":"Am7","measure_number":2,"duration_beats":4,"voicing":["A3","C4","E4","G4"],"voicing_staves":[2,1,1,1]}]}]}},"scenes":[{"type":"dialogue_only","lines":[{"speaker":"player","ja":"耳コピバトル・チュートリアルへようこそ。","en":"Welcome to the ear training battle tutorial."},{"speaker":"partner","ja":"ワシが付いとるから安心じゃ！","en":"I''ve got your back!"},{"speaker":"player","ja":"まずはセリフだけのシーンです。","en":"This is a dialogue-only scene first."},{"speaker":"partner","ja":"交互にセリフが出るようになったで。","en":"Lines now alternate between us."},{"speaker":"player","ja":"ドラムループが流れています。","en":"A drum loop is playing."}],"lineIntervalSeconds":4},{"type":"chord_quiz","contentRef":"quiz-pool","order":"progression","questionCount":2,"answerTimeoutSeconds":8,"dialogue":{"onQuestion":{"ja":"順番に出題します。8秒以内に演奏！","en":"Questions in order. Play within 8 seconds!"},"onCorrect":{"ja":"正解！","en":"Correct!"},"onAutoAnswer":{"ja":"時間切れ…自動回答です。","en":"Time up — auto answer."}}},{"type":"chord_quiz","contentRef":"quiz-pool","order":"random","questionCount":1,"answerTimeoutSeconds":8,"dialogue":{"onQuestion":{"ja":"ランダム出題です。","en":"Random question."},"onCorrect":{"ja":"ナイス！","en":"Nice!"},"onAutoAnswer":{"ja":"自動回答で次へ。","en":"Auto answer — moving on."}}},{"type":"chord_voicing_self_paced","contentRef":"self-paced-ii-vi","requiredSuccessfulLoops":2,"dialogue":{}},{"type":"chord_osmd","contentRef":"osmd-lesson7","requiredLoops":1,"timedLines":[{"phase":"count_in","loop":0,"beat":1,"text":{"ja":"セルフ：カウントイン。","en":"Self: count-in."}},{"at":{"loop":0,"measure":2,"beat":1},"text":{"ja":"セルフ：2 小節目で演奏。","en":"Self: play at measure 2."}}]},{"type":"adlib","contentRef":"tutorial-adlib","requiredMeasures":4,"timedLines":[{"at":{"loop":0,"measure":1,"beat":1},"text":{"ja":"アドリブ：1 小節目","en":"Adlib: measure 1"}},{"at":{"loop":0,"measure":2,"beat":1},"text":{"ja":"アドリブ：聴くだけ","en":"Adlib: listen"}}]},{"type":"phrase_pair_adlib","contentRef":"tutorial-pair-adlib","requiredMeasures":4,"timedLines":[{"at":{"loop":0,"measure":1,"beat":1},"text":{"ja":"ペア：1 小節目","en":"Pair: measure 1"}}]},{"type":"composite","contentRef":"tutorial-composite","requiredCompletedPhrases":2,"timedLines":[{"at":{"loop":0,"measure":1,"beat":1},"text":{"ja":"複合：1 小節目","en":"Composite: m1"}},{"at":{"loop":0,"measure":2,"beat":1},"text":{"ja":"複合：2 小節目","en":"Composite: m2"}}]},{"type":"dialogue_only","lines":[{"speaker":"player","ja":"お疲れさま。最後まで見るとクリアです。","en":"Well done. Finish to clear the lesson."},{"speaker":"partner","ja":"よく頑張ったのう。","en":"You did great out there!"}],"lineIntervalSeconds":4},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb,
  title = '耳コピチュートリアル（全分岐テスト）',
  title_en = 'Ear training tutorial (full branch test)',
  updated_at = now()
WHERE id = 'developer-full-v1';


INSERT INTO public.ear_training_tutorial_scripts (id, title, title_en, script)
VALUES (
  'developer-tutorial-adlib-v1',
  'チュートリアル・アドリブ（単体）',
  'Tutorial adlib (standalone)',
  '{"version":1,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideLobby":true,"hideMidiToggle":true,"hidePhraseIntroQuota":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{"tutorial-adlib":{"stage":{"slug":"tutorial-adlib","title":"チュートリアル・アドリブ","title_en":"Tutorial adlib","bpm":100,"key_fifths":0,"beats_per_measure":4,"beat_type":4,"loop_measures":4,"max_loops_per_phrase":4,"count_in_beats":4,"time_limit_sec":300,"player_hp":100,"enemy_hp":10000,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"adlib","show_keyboard_hints_in_battle":true},"phrases":[{"order_index":0,"title":"Adlib loop","audio_url":"https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3","loop_duration_sec":4,"audio_duration_sec":4,"note_count":0,"chords":[{"order_index":0,"chord_name":"Dm7","measure_number":1,"duration_beats":4,"voicing":["D3","F3","A3","C4"],"voicing_staves":[2,2,2,1],"quote":{"ja":"1 小節目：弾いてみよう。","en":"Measure 1: try playing."}},{"order_index":1,"chord_name":"—","measure_number":2,"duration_beats":4,"input_disabled":true,"voicing":[],"voicing_staves":[],"quote":{"ja":"2 小節目：聴くだけ。","en":"Measure 2: listen only."}},{"order_index":2,"chord_name":"G7","measure_number":3,"duration_beats":4,"voicing":["G3","B3","D4","F4"],"voicing_staves":[2,2,1,1]},{"order_index":3,"chord_name":"CM7","measure_number":4,"duration_beats":4,"voicing":["C3","E3","G3","B3"],"voicing_staves":[2,2,2,2]}]}]}},"scenes":[{"type":"dialogue_only","lines":[{"speaker":"player","ja":"開発用・adlib チュートリアルです。","en":"Developer adlib tutorial."},{"speaker":"partner","ja":"クリア必須ではない課題として試せます。","en":"This task is optional (not clear-required)."}],"lineIntervalSeconds":3},{"type":"adlib","contentRef":"tutorial-adlib","requiredMeasures":4,"timedLines":[{"at":{"loop":0,"measure":1,"beat":1},"text":{"ja":"アドリブ：1 小節目","en":"Adlib: measure 1"}},{"at":{"loop":0,"measure":2,"beat":1},"text":{"ja":"アドリブ：聴くだけ","en":"Adlib: listen"}}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.ear_training_tutorial_scripts (id, title, title_en, script)
VALUES (
  'developer-tutorial-pair-adlib-v1',
  'チュートリアル・ペアアドリブ（単体）',
  'Tutorial phrase-pair adlib (standalone)',
  '{"version":1,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideLobby":true,"hideMidiToggle":true,"hidePhraseIntroQuota":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{"tutorial-pair-adlib":{"stage":{"slug":"tutorial-pair-adlib","title":"チュートリアル・ペアアドリブ","title_en":"Tutorial phrase-pair adlib","bpm":100,"key_fifths":0,"beats_per_measure":4,"beat_type":4,"loop_measures":4,"max_loops_per_phrase":4,"count_in_beats":4,"time_limit_sec":300,"player_hp":100,"enemy_hp":10000,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"phrase_pair_adlib","show_keyboard_hints_in_battle":true},"phrase_pair_adlib":{"bgm_url":"https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3","key_fifths":0,"loop_duration_sec":4,"steps":[{"order_index":0,"chord_name":"Dm7","pattern_group_key":"cm7","measure_number":1,"start_time_sec":0,"end_time_sec":1,"quote":{"ja":"1 小節目","en":"Measure 1"}},{"order_index":1,"chord_name":"—","pattern_group_key":"cm7","measure_number":2,"start_time_sec":1,"end_time_sec":2,"input_disabled":true,"quote":{"ja":"2 小節目：聴くだけ","en":"Measure 2: listen"}},{"order_index":2,"chord_name":"G7","pattern_group_key":"cm7","measure_number":3,"start_time_sec":2,"end_time_sec":3},{"order_index":3,"chord_name":"CM7","pattern_group_key":"cm7","measure_number":4,"start_time_sec":3,"end_time_sec":4}],"patterns":[{"group_key":"cm7","label":"A","pcs":[0,2],"family_id":"CM7-A","carry_tail_length":0,"priority":0},{"group_key":"cm7","label":"B","pcs":[4,7],"family_id":"CM7-B","carry_tail_length":0,"priority":0}]}}},"scenes":[{"type":"dialogue_only","lines":[{"speaker":"player","ja":"開発用・phrase_pair_adlib チュートリアルです。","en":"Developer phrase_pair_adlib tutorial."},{"speaker":"partner","ja":"クリア必須ではない課題として試せます。","en":"This task is optional (not clear-required)."}],"lineIntervalSeconds":3},{"type":"phrase_pair_adlib","contentRef":"tutorial-pair-adlib","requiredMeasures":4,"timedLines":[{"at":{"loop":0,"measure":1,"beat":1},"text":{"ja":"ペア：1 小節目","en":"Pair: measure 1"}}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.ear_training_tutorial_scripts (id, title, title_en, script)
VALUES (
  'developer-tutorial-composite-v1',
  'チュートリアル・複合フレーズ（単体）',
  'Tutorial composite phrase (standalone)',
  '{"version":1,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideLobby":true,"hideMidiToggle":true,"hidePhraseIntroQuota":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{"tutorial-composite":{"stage":{"slug":"tutorial-composite","title":"チュートリアル・複合フレーズ","title_en":"Tutorial composite phrase","bpm":120,"key_fifths":0,"beats_per_measure":4,"beat_type":4,"loop_measures":2,"max_loops_per_phrase":8,"count_in_beats":0,"time_limit_sec":300,"player_hp":100,"enemy_hp":10000,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"chord_voicing","chord_voicing_composite_phrase":true,"show_keyboard_hints_in_battle":true},"composite_config":{"bgm_url":"https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3","key_fifths":0,"source_phrase_order_indices":[0,1]},"phrases":[{"order_index":0,"title":"Phrase A","loop_duration_sec":4,"chords":[{"order_index":0,"chord_name":"Dm7","measure_number":1,"duration_beats":4,"voicing":["D3","F3","A3","C4"],"voicing_staves":[2,2,2,1]},{"order_index":1,"chord_name":"G7","measure_number":2,"duration_beats":4,"voicing":["G3","B3","D4","F4"],"voicing_staves":[2,2,1,1]}]},{"order_index":1,"title":"Phrase B","loop_duration_sec":4,"chords":[{"order_index":0,"chord_name":"CM7","measure_number":1,"duration_beats":4,"voicing":["C3","E3","G3","B3"],"voicing_staves":[2,2,2,2]},{"order_index":1,"chord_name":"Am7","measure_number":2,"duration_beats":4,"voicing":["A3","C4","E4","G4"],"voicing_staves":[2,1,1,1]}]}]}},"scenes":[{"type":"dialogue_only","lines":[{"speaker":"player","ja":"開発用・composite チュートリアルです。","en":"Developer composite tutorial."},{"speaker":"partner","ja":"クリア必須ではない課題として試せます。","en":"This task is optional (not clear-required)."}],"lineIntervalSeconds":3},{"type":"composite","contentRef":"tutorial-composite","requiredCompletedPhrases":2,"timedLines":[{"at":{"loop":0,"measure":1,"beat":1},"text":{"ja":"複合：1 小節目","en":"Composite: m1"}},{"at":{"loop":0,"measure":2,"beat":1},"text":{"ja":"複合：2 小節目","en":"Composite: m2"}}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id,
  lesson_id,
  song_id,
  fantasy_stage_id,
  is_fantasy,
  is_survival,
  is_ear_training,
  is_ear_training_tutorial,
  ear_training_tutorial_script_id,
  clear_conditions,
  order_index,
  title,
  title_en,
  is_clear_required
) VALUES
  (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-tutorial-adlib-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-ear-training-tutorial-lesson'),
  NULL,
  NULL,
  false,
  false,
  false,
  true,
  'developer-tutorial-adlib-v1',
  '{"count": 1, "rank": "S"}'::jsonb,
  (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.lesson_songs WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-ear-training-tutorial-lesson')),
  'チュートリアル・アドリブ',
  'Tutorial adlib',
  false
),
  (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-tutorial-pair-adlib-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-ear-training-tutorial-lesson'),
  NULL,
  NULL,
  false,
  false,
  false,
  true,
  'developer-tutorial-pair-adlib-v1',
  '{"count": 1, "rank": "S"}'::jsonb,
  (SELECT COALESCE(MAX(order_index), 0) + 2 FROM public.lesson_songs WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-ear-training-tutorial-lesson')),
  'チュートリアル・ペアアドリブ',
  'Tutorial phrase-pair adlib',
  false
),
  (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-tutorial-composite-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-ear-training-tutorial-lesson'),
  NULL,
  NULL,
  false,
  false,
  false,
  true,
  'developer-tutorial-composite-v1',
  '{"count": 1, "rank": "S"}'::jsonb,
  (SELECT COALESCE(MAX(order_index), 0) + 3 FROM public.lesson_songs WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-ear-training-tutorial-lesson')),
  'チュートリアル・複合フレーズ',
  'Tutorial composite phrase',
  false
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training_tutorial = EXCLUDED.is_ear_training_tutorial,
  ear_training_tutorial_script_id = EXCLUDED.ear_training_tutorial_script_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

COMMIT;
