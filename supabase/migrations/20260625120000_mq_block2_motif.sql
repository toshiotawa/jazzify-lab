-- メインクエスト Block2: Cブルース・モチーフでアドリブ（第2章）
-- 生成: node scripts/generate-mq-block2-motif-migration.mjs
-- 事前: node scripts/prepare-mq-b2-assets.mjs && node scripts/upload-sozai-main-quest-block2-r2.mjs
BEGIN;


INSERT INTO public.ear_training_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b2-q1-osmd-v1',
  'MQ B2: ド・ミ♭・ファ OSMD',
  'MQ B2: C Eb F OSMD',
  '{"version":1,"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideLobby":true,"hideMidiToggle":true,"hidePhraseIntroQuota":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{"mq-b2-q1-osmd":{"stage":{"slug":"mq-b2-q1-osmd","title":"モチーフで返す","title_en":"Answer with motifs","bpm":120,"key_fifths":0,"beats_per_measure":4,"beat_type":4,"loop_measures":24,"max_loops_per_phrase":2,"count_in_beats":0,"time_limit_sec":600,"player_hp":100,"enemy_hp":10000,"per_correct_note_damage":10,"good_completion_damage":30,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"chord_osmd","show_keyboard_hints_in_battle":true,"osmd_targets_from_score":true},"phrases":[{"order_index":0,"title":"Cブルース・モチーフ","title_en":"C blues motifs","music_xml_url":"https://jazzify-cdn.com/sozai/mq-b2-domifa.musicxml","audio_url":"https://jazzify-cdn.com/sozai/mq-b2-domifa_count-in.mp3","loop_duration_sec":50,"audio_duration_sec":50,"note_count":24,"key_fifths":0,"chords":[{"order_index":0,"chord_name":"—","measure_number":2,"beat_offset":1,"duration_beats":4,"start_time_sec":2,"end_time_sec":4,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":1,"chord_name":"C4/Eb4/F4","measure_number":3,"beat_offset":1,"duration_beats":4,"start_time_sec":4,"end_time_sec":6,"voicing":["C4","Eb4","F4"],"voicing_staves":[1,1,1]},{"order_index":2,"chord_name":"—","measure_number":4,"beat_offset":1,"duration_beats":4,"start_time_sec":6,"end_time_sec":8,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":3,"chord_name":"C4/Eb4/F4","measure_number":5,"beat_offset":1,"duration_beats":4,"start_time_sec":8,"end_time_sec":10,"voicing":["C4","Eb4","F4"],"voicing_staves":[1,1,1]},{"order_index":4,"chord_name":"—","measure_number":6,"beat_offset":1,"duration_beats":4,"start_time_sec":10,"end_time_sec":12,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":5,"chord_name":"C4/Eb4/F4","measure_number":7,"beat_offset":1,"duration_beats":4,"start_time_sec":12,"end_time_sec":14,"voicing":["C4","Eb4","F4"],"voicing_staves":[1,1,1]},{"order_index":6,"chord_name":"—","measure_number":8,"beat_offset":1,"duration_beats":4,"start_time_sec":14,"end_time_sec":16,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":7,"chord_name":"C4/Eb4/F4","measure_number":9,"beat_offset":1,"duration_beats":4,"start_time_sec":16,"end_time_sec":18,"voicing":["C4","Eb4","F4"],"voicing_staves":[1,1,1]},{"order_index":8,"chord_name":"—","measure_number":10,"beat_offset":1,"duration_beats":4,"start_time_sec":18,"end_time_sec":20,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":9,"chord_name":"C4/Eb4/F4","measure_number":11,"beat_offset":1,"duration_beats":4,"start_time_sec":20,"end_time_sec":22,"voicing":["C4","Eb4","F4"],"voicing_staves":[1,1,1]},{"order_index":10,"chord_name":"—","measure_number":12,"beat_offset":1,"duration_beats":4,"start_time_sec":22,"end_time_sec":24,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":11,"chord_name":"C4/Eb4/F4","measure_number":13,"beat_offset":1,"duration_beats":4,"start_time_sec":24,"end_time_sec":26,"voicing":["C4","Eb4","F4"],"voicing_staves":[1,1,1]},{"order_index":12,"chord_name":"—","measure_number":14,"beat_offset":1,"duration_beats":4,"start_time_sec":26,"end_time_sec":28,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":13,"chord_name":"C4/Eb4/F4","measure_number":15,"beat_offset":1,"duration_beats":4,"start_time_sec":28,"end_time_sec":30,"voicing":["C4","Eb4","F4"],"voicing_staves":[1,1,1]},{"order_index":14,"chord_name":"—","measure_number":16,"beat_offset":1,"duration_beats":4,"start_time_sec":30,"end_time_sec":32,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":15,"chord_name":"C4/Eb4/F4","measure_number":17,"beat_offset":1,"duration_beats":4,"start_time_sec":32,"end_time_sec":34,"voicing":["C4","Eb4","F4"],"voicing_staves":[1,1,1]},{"order_index":16,"chord_name":"—","measure_number":18,"beat_offset":1,"duration_beats":4,"start_time_sec":34,"end_time_sec":36,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":17,"chord_name":"C4/Eb4/F4","measure_number":19,"beat_offset":1,"duration_beats":4,"start_time_sec":36,"end_time_sec":38,"voicing":["C4","Eb4","F4"],"voicing_staves":[1,1,1]},{"order_index":18,"chord_name":"—","measure_number":20,"beat_offset":1,"duration_beats":4,"start_time_sec":38,"end_time_sec":40,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":19,"chord_name":"C4/Eb4/F4","measure_number":21,"beat_offset":1,"duration_beats":4,"start_time_sec":40,"end_time_sec":42,"voicing":["C4","Eb4","F4"],"voicing_staves":[1,1,1]},{"order_index":20,"chord_name":"—","measure_number":22,"beat_offset":1,"duration_beats":4,"start_time_sec":42,"end_time_sec":44,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":21,"chord_name":"C4/Eb4/F4","measure_number":23,"beat_offset":1,"duration_beats":4,"start_time_sec":44,"end_time_sec":46,"voicing":["C4","Eb4","F4"],"voicing_staves":[1,1,1]},{"order_index":22,"chord_name":"—","measure_number":24,"beat_offset":1,"duration_beats":4,"start_time_sec":46,"end_time_sec":48,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":23,"chord_name":"C4/Eb4/F4","measure_number":25,"beat_offset":1,"duration_beats":4,"start_time_sec":48,"end_time_sec":50,"voicing":["C4","Eb4","F4"],"voicing_staves":[1,1,1]}]}]}},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"partner","ja":"ファイよ、世界は少し輝きを取り戻したが、まだ不安定じゃ。","en":"Fai, the world has regained some light, but it is still unstable."},{"speaker":"player","ja":"前よりマシになったけど、まだ足りないんだね。","en":"It is better, but still not enough."},{"speaker":"partner","ja":"うむ。次に必要なのは、音を増やすことではない。","en":"Aye. Next we need something more than adding notes."},{"speaker":"player","ja":"じゃあ、何をすればいいの？","en":"Then what do I do?"},{"speaker":"partner","ja":"音で会話する力じゃ。短い音型、それが「モチーフ」じゃ。","en":"The power to converse with sound. A short pattern — a motif."},{"speaker":"player","ja":"モチーフ…短いフレーズってこと？","en":"A motif… like a short phrase?"},{"speaker":"partner","ja":"その通り。聴いて返す、コールアンドレスポンスから始めるのじゃ。","en":"Exactly. We start with call and response — listen, then answer."}]},{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"partner","ja":"今日使う音は、ド・ミ♭・ファの3つじゃ。","en":"Today we use three notes: C, Eb, and F."},{"speaker":"player","ja":"3つだけなら、覚えやすそう！","en":"Only three — I can handle that!"},{"speaker":"partner","ja":"ワシの音を1小節聴き、次の1小節でまねて返す。","en":"Listen for one bar, then answer in the next."},{"speaker":"player","ja":"よし、まずは譜面どおりに返してみよう。","en":"Alright — let me answer from the score first."}]},{"type":"chord_osmd","contentRef":"mq-b2-q1-osmd","requiredLoops":1,"timedLines":[{"at":{"loop":0,"measure":2,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":3,"beat":1},"text":{"ja":"返す（ド・ミ♭・ファ）","en":"Answer (C, Eb, F)"}},{"at":{"loop":0,"measure":4,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":5,"beat":1},"text":{"ja":"返す（ド・ミ♭・ファ）","en":"Answer (C, Eb, F)"}},{"at":{"loop":0,"measure":6,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":7,"beat":1},"text":{"ja":"返す（ド・ミ♭・ファ）","en":"Answer (C, Eb, F)"}},{"at":{"loop":0,"measure":8,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":9,"beat":1},"text":{"ja":"返す（ド・ミ♭・ファ）","en":"Answer (C, Eb, F)"}},{"at":{"loop":0,"measure":10,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":11,"beat":1},"text":{"ja":"返す（ド・ミ♭・ファ）","en":"Answer (C, Eb, F)"}},{"at":{"loop":0,"measure":12,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":13,"beat":1},"text":{"ja":"返す（ド・ミ♭・ファ）","en":"Answer (C, Eb, F)"}},{"at":{"loop":0,"measure":14,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":15,"beat":1},"text":{"ja":"返す（ド・ミ♭・ファ）","en":"Answer (C, Eb, F)"}},{"at":{"loop":0,"measure":16,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":17,"beat":1},"text":{"ja":"返す（ド・ミ♭・ファ）","en":"Answer (C, Eb, F)"}},{"at":{"loop":0,"measure":18,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":19,"beat":1},"text":{"ja":"返す（ド・ミ♭・ファ）","en":"Answer (C, Eb, F)"}},{"at":{"loop":0,"measure":20,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":21,"beat":1},"text":{"ja":"返す（ド・ミ♭・ファ）","en":"Answer (C, Eb, F)"}},{"at":{"loop":0,"measure":22,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":23,"beat":1},"text":{"ja":"返す（ド・ミ♭・ファ）","en":"Answer (C, Eb, F)"}},{"at":{"loop":0,"measure":24,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":25,"beat":1},"text":{"ja":"返す（ド・ミ♭・ファ）","en":"Answer (C, Eb, F)"}}]},{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"partner","ja":"よし。次はまねるだけではない。","en":"Good. Next you will not only copy."},{"speaker":"player","ja":"自由に弾くの？","en":"Play freely?"},{"speaker":"partner","ja":"1小節休み、1小節返す。ド・ミ♭・ファだけで、自分の返事を弾くのじゃ。","en":"Rest one bar, answer the next. Reply in your own way with C, Eb, and F only."},{"speaker":"player","ja":"次は、ド・ミ♭・ファでアドリブだ！","en":"Next up — ad-lib with C, Eb, and F!"}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.ear_training_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b2-q2-osmd-v1',
  'MQ B2: ソ・シ♭・ド OSMD',
  'MQ B2: G Bb C OSMD',
  '{"version":1,"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideLobby":true,"hideMidiToggle":true,"hidePhraseIntroQuota":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{"mq-b2-q2-osmd":{"stage":{"slug":"mq-b2-q2-osmd","title":"モチーフで返す","title_en":"Answer with motifs","bpm":120,"key_fifths":0,"beats_per_measure":4,"beat_type":4,"loop_measures":24,"max_loops_per_phrase":2,"count_in_beats":0,"time_limit_sec":600,"player_hp":100,"enemy_hp":10000,"per_correct_note_damage":10,"good_completion_damage":30,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"chord_osmd","show_keyboard_hints_in_battle":true,"osmd_targets_from_score":true},"phrases":[{"order_index":0,"title":"Cブルース・モチーフ","title_en":"C blues motifs","music_xml_url":"https://jazzify-cdn.com/sozai/mq-b2-soshido.musicxml","audio_url":"https://jazzify-cdn.com/sozai/mq-b2-soshido_count-in.mp3","loop_duration_sec":50,"audio_duration_sec":50,"note_count":24,"key_fifths":0,"chords":[{"order_index":0,"chord_name":"—","measure_number":2,"beat_offset":1,"duration_beats":4,"start_time_sec":2,"end_time_sec":4,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":1,"chord_name":"G4/Bb4/C5","measure_number":3,"beat_offset":1,"duration_beats":4,"start_time_sec":4,"end_time_sec":6,"voicing":["G4","Bb4","C5"],"voicing_staves":[1,1,1]},{"order_index":2,"chord_name":"—","measure_number":4,"beat_offset":1,"duration_beats":4,"start_time_sec":6,"end_time_sec":8,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":3,"chord_name":"G4/Bb4/C5","measure_number":5,"beat_offset":1,"duration_beats":4,"start_time_sec":8,"end_time_sec":10,"voicing":["G4","Bb4","C5"],"voicing_staves":[1,1,1]},{"order_index":4,"chord_name":"—","measure_number":6,"beat_offset":1,"duration_beats":4,"start_time_sec":10,"end_time_sec":12,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":5,"chord_name":"G4/Bb4/C5","measure_number":7,"beat_offset":1,"duration_beats":4,"start_time_sec":12,"end_time_sec":14,"voicing":["G4","Bb4","C5"],"voicing_staves":[1,1,1]},{"order_index":6,"chord_name":"—","measure_number":8,"beat_offset":1,"duration_beats":4,"start_time_sec":14,"end_time_sec":16,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":7,"chord_name":"G4/Bb4/C5","measure_number":9,"beat_offset":1,"duration_beats":4,"start_time_sec":16,"end_time_sec":18,"voicing":["G4","Bb4","C5"],"voicing_staves":[1,1,1]},{"order_index":8,"chord_name":"—","measure_number":10,"beat_offset":1,"duration_beats":4,"start_time_sec":18,"end_time_sec":20,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":9,"chord_name":"G4/Bb4/C5","measure_number":11,"beat_offset":1,"duration_beats":4,"start_time_sec":20,"end_time_sec":22,"voicing":["G4","Bb4","C5"],"voicing_staves":[1,1,1]},{"order_index":10,"chord_name":"—","measure_number":12,"beat_offset":1,"duration_beats":4,"start_time_sec":22,"end_time_sec":24,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":11,"chord_name":"G4/Bb4/C5","measure_number":13,"beat_offset":1,"duration_beats":4,"start_time_sec":24,"end_time_sec":26,"voicing":["G4","Bb4","C5"],"voicing_staves":[1,1,1]},{"order_index":12,"chord_name":"—","measure_number":14,"beat_offset":1,"duration_beats":4,"start_time_sec":26,"end_time_sec":28,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":13,"chord_name":"G4/Bb4/C5","measure_number":15,"beat_offset":1,"duration_beats":4,"start_time_sec":28,"end_time_sec":30,"voicing":["G4","Bb4","C5"],"voicing_staves":[1,1,1]},{"order_index":14,"chord_name":"—","measure_number":16,"beat_offset":1,"duration_beats":4,"start_time_sec":30,"end_time_sec":32,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":15,"chord_name":"G4/Bb4/C5","measure_number":17,"beat_offset":1,"duration_beats":4,"start_time_sec":32,"end_time_sec":34,"voicing":["G4","Bb4","C5"],"voicing_staves":[1,1,1]},{"order_index":16,"chord_name":"—","measure_number":18,"beat_offset":1,"duration_beats":4,"start_time_sec":34,"end_time_sec":36,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":17,"chord_name":"G4/Bb4/C5","measure_number":19,"beat_offset":1,"duration_beats":4,"start_time_sec":36,"end_time_sec":38,"voicing":["G4","Bb4","C5"],"voicing_staves":[1,1,1]},{"order_index":18,"chord_name":"—","measure_number":20,"beat_offset":1,"duration_beats":4,"start_time_sec":38,"end_time_sec":40,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":19,"chord_name":"G4/Bb4/C5","measure_number":21,"beat_offset":1,"duration_beats":4,"start_time_sec":40,"end_time_sec":42,"voicing":["G4","Bb4","C5"],"voicing_staves":[1,1,1]},{"order_index":20,"chord_name":"—","measure_number":22,"beat_offset":1,"duration_beats":4,"start_time_sec":42,"end_time_sec":44,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":21,"chord_name":"G4/Bb4/C5","measure_number":23,"beat_offset":1,"duration_beats":4,"start_time_sec":44,"end_time_sec":46,"voicing":["G4","Bb4","C5"],"voicing_staves":[1,1,1]},{"order_index":22,"chord_name":"—","measure_number":24,"beat_offset":1,"duration_beats":4,"start_time_sec":46,"end_time_sec":48,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":23,"chord_name":"G4/Bb4/C5","measure_number":25,"beat_offset":1,"duration_beats":4,"start_time_sec":48,"end_time_sec":50,"voicing":["G4","Bb4","C5"],"voicing_staves":[1,1,1]}]}]}},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"partner","ja":"ド・ミ♭・ファが身についてきたのう。","en":"You have got C, Eb, and F under your fingers."},{"speaker":"player","ja":"次は別の3音？","en":"Another set of three notes?"},{"speaker":"partner","ja":"そうじゃ。ソ・シ♭・ドじゃ。同じように聴いて返す。","en":"Aye. G, Bb, and C. Listen and answer the same way."},{"speaker":"player","ja":"2つ目のモチーフ、いってみよう！","en":"Let us try the second motif!"}]},{"type":"chord_osmd","contentRef":"mq-b2-q2-osmd","requiredLoops":1,"timedLines":[{"at":{"loop":0,"measure":2,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":3,"beat":1},"text":{"ja":"返す（ソ・シ♭・ド）","en":"Answer (G, Bb, C)"}},{"at":{"loop":0,"measure":4,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":5,"beat":1},"text":{"ja":"返す（ソ・シ♭・ド）","en":"Answer (G, Bb, C)"}},{"at":{"loop":0,"measure":6,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":7,"beat":1},"text":{"ja":"返す（ソ・シ♭・ド）","en":"Answer (G, Bb, C)"}},{"at":{"loop":0,"measure":8,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":9,"beat":1},"text":{"ja":"返す（ソ・シ♭・ド）","en":"Answer (G, Bb, C)"}},{"at":{"loop":0,"measure":10,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":11,"beat":1},"text":{"ja":"返す（ソ・シ♭・ド）","en":"Answer (G, Bb, C)"}},{"at":{"loop":0,"measure":12,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":13,"beat":1},"text":{"ja":"返す（ソ・シ♭・ド）","en":"Answer (G, Bb, C)"}},{"at":{"loop":0,"measure":14,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":15,"beat":1},"text":{"ja":"返す（ソ・シ♭・ド）","en":"Answer (G, Bb, C)"}},{"at":{"loop":0,"measure":16,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":17,"beat":1},"text":{"ja":"返す（ソ・シ♭・ド）","en":"Answer (G, Bb, C)"}},{"at":{"loop":0,"measure":18,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":19,"beat":1},"text":{"ja":"返す（ソ・シ♭・ド）","en":"Answer (G, Bb, C)"}},{"at":{"loop":0,"measure":20,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":21,"beat":1},"text":{"ja":"返す（ソ・シ♭・ド）","en":"Answer (G, Bb, C)"}},{"at":{"loop":0,"measure":22,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":23,"beat":1},"text":{"ja":"返す（ソ・シ♭・ド）","en":"Answer (G, Bb, C)"}},{"at":{"loop":0,"measure":24,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":25,"beat":1},"text":{"ja":"返す（ソ・シ♭・ド）","en":"Answer (G, Bb, C)"}}]},{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"partner","ja":"次はソ・シ♭・ドだけで、自由に返すんじゃ。","en":"Next, answer freely with G, Bb, and C only."},{"speaker":"player","ja":"1小節休んで、ソ・シ♭・ドでアドリブ！","en":"Rest a bar, then ad-lib with G, Bb, and C!"}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b2-q3-survival-v1',
  'MQ B2: モチーフチュートリアル',
  'MQ B2: Motif tutorial',
  '{"version":3,"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenarioOverrides":{"hideStaffOnBSlotCompletion":false,"hideStaff":false},"content":{"mq-b2-q3-motif-phrase":{"stage":{"name":"2つのモチーフ","nameEn":"Two motifs","stageType":"progression","mapCategory":"phrases","chordDisplayName":"ド・ミ♭・ファ / ソ・シ♭・ド","chordDisplayNameEn":"C Eb F / G Bb C","lessonOnly":true},"phrases":[{"order_index":0,"title":"モチーフ・プレイアロング","title_en":"Motif play-along","audio_url":"https://jazzify-cdn.com/sozai/mq-b2-motif-playalong-silent.mp3","loop_duration_sec":24,"key_fifths":0,"chords":[{"name":"Motif","voicing":[67,70,72],"voicingNames":["G4","Bb4","C5"],"keyFifths":0,"voicing_staves":[1,1,1],"measure_number":1,"quote":{"ja":"ソ・シ♭・ドで返す！","en":"ソ・シ♭・ドで返す！"}},{"name":"Motif","voicing":[72,70,67,67],"voicingNames":["C5","Bb4","G4","G4"],"keyFifths":0,"voicing_staves":[1,1,1,1],"measure_number":2,"quote":{"ja":"ソ・シ♭・ドで返す！","en":"ソ・シ♭・ドで返す！"}},{"name":"Motif","voicing":[70,67,70,67],"voicingNames":["Bb4","G4","Bb4","G4"],"keyFifths":0,"voicing_staves":[1,1,1,1],"measure_number":3,"quote":{"ja":"ソ・シ♭・ドで返す！","en":"ソ・シ♭・ドで返す！"}},{"name":"Motif","voicing":[72,70,67,72,70,67,72,70,67],"voicingNames":["C5","Bb4","G4","C5","Bb4","G4","C5","Bb4","G4"],"keyFifths":0,"voicing_staves":[1,1,1,1,1,1,1,1,1],"measure_number":4,"quote":{"ja":"ソ・シ♭・ドで返す！","en":"ソ・シ♭・ドで返す！"}},{"name":"Motif","voicing":[65,63,60],"voicingNames":["F4","Eb4","C4"],"keyFifths":0,"voicing_staves":[1,1,1],"measure_number":5,"quote":{"ja":"ド・ミ♭・ファで返す！","en":"ド・ミ♭・ファで返す！"}},{"name":"Motif","voicing":[60,63,65,63,60],"voicingNames":["C4","Eb4","F4","Eb4","C4"],"keyFifths":0,"voicing_staves":[1,1,1,1,1],"measure_number":6,"quote":{"ja":"ド・ミ♭・ファで返す！","en":"ド・ミ♭・ファで返す！"}}]}]}},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"2つのモチーフを組み合わせれば、会話になる。","en":"Combine two motifs and you get a conversation."},{"speaker":"fai","ja":"問いと答え、みたいな？","en":"Like question and answer?"},{"speaker":"jajii","ja":"そうじゃ。短い音型を少し変えながら使うと、アドリブにまとまりが出る。","en":"Aye. Vary a short pattern slightly and your ad-lib gains shape."},{"speaker":"fai","ja":"まずはジャ爺の演奏を見てみる！","en":"Let me watch you play first!"}]},{"type":"demo_play","bpm":60,"beatsPerMeasure":4,"keyFifths":0,"livePlayback":true,"audio":{"url":"https://jazzify-cdn.com/sozai/mq-b2-motif-demo-silent.mp3","volume":1},"introLines":[{"speaker":"jajii","ja":"モチーフを少しずつ変えながら弾くんじゃ。","en":"Play the motif with small variations."},{"speaker":"fai","ja":"デモ、見てみる！","en":"Watching the demo!"}],"chords":[{"startBeat":0,"durationBeats":4,"chordName":"Motif","voicing":[60,63,65],"voicingNames":["C4","Eb4","F4"],"voicing_staves":[1,1,1],"measureNumber":1,"keyFifths":0},{"startBeat":4,"durationBeats":4,"chordName":"Motif","voicing":[67,70,72],"voicingNames":["G4","Bb4","C5"],"voicing_staves":[1,1,1],"measureNumber":2,"keyFifths":0},{"startBeat":8,"durationBeats":4,"chordName":"Motif","voicing":[60,63,65,67,70,72],"voicingNames":["C4","Eb4","F4","G4","Bb4","C5"],"voicing_staves":[1,1,1,1,1,1],"measureNumber":3,"keyFifths":0},{"startBeat":12,"durationBeats":4,"chordName":"—","voicing":[],"voicingNames":[],"voicing_staves":[],"measureNumber":4,"keyFifths":0},{"startBeat":16,"durationBeats":4,"chordName":"—","voicing":[],"voicingNames":[],"voicing_staves":[],"measureNumber":5,"keyFifths":0},{"startBeat":20,"durationBeats":4,"chordName":"Motif","voicing":[60,63,65],"voicingNames":["C4","Eb4","F4"],"voicing_staves":[1,1,1],"measureNumber":6,"keyFifths":0},{"startBeat":24,"durationBeats":4,"chordName":"—","voicing":[],"voicingNames":[],"voicing_staves":[],"measureNumber":7,"keyFifths":0},{"startBeat":28,"durationBeats":4,"chordName":"Motif","voicing":[67,70,72],"voicingNames":["G4","Bb4","C5"],"voicing_staves":[1,1,1],"measureNumber":8,"keyFifths":0},{"startBeat":32,"durationBeats":4,"chordName":"—","voicing":[],"voicingNames":[],"voicing_staves":[],"measureNumber":9,"keyFifths":0},{"startBeat":36,"durationBeats":4,"chordName":"—","voicing":[],"voicingNames":[],"voicing_staves":[],"measureNumber":10,"keyFifths":0},{"startBeat":40,"durationBeats":4,"chordName":"Motif","voicing":[60,63,65],"voicingNames":["C4","Eb4","F4"],"voicing_staves":[1,1,1],"measureNumber":11,"keyFifths":0},{"startBeat":44,"durationBeats":4,"chordName":"—","voicing":[],"voicingNames":[],"voicing_staves":[],"measureNumber":12,"keyFifths":0},{"startBeat":48,"durationBeats":4,"chordName":"Motif","voicing":[55,58,60],"voicingNames":["G3","Bb3","C4"],"voicing_staves":[1,1,1],"measureNumber":13,"keyFifths":0},{"startBeat":52,"durationBeats":4,"chordName":"—","voicing":[],"voicingNames":[],"voicing_staves":[],"measureNumber":14,"keyFifths":0},{"startBeat":56,"durationBeats":4,"chordName":"Motif","voicing":[60,63,65],"voicingNames":["C4","Eb4","F4"],"voicing_staves":[1,1,1],"measureNumber":15,"keyFifths":0},{"startBeat":60,"durationBeats":4,"chordName":"Motif","voicing":[67,70,72],"voicingNames":["G4","Bb4","C5"],"voicing_staves":[1,1,1],"measureNumber":16,"keyFifths":0},{"startBeat":64,"durationBeats":4,"chordName":"—","voicing":[],"voicingNames":[],"voicing_staves":[],"measureNumber":17,"keyFifths":0},{"startBeat":68,"durationBeats":4,"chordName":"Motif","voicing":[60,63,65],"voicingNames":["C4","Eb4","F4"],"voicing_staves":[1,1,1],"measureNumber":18,"keyFifths":0},{"startBeat":72,"durationBeats":4,"chordName":"—","voicing":[],"voicingNames":[],"voicing_staves":[],"measureNumber":19,"keyFifths":0},{"startBeat":76,"durationBeats":4,"chordName":"Motif","voicing":[67,70,72],"voicingNames":["G4","Bb4","C5"],"voicing_staves":[1,1,1],"measureNumber":20,"keyFifths":0},{"startBeat":80,"durationBeats":4,"chordName":"—","voicing":[],"voicingNames":[],"voicing_staves":[],"measureNumber":21,"keyFifths":0},{"startBeat":84,"durationBeats":4,"chordName":"—","voicing":[],"voicingNames":[],"voicing_staves":[],"measureNumber":22,"keyFifths":0},{"startBeat":88,"durationBeats":4,"chordName":"Motif","voicing":[60,63,65],"voicingNames":["C4","Eb4","F4"],"voicing_staves":[1,1,1],"measureNumber":23,"keyFifths":0},{"startBeat":92,"durationBeats":4,"chordName":"Motif","voicing":[65,63,60,60],"voicingNames":["F4","Eb4","C4","C4"],"voicing_staves":[1,1,1,1],"measureNumber":24,"keyFifths":0},{"startBeat":96,"durationBeats":4,"chordName":"Motif","voicing":[63,60,63,60],"voicingNames":["Eb4","C4","Eb4","C4"],"voicing_staves":[1,1,1,1],"measureNumber":25,"keyFifths":0},{"startBeat":100,"durationBeats":4,"chordName":"Motif","voicing":[65,63,60,65,63,60,65,63,60],"voicingNames":["F4","Eb4","C4","F4","Eb4","C4","F4","Eb4","C4"],"voicing_staves":[1,1,1,1,1,1,1,1,1],"measureNumber":26,"keyFifths":0},{"startBeat":104,"durationBeats":4,"chordName":"Motif","voicing":[72,70,67],"voicingNames":["C5","Bb4","G4"],"voicing_staves":[1,1,1],"measureNumber":27,"keyFifths":0},{"startBeat":108,"durationBeats":4,"chordName":"Motif","voicing":[67,70,72,70,67],"voicingNames":["G4","Bb4","C5","Bb4","G4"],"voicing_staves":[1,1,1,1,1],"measureNumber":28,"keyFifths":0},{"startBeat":112,"durationBeats":4,"chordName":"Motif","voicing":[72,67,70,72,67,70],"voicingNames":["C5","G4","Bb4","C5","G4","Bb4"],"voicing_staves":[1,1,1,1,1,1],"measureNumber":29,"keyFifths":0}],"lines":[{"speaker":"jajii","ja":"ド・ミ♭・ファ…","en":"C, Eb, F…","startBeat":0,"durationBeats":4},{"speaker":"jajii","ja":"ソ・シ♭・ドで返す。","en":"Answer with G, Bb, C.","startBeat":4,"durationBeats":4}]},{"type":"phrase_battle","contentRef":"mq-b2-q3-motif-phrase","requiredLoops":1,"playAlong":true,"introDelaySeconds":2,"dialogue":{"intro":{"ja":"一緒に弾いてみい。","en":"Play along with me."},"onReveal":{"ja":"このモチーフを演奏！","en":"Play this motif!"},"onCorrectRemaining":{"ja":"OK、あと{{remaining}}塊。","en":"OK, {{remaining}} left."}}},{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"よし。2つのモチーフが会話になってきたのう。","en":"Good. Your two motifs are becoming a dialogue."},{"speaker":"fai","ja":"問いと答え、感じてきた！","en":"I can feel the question and answer!"},{"speaker":"jajii","ja":"次は譜面どおりに本番じゃ。","en":"Next is the real battle from the score."},{"speaker":"fai","ja":"がんばるぞ！","en":"I am ready!"}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b2-q3-bridge-v1',
  'MQ B2: 最終アドリブ前会話',
  'MQ B2: Pre-final adlib talk',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenarioOverrides":{"hideStaffOnBSlotCompletion":false,"hideStaff":false},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"最後の課題じゃ。ド・ミ♭・ファとソ・シ♭・ドを使って、自由にアドリブする。","en":"The final task: ad-lib freely with C Eb F and G Bb C."},{"speaker":"fai","ja":"どう弾いてもいいんだね？","en":"Any way I want?"},{"speaker":"jajii","ja":"うむ。なるべく2つのモチーフを対応させるんじゃ。","en":"Aye. Pair the two motifs when you can."},{"speaker":"fai","ja":"でたらめにならないように、秩序が必要なんだよね。","en":"So I need some order so it does not turn random."},{"speaker":"jajii","ja":"そうじゃ。だが、秩序がありすぎると機械みたいに無機質になる。","en":"Aye. But too much order turns it mechanical."},{"speaker":"jajii","ja":"このさじ加減が、アドリブの難しさじゃ。","en":"That balance is the hard part of ad-lib."},{"speaker":"fai","ja":"2つのモチーフで、自由に会話してみる！","en":"Let me converse freely with both motifs!"}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();


DELETE FROM public.ear_training_phrase_chord_quotes
WHERE phrase_chord_id IN (
  SELECT id FROM public.ear_training_phrase_chords WHERE phrase_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-phrase')
);
DELETE FROM public.ear_training_phrase_chords WHERE phrase_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-phrase');
DELETE FROM public.ear_training_phrases WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-phrase');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-stage'),
  'mq-b2-q1-2-adlib',
  'ド・ミ♭・ファでアドリブ',
  'Ad-lib with C Eb F',
  'Cブルース上でド・ミ♭・ファだけ自由に返す。',
  'Answer freely with C, Eb, and F on C blues.',
  120, 0, 4, 4, 12, 8,
  4, 300, 100, 1500,
  50, 12, 18, 24,
  10, 0, 4, 8,
  'blue_club', true, false, 'adlib', true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-stage'),
  0,
  'Cブルース・ドミファ',
  'C blues C Eb F',
  NULL,
  'https://jazzify-cdn.com/sozai/mq-b2-domifa.mp3',
  24,
  24,
  0,
  0
);

INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name, measure_number, beat_offset,
  duration_beats, start_time_sec, end_time_sec, voicing, voicing_staves, input_disabled
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-c0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-phrase'),
    0,
    'C7',
    1,
    1,
    4,
    0,
    2,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-c1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-phrase'),
    1,
    'F7',
    2,
    1,
    4,
    2,
    4,
    ARRAY['C4', 'Eb4', 'F4']::text[],
    ARRAY[1, 1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-c2'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-phrase'),
    2,
    'C7',
    3,
    1,
    4,
    4,
    6,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-c3'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-phrase'),
    3,
    'C7',
    4,
    1,
    4,
    6,
    8,
    ARRAY['C4', 'Eb4', 'F4']::text[],
    ARRAY[1, 1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-c4'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-phrase'),
    4,
    'F7',
    5,
    1,
    4,
    8,
    10,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-c5'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-phrase'),
    5,
    'F7',
    6,
    1,
    4,
    10,
    12,
    ARRAY['C4', 'Eb4', 'F4']::text[],
    ARRAY[1, 1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-c6'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-phrase'),
    6,
    'C7',
    7,
    1,
    4,
    12,
    14,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-c7'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-phrase'),
    7,
    'C7',
    8,
    1,
    4,
    14,
    16,
    ARRAY['C4', 'Eb4', 'F4']::text[],
    ARRAY[1, 1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-c8'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-phrase'),
    8,
    'G7',
    9,
    1,
    4,
    16,
    18,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-c9'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-phrase'),
    9,
    'F7',
    10,
    1,
    4,
    18,
    20,
    ARRAY['C4', 'Eb4', 'F4']::text[],
    ARRAY[1, 1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-c10'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-phrase'),
    10,
    'C7',
    11,
    1,
    4,
    20,
    22,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-c11'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-phrase'),
    11,
    'G7',
    12,
    1,
    4,
    22,
    24,
    ARRAY['C4', 'Eb4', 'F4']::text[],
    ARRAY[1, 1, 1]::smallint[],
    false
  );

INSERT INTO public.ear_training_phrase_chord_quotes (phrase_chord_id, text) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-c0'), '休む。'),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-c1'), 'ド・ミ♭・ファでアドリブ')
ON CONFLICT (phrase_chord_id) DO UPDATE SET
  text = EXCLUDED.text,
  updated_at = now();



DELETE FROM public.ear_training_phrase_chord_quotes
WHERE phrase_chord_id IN (
  SELECT id FROM public.ear_training_phrase_chords WHERE phrase_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-phrase')
);
DELETE FROM public.ear_training_phrase_chords WHERE phrase_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-phrase');
DELETE FROM public.ear_training_phrases WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-phrase');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-stage'),
  'mq-b2-q2-2-adlib',
  'ソ・シ♭・ドでアドリブ',
  'Ad-lib with G Bb C',
  'Cブルース上でソ・シ♭・ドだけ自由に返す。',
  'Answer freely with G, Bb, and C on C blues.',
  120, 0, 4, 4, 12, 8,
  4, 300, 100, 1500,
  50, 12, 18, 24,
  10, 0, 4, 8,
  'blue_club', true, false, 'adlib', true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-stage'),
  0,
  'Cブルース・ソシド',
  'C blues G Bb C',
  NULL,
  'https://jazzify-cdn.com/sozai/mq-b2-soshido.mp3',
  24,
  24,
  0,
  0
);

INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name, measure_number, beat_offset,
  duration_beats, start_time_sec, end_time_sec, voicing, voicing_staves, input_disabled
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-c0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-phrase'),
    0,
    'C7',
    1,
    1,
    4,
    0,
    2,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-c1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-phrase'),
    1,
    'F7',
    2,
    1,
    4,
    2,
    4,
    ARRAY['G4', 'Bb4', 'C5']::text[],
    ARRAY[1, 1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-c2'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-phrase'),
    2,
    'C7',
    3,
    1,
    4,
    4,
    6,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-c3'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-phrase'),
    3,
    'C7',
    4,
    1,
    4,
    6,
    8,
    ARRAY['G4', 'Bb4', 'C5']::text[],
    ARRAY[1, 1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-c4'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-phrase'),
    4,
    'F7',
    5,
    1,
    4,
    8,
    10,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-c5'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-phrase'),
    5,
    'F7',
    6,
    1,
    4,
    10,
    12,
    ARRAY['G4', 'Bb4', 'C5']::text[],
    ARRAY[1, 1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-c6'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-phrase'),
    6,
    'C7',
    7,
    1,
    4,
    12,
    14,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-c7'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-phrase'),
    7,
    'C7',
    8,
    1,
    4,
    14,
    16,
    ARRAY['G4', 'Bb4', 'C5']::text[],
    ARRAY[1, 1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-c8'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-phrase'),
    8,
    'G7',
    9,
    1,
    4,
    16,
    18,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-c9'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-phrase'),
    9,
    'F7',
    10,
    1,
    4,
    18,
    20,
    ARRAY['G4', 'Bb4', 'C5']::text[],
    ARRAY[1, 1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-c10'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-phrase'),
    10,
    'C7',
    11,
    1,
    4,
    20,
    22,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-c11'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-phrase'),
    11,
    'G7',
    12,
    1,
    4,
    22,
    24,
    ARRAY['G4', 'Bb4', 'C5']::text[],
    ARRAY[1, 1, 1]::smallint[],
    false
  );

INSERT INTO public.ear_training_phrase_chord_quotes (phrase_chord_id, text) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-c0'), '休む。'),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-c1'), 'ソ・シ♭・ドでアドリブ')
ON CONFLICT (phrase_chord_id) DO UPDATE SET
  text = EXCLUDED.text,
  updated_at = now();



DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-2-osmd-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-2-osmd-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-2-osmd-stage'),
  'mq-b2-q3-2-osmd',
  '2つのモチーフで演奏',
  'Play two motifs',
  '譜面通りにモチーフを演奏。1ループPerfectでクリア。',
  'Play motifs from the score. Clear with one Perfect loop.',
  120, 0, 4, 4, 24, 4,
  4, 600, 300, 10000,
  10, 5000, 7500, 10000,
  10, 15, 4, 8,
  'blue_club', true, false, 'chord_osmd', true, true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-2-osmd-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-2-osmd-stage'),
  0,
  'モチーフ譜面',
  'Motif score',
  'https://jazzify-cdn.com/sozai/mq-b2-motif.musicxml',
  'https://jazzify-cdn.com/sozai/mq-b2-motif.mp3',
  48,
  48,
  0,
  0
);


DELETE FROM public.ear_training_phrase_chord_quotes
WHERE phrase_chord_id IN (
  SELECT id FROM public.ear_training_phrase_chords WHERE phrase_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-phrase')
);
DELETE FROM public.ear_training_phrase_chords WHERE phrase_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-phrase');
DELETE FROM public.ear_training_phrases WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-phrase');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-stage'),
  'mq-b2-q3-4-adlib',
  '2つのモチーフでアドリブ',
  'Ad-lib with two motifs',
  'ド・ミ♭・ファとソ・シ♭・ドで自由にアドリブ。',
  'Ad-lib freely with both motif note sets.',
  100, 0, 4, 4, 12, 8,
  4, 300, 100, 1500,
  50, 12, 18, 24,
  10, 0, 4, 8,
  'blue_club', true, false, 'adlib', true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-stage'),
  0,
  'Cブルース・2モチーフ',
  'C blues two motifs',
  NULL,
  'https://jazzify-cdn.com/sozai/mq-b2-c-blues-12bars-100bpm.mp3',
  28.799999999999997,
  28.799999999999997,
  0,
  0
);

INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name, measure_number, beat_offset,
  duration_beats, start_time_sec, end_time_sec, voicing, voicing_staves, input_disabled
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-c0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-phrase'),
    0,
    'C7',
    1,
    1,
    4,
    0,
    2.4,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-c1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-phrase'),
    1,
    'F7',
    2,
    1,
    4,
    2.4,
    4.8,
    ARRAY['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5']::text[],
    ARRAY[1, 1, 1, 1, 1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-c2'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-phrase'),
    2,
    'C7',
    3,
    1,
    4,
    4.8,
    7.199999999999999,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-c3'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-phrase'),
    3,
    'C7',
    4,
    1,
    4,
    7.199999999999999,
    9.6,
    ARRAY['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5']::text[],
    ARRAY[1, 1, 1, 1, 1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-c4'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-phrase'),
    4,
    'F7',
    5,
    1,
    4,
    9.6,
    12,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-c5'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-phrase'),
    5,
    'F7',
    6,
    1,
    4,
    12,
    14.4,
    ARRAY['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5']::text[],
    ARRAY[1, 1, 1, 1, 1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-c6'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-phrase'),
    6,
    'C7',
    7,
    1,
    4,
    14.399999999999999,
    16.799999999999997,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-c7'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-phrase'),
    7,
    'C7',
    8,
    1,
    4,
    16.8,
    19.2,
    ARRAY['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5']::text[],
    ARRAY[1, 1, 1, 1, 1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-c8'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-phrase'),
    8,
    'G7',
    9,
    1,
    4,
    19.2,
    21.599999999999998,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-c9'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-phrase'),
    9,
    'F7',
    10,
    1,
    4,
    21.599999999999998,
    23.999999999999996,
    ARRAY['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5']::text[],
    ARRAY[1, 1, 1, 1, 1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-c10'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-phrase'),
    10,
    'C7',
    11,
    1,
    4,
    24,
    26.4,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-c11'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-phrase'),
    11,
    'G7',
    12,
    1,
    4,
    26.4,
    28.799999999999997,
    ARRAY['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5']::text[],
    ARRAY[1, 1, 1, 1, 1, 1]::smallint[],
    false
  );

INSERT INTO public.ear_training_phrase_chord_quotes (phrase_chord_id, text) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-c0'), '休む。'),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-c1'), '2つのモチーフでアドリブ')
ON CONFLICT (phrase_chord_id) DO UPDATE SET
  text = EXCLUDED.text,
  updated_at = now();


INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en, block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en, manual_completion_disabled
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-lesson'),
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'クエスト1：ド・ミ♭・ファでアドリブしよう',
    'Quest 1: Ad-lib with C, Eb, F',
    'モチーフとコールアンドレスポンス。ド・ミ♭・ファで返す。',
    'Motifs and call-and-response with C, Eb, and F.',
    false, 0, 2,
    'Cブルース：モチーフでアドリブしよう', 'C Blues: Ad-lib with Motifs',
    'モチーフを使ったアドリブに挑戦する。',
    'Challenge ad-lib with motifs.',
    '[]'::jsonb,
    'ド・ミ♭・ファで短いモチーフを作りましょう。',
    'Build short motifs with C, Eb, and F.',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-lesson'),
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'クエスト2：ソ・シ♭・ドでアドリブしよう',
    'Quest 2: Ad-lib with G, Bb, C',
    '別の3音グループで同じ練習。',
    'The same practice with another three-note group.',
    false, 1, 2,
    'Cブルース：モチーフでアドリブしよう', 'C Blues: Ad-lib with Motifs',
    'モチーフを使ったアドリブに挑戦する。',
    'Challenge ad-lib with motifs.',
    '[]'::jsonb,
    'ソ・シ♭・ドでモチーフを作りましょう。',
    'Build motifs with G, Bb, and C.',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-lesson'),
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'クエスト3：2つのモチーフで会話しよう',
    'Quest 3: Converse with two motifs',
    '2つのモチーフを組み合わせて問いと答えを作る。',
    'Combine two motifs into question and answer.',
    false, 2, 2,
    'Cブルース：モチーフでアドリブしよう', 'C Blues: Ad-lib with Motifs',
    'モチーフを使ったアドリブに挑戦する。',
    'Challenge ad-lib with motifs.',
    '[]'::jsonb,
    '2つのモチーフで会話するアドリブを試しましょう。',
    'Try ad-lib that converses with two motifs.',
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
  title, title_en
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-1-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL, false, NULL,
    true, 'mq-b2-q1-osmd-v1', false, NULL, false, NULL, NULL, NULL, NULL, NULL,
    '1-1. ド・ミ♭・ファでまねしよう', '1-1. Copy C Eb F'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-lesson'), NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-2-adlib-stage'),
    false, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL,
    '1-2. ド・ミ♭・ファでアドリブ', '1-2. Ad-lib C Eb F'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-1-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL, false, NULL,
    true, 'mq-b2-q2-osmd-v1', false, NULL, false, NULL, NULL, NULL, NULL, NULL,
    '2-1. ソ・シ♭・ドでまねしよう', '2-1. Copy G Bb C'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-lesson'), NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-2-adlib-stage'),
    false, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL,
    '2-2. ソ・シ♭・ドでアドリブ', '2-2. Ad-lib G Bb C'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-1-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL, false, NULL,
    false, NULL, true, 'mq-b2-q3-survival-v1', false, NULL, NULL, NULL, NULL, NULL,
    '3-1. モチーフのデモと一緒に弾く', '3-1. Motif demo and play-along'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-2-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-lesson'), NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-2-osmd-stage'),
    false, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL,
    '3-2. 譜面どおりに演奏', '3-2. Play from the score'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-3-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-lesson'), NULL, 2,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL, false, NULL,
    false, NULL, true, 'mq-b2-q3-bridge-v1', false, NULL, NULL, NULL, NULL, NULL,
    '3-3. 最終課題の説明', '3-3. Final task briefing'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-lesson'), NULL, 3,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-4-adlib-stage'),
    false, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL,
    '3-4. 2つのモチーフでアドリブ', '3-4. Ad-lib with two motifs'
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
  title_en = EXCLUDED.title_en;

UPDATE public.courses
SET
  description = 'ジャズ初心者が順番に進める一本道のコース。Cブルースから、モチーフでアドリブへ。',
  description_en = 'A step-by-step path for jazz beginners. From C blues to ad-lib with motifs.',
  updated_at = now()
WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid;

COMMIT;
