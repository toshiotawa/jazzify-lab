-- Survival Tutorial V4: 開発者検証用サンプル manifest + レッスン
-- schema 変更なし (survival_tutorial_scripts.script は jsonb、version 4 を格納)
BEGIN;

COMMENT ON COLUMN public.survival_tutorial_scripts.script IS
  'Tutorial script JSON: v1 legacy / v3 scenes / v4 manifest (MusicXML-derived)';

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (
  'developer-v4-native',
  'サバイバルチュートリアル V4（ネイティブ検証）',
  'Survival Tutorial V4 (native developer sample)',
  '{"version":4,"id":"developer_v4_native","assets":{"midi":"sampleStageV4.mid","bgm":{"url":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}},"bpm":120,"beatsPerMeasure":4,"keyFifths":0,"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenes":[{"id":"S1","start":{"measure":1,"beat":1},"end":{"measure":3,"beat":1},"bgm":{"url":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3","resetOnEnter":false},"keyFifths":0,"beatsPerMeasure":4,"bpm":120,"midi":{"startTick":0,"endTick":3840,"startSec":0,"endSec":4},"sceneType":"dialogue","lines":[{"ja":"ようこそ、サバイバルへ。","en":"","speaker":"fai","startBeat":0,"durationBeats":2},{"ja":"わしがジャ爺じゃ。","en":"","speaker":"jajii","startBeat":2,"durationBeats":2},{"ja":"まずは見て覚えよう。","en":"","speaker":"fai","startBeat":4}]},{"id":"S2","start":{"measure":3,"beat":1},"end":{"measure":5,"beat":1},"bgm":{"url":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3","resetOnEnter":true},"keyFifths":0,"beatsPerMeasure":4,"bpm":120,"midi":{"startTick":3840,"endTick":7680,"startSec":4,"endSec":8},"sceneType":"demo","chords":[{"startBeat":0,"durationBeats":2,"measureNumber":3,"chordName":"Dm7","notes":[53,57,60,76],"noteNames":["F3","A3","C4","E5"],"noteStaves":[2,2,2,1],"bass":[38],"bassNames":["D2"],"keyFifths":0},{"startBeat":2,"durationBeats":2,"measureNumber":3,"chordName":"G7","notes":[53,57,59,74],"noteNames":["F3","A3","B3","D5"],"noteStaves":[2,2,2,1],"bass":[43],"bassNames":["G2"],"keyFifths":0},{"startBeat":4,"durationBeats":4,"measureNumber":4,"chordName":"CM7","notes":[52,55,59,72],"noteNames":["E3","G3","B3","C5"],"noteStaves":[2,2,2,1],"bass":[36],"bassNames":["C2"],"keyFifths":0}],"lines":[{"ja":"Dm7、見ていてくれ。","en":"","speaker":"fai","startBeat":0,"durationBeats":2},{"ja":"次は G7 じゃ。","en":"","speaker":"jajii","startBeat":2,"durationBeats":2},{"ja":"CM7 で着地じゃ。","en":"","speaker":"fai","startBeat":4}]},{"id":"S3","start":{"measure":5,"beat":1},"end":{"measure":7,"beat":1},"bgm":{"url":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3","resetOnEnter":false},"keyFifths":0,"beatsPerMeasure":4,"bpm":120,"midi":{"startTick":7680,"endTick":11520,"startSec":8,"endSec":12},"sceneType":"play","questions":[{"startBeat":0,"durationBeats":1,"measureNumber":5,"chordName":"Dm7","notes":[74],"noteNames":["D5"],"noteStaves":[1],"bass":[38],"bassNames":["D2"],"keyFifths":0},{"startBeat":1,"durationBeats":1,"measureNumber":5,"chordName":"","notes":[77],"noteNames":["F5"],"noteStaves":[1],"bass":[],"bassNames":[],"keyFifths":0},{"startBeat":2,"durationBeats":1,"measureNumber":5,"chordName":"G7","notes":[79],"noteNames":["G5"],"noteStaves":[1],"bass":[43],"bassNames":["G2"],"keyFifths":0},{"startBeat":3,"durationBeats":1,"measureNumber":5,"chordName":"","notes":[83],"noteNames":["B5"],"noteStaves":[1],"bass":[],"bassNames":[],"keyFifths":0},{"startBeat":4,"durationBeats":4,"measureNumber":6,"chordName":"","notes":[],"bass":[],"keyFifths":0}],"lines":[{"ja":"ドから弾いてみよう。","en":"","speaker":"fai","startBeat":0,"durationBeats":2},{"ja":"ここから G7 じゃ。","en":"","speaker":"jajii","startBeat":2}]}]}'::jsonb
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-survival-tutorial-v4-native-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバルチュートリアル V4（ネイティブ）',
  'Survival tutorial V4 (native)',
  'dialogue / demo / play の V4 manifest をネイティブランタイムで検証する開発者用レッスンです。',
  'Developer lesson for native V4 runtime (dialogue, demo, play scenes).',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-survival-tutorial-v4-native-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-survival-tutorial-v4-native-lesson'),
  NULL,
  NULL,
  false,
  false,
  false,
  true,
  'developer-v4-native',
  '{"count": 1, "rank": "S"}'::jsonb,
  1,
  'サバイバルチュートリアル V4',
  'Survival Tutorial V4'
)
ON CONFLICT (id) DO UPDATE SET
  survival_tutorial_script_id = EXCLUDED.survival_tutorial_script_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
