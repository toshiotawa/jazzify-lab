-- Survival Tutorial V4: 開発者テストコース — ロール和音（1|2段またがり）サンプル
BEGIN;

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script, is_active) VALUES (
  'developer-v4-roll-grand-staff',
  'サバイバルチュートリアル V4（ロール和音）',
  'Survival Tutorial V4 (roll voicing demo)',
  '{"version":4,"id":"developer_v4_roll_grand_staff","assets":{"bgm":{"url":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}},"bpm":120,"beatsPerMeasure":4,"keyFifths":0,"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenes":[{"id":"S1","start":{"measure":1,"beat":1},"end":{"measure":2,"beat":1},"bgm":{"url":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3","resetOnEnter":false},"keyFifths":0,"beatsPerMeasure":4,"bpm":120,"midi":{"startTick":0,"endTick":1920,"startSec":0,"endSec":2},"sceneType":"dialogue","lines":[]},{"id":"S2","start":{"measure":2,"beat":1},"end":{"measure":3,"beat":1},"bgm":{"url":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3","resetOnEnter":true},"keyFifths":0,"beatsPerMeasure":4,"bpm":120,"midi":{"startTick":1920,"endTick":3840,"startSec":2,"endSec":4},"sceneType":"demo","chords":[{"startBeat":0,"durationBeats":4,"measureNumber":2,"chordName":"Dm7","notes":[50,53,57,74],"noteNames":["D3","F3","A3","D5"],"noteStaves":[2,2,2,1],"bass":[38],"bassNames":["D2"],"keyFifths":0,"rollSteps":[{"startBeat":0,"newVoicing":[50],"voicing":[50],"voicingNames":["D3"],"voicing_staves":[2],"newBass":[38],"bass":[38]},{"startBeat":1,"newVoicing":[53],"voicing":[50,53],"voicingNames":["D3","F3"],"voicing_staves":[2,2],"bass":[38]},{"startBeat":2,"newVoicing":[57],"voicing":[50,53,57],"voicingNames":["D3","F3","A3"],"voicing_staves":[2,2,2],"bass":[38]},{"startBeat":3,"newVoicing":[74],"voicing":[50,53,57,74],"voicingNames":["D3","F3","A3","D5"],"voicing_staves":[2,2,2,1],"bass":[38]}]}],"lines":[{"ja":"レ、根音じゃ。","en":"","speaker":"fai","startBeat":0,"durationBeats":1},{"ja":"ファが加わる。","en":"","speaker":"jajii","startBeat":1,"durationBeats":1},{"ja":"ラも聞こえる。","en":"","speaker":"fai","startBeat":2,"durationBeats":1},{"ja":"高音レで Dm7 完成じゃ。","en":"","speaker":"jajii","startBeat":3}]},{"id":"S3","start":{"measure":3,"beat":1},"end":{"measure":4,"beat":1},"bgm":{"url":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3","resetOnEnter":false},"keyFifths":0,"beatsPerMeasure":4,"bpm":120,"midi":{"startTick":3840,"endTick":5760,"startSec":4,"endSec":6},"sceneType":"play","questions":[{"startBeat":0,"durationBeats":4,"measureNumber":3,"chordName":"","notes":[],"bass":[],"keyFifths":0}],"lines":[]}]}'::jsonb,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  is_active = EXCLUDED.is_active,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-survival-tutorial-v4-roll-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバルチュートリアル V4（ロール和音）',
  'Survival Tutorial V4 (roll voicing)',
  'MusicXML タイ表記から生成した demo ロール和音（1|2段またがり）を Web/iOS で検証する開発者用レッスンです。',
  'Developer lesson for roll voicing demo (grand staff tie notation) on Web and iOS.',
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
  premium_only = EXCLUDED.premium_only,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  nav_links = EXCLUDED.nav_links,
  updated_at = now();

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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-survival-tutorial-v4-roll-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-survival-tutorial-v4-roll-lesson'),
  NULL,
  NULL,
  false,
  false,
  false,
  true,
  'developer-v4-roll-grand-staff',
  '{"count": 1, "rank": "S"}'::jsonb,
  1,
  'ロール和音デモ',
  'Roll voicing demo'
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_survival_tutorial = EXCLUDED.is_survival_tutorial,
  survival_tutorial_script_id = EXCLUDED.survival_tutorial_script_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
