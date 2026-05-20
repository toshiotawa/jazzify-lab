BEGIN;

-- サバイバルチュートリアル v3 開発者用台本 + 開発者コースへレッスン追加（onboarding-v1 は変更しない）

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (
  'developer-full-v3',
  'サバイバルチュートリアル（全分岐 v3）',
  'Survival Tutorial (developer full v3)',
$BODY$
{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{"prog-test":{"stage":{"name":"v3・プログレッション","nameEn":"v3 progression","stageType":"progression","mapCategory":"lesson","chordDisplayName":"II-V（テスト）","chordDisplayNameEn":"II–V (test)","lessonOnly":true},"chordProgression":[{"name":"Dm7","voicing":[53,57,60,64],"voicingNames":["F3","A3","C4","E4"],"keyFifths":0},{"name":"G7","voicing":[53,57,59,64],"voicingNames":["F3","A3","B3","E4"],"keyFifths":0,"voicing_staves":[2,2,1,1]}]},"rand-test":{"stage":{"name":"v3・ランダム","nameEn":"v3 random","stageType":"random","mapCategory":"lesson","chordDisplayName":"ランダム検証","chordDisplayNameEn":"Random QA","lessonOnly":true},"randomChordPoolEasy":[{"name":"Dm7","voicing":[53,57,60,64],"voicingNames":["F3","A3","C4","E4"],"keyFifths":0}],"randomChordPoolHard":[{"name":"CM7(9)","voicing":[52,57,59,62,66],"voicingNames":["E3","A3","B3","D4","F#4"],"keyFifths":0}]},"phrase-ii-v-i":{"stage":{"name":"v3・フレーズ","nameEn":"v3 phrase","stageType":"progression","mapCategory":"phrases","chordDisplayName":"II-V-I","chordDisplayNameEn":"II-V-I","lessonOnly":true},"phrases":[{"order_index":0,"title":"II-V-I（1小節×3）","title_en":"II-V-I (3 measures)","audio_url":"https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-phrase-01.mp3","loop_duration_sec":8,"key_fifths":0,"chords":[{"name":"Dm7","measure_number":1,"voicing":[53,57,60,64],"voicingNames":["F3","A3","C4","E4"],"voicing_staves":[2,2,2,1],"keyFifths":0,"quote":{"ja":"II（Dm7）。ヴォイシングを順番に。","en":"Dm7 — play voicing notes in order."}},{"name":"G7","measure_number":2,"voicing":[53,57,59,64],"voicingNames":["F3","A3","B3","E4"],"voicing_staves":[2,2,2,1],"keyFifths":0},{"name":"CM7","measure_number":3,"voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"keyFifths":0,"quote":{"ja":"I（CM7）。最後まで！","en":"CM7 — finish!"}}]}]}},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"ja":"サバイバルチュートリアル v3（開発者向け）。","en":"Survival tutorial v3 (developer)."},{"ja":"セリフのみ・プログレッション・ランダム・フレーズを順に試します。","en":"We will try dialogue, progression, random, and phrase."}]},{"type":"progression_battle","contentRef":"prog-test","loopCount":2,"introDelaySeconds":4,"dialogue":{"intro":{"ja":"プログレッション。タップでスキップできます。","en":"Progression. Tap to skip intro."},"onReveal":{"ja":"このコードを演奏！","en":"Play this chord!"},"onCorrectRemaining":{"ja":"OK、あと{{remaining}}問。","en":"OK, {{remaining}} left."}}},{"type":"random_battle","contentRef":"rand-test","questionCount":1,"hardQuestions":true,"introDelaySeconds":4,"dialogue":{"intro":{"ja":"難問ランダム（テスト）。","en":"Hard random (test)."},"onReveal":{"ja":"難問だ。演奏！","en":"Hard one — play!"},"onCorrectRemaining":{"ja":"OK、あと{{remaining}}問。","en":"OK, {{remaining}} left."}}},{"type":"phrase_battle","contentRef":"phrase-ii-v-i","requiredLoops":1,"introDelaySeconds":5,"dialogue":{"intro":{"ja":"フレーズモード（フレーズBGM）。","en":"Phrase mode (phrase BGM)."},"onReveal":{"ja":"1小節ずつ入力。","en":"Enter one measure at a time."},"onCorrectRemaining":{"ja":"OK、あと{{remaining}}ループ。","en":"OK, {{remaining}} loops left."}}},{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"ja":"以上です。「完了」をタップでクリアになります。","en":"Done. Tap complete to finish."}]},{"type":"finish"}],"finish":{"showCta":true}}
$BODY$::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.lessons (
  id,
  course_id,
  title,
  title_en,
  description,
  description_en,
  premium_only,
  order_index,
  block_number,
  block_name,
  block_name_en,
  nav_links,
  assignment_description
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-survival-tutorial-full-lesson-v3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバルチュートリアル（全分岐 v3）',
  'Survival tutorial (developer full v3)',
  'セリフのみ・プログレッション・ランダム・フレーズの v3 開発用チュートリアルです。',
  'Developer v3 survival tutorial: dialogue, progression, random, and phrase modes.',
  false,
  (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.lessons
   WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')),
  1,
  'テスト',
  'Test',
  '["lesson"]'::jsonb,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lesson_songs (
  id,
  lesson_id,
  song_id,
  fantasy_stage_id,
  is_fantasy,
  is_survival,
  is_ear_training,
  is_survival_tutorial,
  survival_tutorial_script_id,
  clear_conditions,
  order_index,
  title,
  title_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-survival-tutorial-full-lsong-v3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-survival-tutorial-full-lesson-v3'),
  NULL,
  NULL,
  false,
  false,
  false,
  true,
  'developer-full-v3',
  '{"count": 1, "rank": "S"}'::jsonb,
  0,
  'サバイバル v3（全分岐）',
  'Survival v3 full'
)
ON CONFLICT (id) DO UPDATE SET
  is_survival_tutorial = EXCLUDED.is_survival_tutorial,
  survival_tutorial_script_id = EXCLUDED.survival_tutorial_script_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
