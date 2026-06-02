BEGIN;

-- サバイバルチュートリアル v3 デモプレイ検証台本（160BPM drums160）

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (
  'developer-demo-play-v3',
  'サバイバルチュートリアル（デモプレイ v3）',
  'Survival Tutorial (demo play v3)',
$BODY$
{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{},"scenes":[{"type":"demo_play","bpm":160,"beatsPerMeasure":4,"keyFifths":0,"introLines":[{"ja":"デモプレイを見てみよう。","en":"Let us watch a demo play.","speaker":"fai"},{"ja":"BGMに合わせて和音が進む。お前は見るだけじゃ。","en":"Chords move with the BGM. You just watch.","speaker":"jajii"}],"chords":[{"startBeat":0,"durationBeats":2,"chordName":"Dm7","voicing":[53,57,60,64],"voicingNames":["F3","A3","C4","E4"],"voicing_staves":[2,2,2,2],"measureNumber":1,"keyFifths":0},{"startBeat":4,"durationBeats":2,"chordName":"G7","voicing":[53,57,59,64],"voicingNames":["F3","A3","B3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":2,"keyFifths":0},{"startBeat":8,"durationBeats":2,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":3,"keyFifths":0},{"startBeat":12,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":4,"keyFifths":0},{"startBeat":12.5,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":4,"keyFifths":0},{"startBeat":13,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":4,"keyFifths":0},{"startBeat":13.5,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":4,"keyFifths":0},{"startBeat":14,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":4,"keyFifths":0},{"startBeat":14.5,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":4,"keyFifths":0},{"startBeat":15,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":4,"keyFifths":0},{"startBeat":15.5,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":4,"keyFifths":0},{"startBeat":16,"durationBeats":0.5,"chordName":"G7","voicing":[53,57,59,64],"voicingNames":["F3","A3","B3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":5,"keyFifths":0},{"startBeat":16.5,"durationBeats":0.5,"chordName":"G7","voicing":[53,57,59,64],"voicingNames":["F3","A3","B3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":5,"keyFifths":0},{"startBeat":17,"durationBeats":0.5,"chordName":"G7","voicing":[53,57,59,64],"voicingNames":["F3","A3","B3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":5,"keyFifths":0},{"startBeat":17.5,"durationBeats":0.5,"chordName":"G7","voicing":[53,57,59,64],"voicingNames":["F3","A3","B3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":5,"keyFifths":0},{"startBeat":18,"durationBeats":0.5,"chordName":"G7","voicing":[53,57,59,64],"voicingNames":["F3","A3","B3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":5,"keyFifths":0},{"startBeat":18.5,"durationBeats":0.5,"chordName":"G7","voicing":[53,57,59,64],"voicingNames":["F3","A3","B3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":5,"keyFifths":0},{"startBeat":19,"durationBeats":0.5,"chordName":"G7","voicing":[53,57,59,64],"voicingNames":["F3","A3","B3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":5,"keyFifths":0},{"startBeat":19.5,"durationBeats":0.5,"chordName":"G7","voicing":[53,57,59,64],"voicingNames":["F3","A3","B3","E4"],"voicing_staves":[2,2,2,1],"measureNumber":5,"keyFifths":0},{"startBeat":20,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":6,"keyFifths":0},{"startBeat":20.5,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":6,"keyFifths":0},{"startBeat":21,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":6,"keyFifths":0},{"startBeat":21.5,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":6,"keyFifths":0},{"startBeat":22,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":6,"keyFifths":0},{"startBeat":22.5,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":6,"keyFifths":0},{"startBeat":23,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":6,"keyFifths":0},{"startBeat":23.5,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":6,"keyFifths":0},{"startBeat":24,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":7,"keyFifths":0},{"startBeat":24.5,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":7,"keyFifths":0},{"startBeat":25,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":7,"keyFifths":0},{"startBeat":25.5,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":7,"keyFifths":0},{"startBeat":26,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":7,"keyFifths":0},{"startBeat":26.5,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":7,"keyFifths":0},{"startBeat":27,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":7,"keyFifths":0},{"startBeat":27.5,"durationBeats":0.5,"chordName":"CM7","voicing":[52,55,59,62],"voicingNames":["E3","G3","B3","D4"],"voicing_staves":[2,2,2,2],"measureNumber":7,"keyFifths":0}],"lines":[{"ja":"Dm7、2拍。","en":"Dm7, two beats.","speaker":"fai","startBeat":0,"durationBeats":2},{"ja":"3拍目はジャ爺の番じゃ。","en":"Third beat is my line.","speaker":"jajii","startBeat":2,"durationBeats":2},{"ja":"G7、2拍。","en":"G7, two beats.","speaker":"fai","startBeat":4,"durationBeats":2},{"ja":"続けて見せてやる。","en":"Keep watching.","speaker":"jajii","startBeat":6,"durationBeats":2},{"ja":"CM7、2拍。","en":"CM7, two beats.","speaker":"fai","startBeat":8,"durationBeats":2},{"ja":"ここから速くなるぞ。","en":"It speeds up here.","speaker":"jajii","startBeat":10,"durationBeats":2},{"ja":"CM7、0.5拍刻み。","en":"CM7 in half-beat steps.","speaker":"fai","startBeat":12,"durationBeats":2},{"ja":"リズムに乗れ。","en":"Ride the rhythm.","speaker":"jajii","startBeat":14,"durationBeats":2},{"ja":"G7、0.5拍刻み。","en":"G7 in half-beat steps.","speaker":"fai","startBeat":16,"durationBeats":2},{"ja":"まだまだ続く。","en":"Still going.","speaker":"jajii","startBeat":18,"durationBeats":2},{"ja":"CM7、0.5拍刻み。","en":"CM7 in half-beat steps.","speaker":"fai","startBeat":20,"durationBeats":2},{"ja":"集中して見るんじゃ。","en":"Watch closely.","speaker":"jajii","startBeat":22,"durationBeats":2},{"ja":"最後のCM7。","en":"Final CM7.","speaker":"fai","startBeat":24,"durationBeats":2},{"ja":"デモはここまでじゃ。","en":"Demo ends here.","speaker":"jajii","startBeat":26,"durationBeats":2}],"endHoldBeats":4},{"type":"finish"}],"finish":{"showCta":true}}
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-survival-tutorial-demo-play-lesson-v3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバルチュートリアル（デモプレイ v3）',
  'Survival tutorial (demo play v3)',
  '160BPM ドラムループに同期するデモプレイ検証用 v3 チュートリアルです。',
  'Developer v3 survival tutorial for beat-synced demo play at 160 BPM.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-survival-tutorial-demo-play-lsong-v3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-survival-tutorial-demo-play-lesson-v3'),
  NULL,
  NULL,
  false,
  false,
  false,
  true,
  'developer-demo-play-v3',
  '{"count": 1, "rank": "S"}'::jsonb,
  0,
  'サバイバル v3（デモプレイ）',
  'Survival v3 demo play'
)
ON CONFLICT (id) DO UPDATE SET
  is_survival_tutorial = EXCLUDED.is_survival_tutorial,
  survival_tutorial_script_id = EXCLUDED.survival_tutorial_script_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
