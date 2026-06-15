-- メインクエスト Block1: Cブルースを弾いてみよう（開発者テストコース / block_number=1）
-- 生成: node scripts/generate-mq-block1-c-blues-migration.mjs
-- 事前: node scripts/upload-sozai-main-quest-block1-r2.mjs
BEGIN;

-- ---------------------------------------------------------------------------
-- チュートリアル台本
-- ---------------------------------------------------------------------------

INSERT INTO public.ear_training_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b1-q1-osmd-v1',
  'MQ B1: ドとソをまねしよう',
  'MQ B1: Copy Do and Sol',
  '{"version":1,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideLobby":true,"hideMidiToggle":true,"hidePhraseIntroQuota":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{"mq-b1-q1-osmd":{"stage":{"slug":"mq-b1-q1-osmd","title":"ドとソをまねしよう","title_en":"Copy Do and Sol","bpm":100,"key_fifths":0,"beats_per_measure":4,"beat_type":4,"loop_measures":24,"max_loops_per_phrase":2,"count_in_beats":0,"time_limit_sec":600,"player_hp":100,"enemy_hp":10000,"per_correct_note_damage":10,"good_completion_damage":30,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"chord_osmd","show_keyboard_hints_in_battle":true},"phrases":[{"order_index":0,"title":"Cブルース・ドとソ","title_en":"C Blues Do/Sol","music_xml_url":"https://jazzify-cdn.com/sozai/1-1.musicxml","audio_url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM.mp3","loop_duration_sec":57.6,"audio_duration_sec":57.6,"note_count":24,"key_fifths":0,"chords":[{"order_index":0,"chord_name":"—","measure_number":1,"beat_offset":1,"duration_beats":4,"start_time_sec":0,"end_time_sec":2.4,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":1,"chord_name":"C/G","measure_number":2,"beat_offset":1,"duration_beats":4,"start_time_sec":2.4,"end_time_sec":4.8,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":2,"chord_name":"—","measure_number":3,"beat_offset":1,"duration_beats":4,"start_time_sec":4.8,"end_time_sec":7.199999999999999,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":3,"chord_name":"C/G","measure_number":4,"beat_offset":1,"duration_beats":4,"start_time_sec":7.199999999999999,"end_time_sec":9.6,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":4,"chord_name":"—","measure_number":5,"beat_offset":1,"duration_beats":4,"start_time_sec":9.6,"end_time_sec":12,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":5,"chord_name":"C/G","measure_number":6,"beat_offset":1,"duration_beats":4,"start_time_sec":12,"end_time_sec":14.4,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":6,"chord_name":"—","measure_number":7,"beat_offset":1,"duration_beats":4,"start_time_sec":14.399999999999999,"end_time_sec":16.799999999999997,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":7,"chord_name":"C/G","measure_number":8,"beat_offset":1,"duration_beats":4,"start_time_sec":16.8,"end_time_sec":19.2,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":8,"chord_name":"—","measure_number":9,"beat_offset":1,"duration_beats":4,"start_time_sec":19.2,"end_time_sec":21.599999999999998,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":9,"chord_name":"C/G","measure_number":10,"beat_offset":1,"duration_beats":4,"start_time_sec":21.599999999999998,"end_time_sec":23.999999999999996,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":10,"chord_name":"—","measure_number":11,"beat_offset":1,"duration_beats":4,"start_time_sec":24,"end_time_sec":26.4,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":11,"chord_name":"C/G","measure_number":12,"beat_offset":1,"duration_beats":4,"start_time_sec":26.4,"end_time_sec":28.799999999999997,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":12,"chord_name":"—","measure_number":13,"beat_offset":1,"duration_beats":4,"start_time_sec":28.799999999999997,"end_time_sec":31.199999999999996,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":13,"chord_name":"C/G","measure_number":14,"beat_offset":1,"duration_beats":4,"start_time_sec":31.2,"end_time_sec":33.6,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":14,"chord_name":"—","measure_number":15,"beat_offset":1,"duration_beats":4,"start_time_sec":33.6,"end_time_sec":36,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":15,"chord_name":"C/G","measure_number":16,"beat_offset":1,"duration_beats":4,"start_time_sec":36,"end_time_sec":38.4,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":16,"chord_name":"—","measure_number":17,"beat_offset":1,"duration_beats":4,"start_time_sec":38.4,"end_time_sec":40.8,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":17,"chord_name":"C/G","measure_number":18,"beat_offset":1,"duration_beats":4,"start_time_sec":40.8,"end_time_sec":43.199999999999996,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":18,"chord_name":"—","measure_number":19,"beat_offset":1,"duration_beats":4,"start_time_sec":43.199999999999996,"end_time_sec":45.599999999999994,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":19,"chord_name":"C/G","measure_number":20,"beat_offset":1,"duration_beats":4,"start_time_sec":45.6,"end_time_sec":48,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":20,"chord_name":"—","measure_number":21,"beat_offset":1,"duration_beats":4,"start_time_sec":48,"end_time_sec":50.4,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":21,"chord_name":"C/G","measure_number":22,"beat_offset":1,"duration_beats":4,"start_time_sec":50.4,"end_time_sec":52.8,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":22,"chord_name":"—","measure_number":23,"beat_offset":1,"duration_beats":4,"start_time_sec":52.8,"end_time_sec":55.199999999999996,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":23,"chord_name":"C/G","measure_number":24,"beat_offset":1,"duration_beats":4,"start_time_sec":55.199999999999996,"end_time_sec":57.599999999999994,"voicing":["C4","G4"],"voicing_staves":[1,1]}]}]}},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"partner","ja":"ファイよ、この世界は音のチカラを失い、崩れかけておる。","en":"Fai, this world has lost the power of sound and is crumbling."},{"speaker":"player","ja":"えっ、オレが何とかするの？","en":"Wait — I have to fix this?"},{"speaker":"partner","ja":"うむ。必要なのは、ジャズのチカラじゃ。","en":"Aye. What we need is the power of jazz."},{"speaker":"player","ja":"ジャズって、むずかしそうだけど。","en":"Jazz sounds pretty hard though."},{"speaker":"partner","ja":"心配いらん。まず使う音は、ドとソだけじゃ。","en":"Fear not. For now you only need Do and Sol."},{"speaker":"player","ja":"2つだけなら、いけそう！","en":"Only two notes — I can do that!"},{"speaker":"partner","ja":"ワシの音を1小節聴き、次の1小節でまねするのじゃ。","en":"Listen for one bar, then copy me in the next bar."},{"speaker":"player","ja":"まずは、ドとソをまねしてみよう。","en":"Let''s start by copying Do and Sol."}]},{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"partner","ja":"このコースでは、Cブルースに挑戦する。","en":"In this course we take on the C blues."},{"speaker":"player","ja":"Cブルース？","en":"C blues?"},{"speaker":"partner","ja":"ジャズの入口にぴったりの流れじゃ。","en":"A perfect entry into jazz."},{"speaker":"player","ja":"いきなり曲っぽいことするんだね。","en":"So we jump into something song-like right away."},{"speaker":"partner","ja":"そうじゃ。読むより先に、聴いて、返して、手で覚えるのじゃ。","en":"Aye. Hear, answer, and learn with your hands before reading."},{"speaker":"player","ja":"よし、まずは音で会話だ！","en":"Alright — conversation with sound first!"},{"speaker":"player","ja":"流れる音を聴いて、次の小節で同じように返そう。","en":"Listen to the music, then answer the same way in the next bar."}]},{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"partner","ja":"上の楽譜が進む。光る音をよく見るのじゃ。","en":"The score above moves. Watch the highlighted notes."},{"speaker":"player","ja":"聴くところと、弾くところが交互に来るんだね。","en":"Listen bars and play bars alternate."},{"speaker":"partner","ja":"うむ。聴く小節では聴く。返す小節で弾く。","en":"Aye. Listen on listen bars. Play on answer bars."},{"speaker":"player","ja":"あわてず、ドとソをねらえばいいんだな。","en":"No rush — just aim for Do and Sol."},{"speaker":"player","ja":"1小節聴いて、1小節まねしよう。","en":"One bar listen, one bar copy."}]},{"type":"chord_osmd","contentRef":"mq-b1-q1-osmd","requiredLoops":1,"timedLines":[{"at":{"loop":0,"measure":1,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":2,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}}]},{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"partner","ja":"よし。ドとソで返事ができたのう。","en":"Good. You answered with Do and Sol."},{"speaker":"player","ja":"ちょっと音で会話してる感じがした！","en":"It felt like talking with sound!"},{"speaker":"partner","ja":"次は、まねるだけではない。","en":"Next, you won''t only copy."},{"speaker":"player","ja":"じゃあ、どうするの？","en":"So what do I do?"},{"speaker":"partner","ja":"ドとソだけで、自分の返事を弾くのじゃ。","en":"Answer in your own way with just Do and Sol."},{"speaker":"player","ja":"次は、ドとソで自由にアドリブしよう。","en":"Next up: ad-lib with Do and Sol."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();


INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b1-q2-survival-v1',
  'MQ B1: 2音コード',
  'MQ B1: Two-note chords',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenarioOverrides":{"hideStaffOnBSlotCompletion":false,"hideStaff":false},"content":{"mq-b1-q2-random":{"stage":{"name":"2音コード","nameEn":"Two-note chords","stageType":"random","mapCategory":"lesson","chordDisplayName":"C7 / F7 / G7","chordDisplayNameEn":"C7 / F7 / G7","lessonOnly":true},"randomChordPoolEasy":[{"name":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"F7","voicing":[63,69],"voicingNames":["E♭4","A4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"G7","voicing":[65,71],"voicingNames":["F4","B4"],"keyFifths":0,"voicing_staves":[1,1]}]}},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"アドリブには、土台となる響きがある。","en":"Ad-lib needs a harmonic foundation."},{"speaker":"fai","ja":"それがコード？","en":"You mean chords?"},{"speaker":"jajii","ja":"そうじゃ。今日はC7、F7、G7を使う。","en":"Aye. Today we use C7, F7, and G7."},{"speaker":"fai","ja":"全部の音を弾くの？","en":"Do I play every note?"},{"speaker":"jajii","ja":"いや、まずは2音だけでよい。2音でもコードの性格は出る。","en":"No — two notes are enough. They still show the chord color."},{"speaker":"fai","ja":"少ない音で、響きを作るんだな。","en":"So we build the sound with fewer notes."},{"speaker":"fai","ja":"C7、F7、G7の2音コードを覚えよう。","en":"Let''s learn the two-note C7, F7, and G7 shapes."}]},{"type":"random_battle","contentRef":"mq-b1-q2-random","questionCount":3,"hardQuestions":false,"introDelaySeconds":3,"dialogue":{"intro":{"ja":"C7、F7、G7の2音を覚えるのじゃ。","en":"Learn the two-note C7, F7, and G7 shapes."},"onReveal":{"ja":"この響きを演奏！","en":"Play this sound!"},"onCorrectRemaining":{"ja":"OK、あと{{remaining}}問。","en":"OK, {{remaining}} left."}}},{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"よし。コードの響きが見えてきたのう。","en":"Good. You can hear the chord colors now."},{"speaker":"fai","ja":"2音だけでも、けっこう雰囲気出るね。","en":"Two notes still feel pretty jazzy."},{"speaker":"jajii","ja":"次は、C7とF7をすばやく見分けて弾くのじゃ。","en":"Next, tell C7 and F7 apart and play them quickly."},{"speaker":"fai","ja":"C7とF7のコードランに進もう。","en":"On to the C7/F7 chord run."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();


INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b1-q3-survival-v1',
  'MQ B1: 進行をゆっくり',
  'MQ B1: Slow progression',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenarioOverrides":{"hideStaffOnBSlotCompletion":false,"hideStaff":false},"content":{"mq-b1-q3-progression":{"stage":{"name":"Cブルース進行","nameEn":"C blues progression","stageType":"progression","mapCategory":"lesson","chordDisplayName":"Cブルース","chordDisplayNameEn":"C blues","lessonOnly":true},"chordProgression":[{"name":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"F7","voicing":[63,69],"voicingNames":["E♭4","A4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"F7","voicing":[63,69],"voicingNames":["E♭4","A4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"F7","voicing":[63,69],"voicingNames":["E♭4","A4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"G7","voicing":[65,71],"voicingNames":["F4","B4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"F7","voicing":[63,69],"voicingNames":["E♭4","A4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"G7","voicing":[65,71],"voicingNames":["F4","B4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"F7","voicing":[63,69],"voicingNames":["E♭4","A4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"F7","voicing":[63,69],"voicingNames":["E♭4","A4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"F7","voicing":[63,69],"voicingNames":["E♭4","A4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"G7","voicing":[65,71],"voicingNames":["F4","B4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"F7","voicing":[63,69],"voicingNames":["E♭4","A4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"keyFifths":0,"voicing_staves":[1,1]},{"name":"G7","voicing":[65,71],"voicingNames":["F4","B4"],"keyFifths":0,"voicing_staves":[1,1]}]}},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"コードは単体で覚えるだけでは足りん。","en":"Chords alone are not enough."},{"speaker":"fai","ja":"曲の流れの中で弾くんだね。","en":"We play them in the flow of a tune."},{"speaker":"jajii","ja":"そうじゃ。Cブルースの進行に合わせて、ゆっくり押してみよ。","en":"Aye. Play slowly along the C blues changes."},{"speaker":"fai","ja":"まずは速さより、順番を覚える！","en":"Order first — speed later!"},{"speaker":"jajii","ja":"うむ。C7、F7、G7がどこで出るか感じるのじゃ。","en":"Feel where C7, F7, and G7 appear."},{"speaker":"fai","ja":"Cブルースのコード進行を、ゆっくり弾こう。","en":"Let''s play the C blues changes slowly."}]},{"type":"progression_battle","contentRef":"mq-b1-q3-progression","loopCount":24,"introDelaySeconds":3,"dialogue":{"intro":{"ja":"ゆっくり、順番どおりに進むのじゃ。","en":"Take it slow and follow the order."},"onReveal":{"ja":"このコードを演奏！","en":"Play this chord!"},"onCorrectRemaining":{"ja":"OK、あと{{remaining}}問。","en":"OK, {{remaining}} left."}}},{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"よし。コードの流れが少し見えてきたのう。","en":"Good. The chord flow is coming into view."},{"speaker":"fai","ja":"C7、F7、G7が曲の中で動いてる感じがした！","en":"I felt C7, F7, and G7 moving through the tune!"},{"speaker":"jajii","ja":"次は、その流れを最初から最後まで通して聴くぞ。","en":"Next, hear that flow from start to finish."},{"speaker":"fai","ja":"Cブルースを1周通して弾こう。","en":"Let''s play through one chorus of C blues."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();


INSERT INTO public.ear_training_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b1-q3-voicing-v1',
  'MQ B1: Cブルース1周',
  'MQ B1: One chorus C blues',
  '{"version":1,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideLobby":true,"hideMidiToggle":true,"hidePhraseIntroQuota":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{"mq-b1-q3-voicing":{"stage":{"slug":"mq-b1-q3-voicing","title":"Cブルースを通して弾く","title_en":"Play through C blues","bpm":100,"key_fifths":0,"beats_per_measure":4,"beat_type":4,"loop_measures":24,"max_loops_per_phrase":2,"count_in_beats":0,"time_limit_sec":600,"player_hp":100,"enemy_hp":10000,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"chord_voicing","chord_voicing_self_paced":true,"show_keyboard_hints_in_battle":true},"phrases":[{"order_index":0,"title":"Cブルース 24小節","title_en":"C blues 24 bars","audio_url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM.mp3","loop_duration_sec":57.6,"audio_duration_sec":57.6,"note_count":0,"key_fifths":0,"chords":[{"order_index":0,"chord_name":"C7","measure_number":1,"beat_offset":1,"duration_beats":4,"start_time_sec":0,"end_time_sec":2.4,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":1,"chord_name":"F7","measure_number":2,"beat_offset":1,"duration_beats":4,"start_time_sec":2.4,"end_time_sec":4.8,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":2,"chord_name":"C7","measure_number":3,"beat_offset":1,"duration_beats":4,"start_time_sec":4.8,"end_time_sec":7.199999999999999,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":3,"chord_name":"C7","measure_number":4,"beat_offset":1,"duration_beats":4,"start_time_sec":7.199999999999999,"end_time_sec":9.6,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":4,"chord_name":"F7","measure_number":5,"beat_offset":1,"duration_beats":4,"start_time_sec":9.6,"end_time_sec":12,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":5,"chord_name":"F7","measure_number":6,"beat_offset":1,"duration_beats":4,"start_time_sec":12,"end_time_sec":14.4,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":6,"chord_name":"C7","measure_number":7,"beat_offset":1,"duration_beats":4,"start_time_sec":14.399999999999999,"end_time_sec":16.799999999999997,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":7,"chord_name":"C7","measure_number":8,"beat_offset":1,"duration_beats":4,"start_time_sec":16.8,"end_time_sec":19.2,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":8,"chord_name":"G7","measure_number":9,"beat_offset":1,"duration_beats":4,"start_time_sec":19.2,"end_time_sec":21.599999999999998,"voicing":["F4","B4"],"voicing_staves":[1,1]},{"order_index":9,"chord_name":"F7","measure_number":10,"beat_offset":1,"duration_beats":4,"start_time_sec":21.599999999999998,"end_time_sec":23.999999999999996,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":10,"chord_name":"C7","measure_number":11,"beat_offset":1,"duration_beats":4,"start_time_sec":24,"end_time_sec":26.4,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":11,"chord_name":"G7","measure_number":12,"beat_offset":1,"duration_beats":4,"start_time_sec":26.4,"end_time_sec":28.799999999999997,"voicing":["F4","B4"],"voicing_staves":[1,1]},{"order_index":12,"chord_name":"C7","measure_number":13,"beat_offset":1,"duration_beats":4,"start_time_sec":28.799999999999997,"end_time_sec":31.199999999999996,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":13,"chord_name":"F7","measure_number":14,"beat_offset":1,"duration_beats":4,"start_time_sec":31.2,"end_time_sec":33.6,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":14,"chord_name":"C7","measure_number":15,"beat_offset":1,"duration_beats":4,"start_time_sec":33.6,"end_time_sec":36,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":15,"chord_name":"C7","measure_number":16,"beat_offset":1,"duration_beats":4,"start_time_sec":36,"end_time_sec":38.4,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":16,"chord_name":"F7","measure_number":17,"beat_offset":1,"duration_beats":4,"start_time_sec":38.4,"end_time_sec":40.8,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":17,"chord_name":"F7","measure_number":18,"beat_offset":1,"duration_beats":4,"start_time_sec":40.8,"end_time_sec":43.199999999999996,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":18,"chord_name":"C7","measure_number":19,"beat_offset":1,"duration_beats":4,"start_time_sec":43.199999999999996,"end_time_sec":45.599999999999994,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":19,"chord_name":"C7","measure_number":20,"beat_offset":1,"duration_beats":4,"start_time_sec":45.6,"end_time_sec":48,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":20,"chord_name":"G7","measure_number":21,"beat_offset":1,"duration_beats":4,"start_time_sec":48,"end_time_sec":50.4,"voicing":["F4","B4"],"voicing_staves":[1,1]},{"order_index":21,"chord_name":"F7","measure_number":22,"beat_offset":1,"duration_beats":4,"start_time_sec":50.4,"end_time_sec":52.8,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":22,"chord_name":"C7","measure_number":23,"beat_offset":1,"duration_beats":4,"start_time_sec":52.8,"end_time_sec":55.199999999999996,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":23,"chord_name":"G7","measure_number":24,"beat_offset":1,"duration_beats":4,"start_time_sec":55.199999999999996,"end_time_sec":57.599999999999994,"voicing":["F4","B4"],"voicing_staves":[1,1]}]}]}},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"partner","ja":"ここではCブルースを通して進む。","en":"Here we move through the whole C blues."},{"speaker":"player","ja":"途中で止まらず、最後まで行くんだね。","en":"Don''t stop — go to the end."},{"speaker":"partner","ja":"うむ。完璧でなくてよい。流れを止めないことが大事じゃ。","en":"Aye. Perfection isn''t required. Keep the flow going."},{"speaker":"player","ja":"間違えても、次のコードに戻ればいいんだな。","en":"If I miss one, I just catch the next chord."},{"speaker":"partner","ja":"その意気じゃ。耳で聴きながら、手で追いかけよ。","en":"That''s the spirit. Listen and follow with your hands."},{"speaker":"player","ja":"Cブルースを1周、コードで通して弾こう。","en":"Play one chorus of C blues with the chord shapes."}]},{"type":"chord_voicing_self_paced","contentRef":"mq-b1-q3-voicing","requiredSuccessfulLoops":1,"dialogue":{}},{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"partner","ja":"よし。ブルースの形がつながってきた。","en":"Good. The blues shape is connecting."},{"speaker":"player","ja":"コードだけでも、曲っぽくなってきた！","en":"Even chords alone sound like a tune now!"},{"speaker":"partner","ja":"次はリズムじゃ。1拍目だけをねらって弾く。","en":"Next is rhythm — aim for beat one only."},{"speaker":"player","ja":"リズムに合わせて、1拍目だけコードを弾こう。","en":"Hit the chords on beat one with the groove."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();


INSERT INTO public.ear_training_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b1-q3-osmd-v1',
  'MQ B1: 1拍目リズム',
  'MQ B1: Beat-one rhythm',
  '{"version":1,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideLobby":true,"hideMidiToggle":true,"hidePhraseIntroQuota":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{"mq-b1-q3-osmd":{"stage":{"slug":"mq-b1-q3-osmd","title":"1拍目だけ弾く","title_en":"Hit beat one","bpm":100,"key_fifths":0,"beats_per_measure":4,"beat_type":4,"loop_measures":24,"max_loops_per_phrase":2,"count_in_beats":0,"time_limit_sec":600,"player_hp":100,"enemy_hp":10000,"per_correct_note_damage":10,"good_completion_damage":30,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"chord_osmd","show_keyboard_hints_in_battle":true},"phrases":[{"order_index":0,"title":"Cブルース・1拍目","title_en":"C blues beat one","music_xml_url":"https://jazzify-cdn.com/sozai/2-3.musicxml","audio_url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM.mp3","loop_duration_sec":57.6,"audio_duration_sec":57.6,"note_count":24,"key_fifths":0,"chords":[{"order_index":0,"chord_name":"C7","measure_number":1,"beat_offset":1,"duration_beats":4,"start_time_sec":0,"end_time_sec":2.4,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":1,"chord_name":"F7","measure_number":2,"beat_offset":1,"duration_beats":4,"start_time_sec":2.4,"end_time_sec":4.8,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":2,"chord_name":"C7","measure_number":3,"beat_offset":1,"duration_beats":4,"start_time_sec":4.8,"end_time_sec":7.199999999999999,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":3,"chord_name":"C7","measure_number":4,"beat_offset":1,"duration_beats":4,"start_time_sec":7.199999999999999,"end_time_sec":9.6,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":4,"chord_name":"F7","measure_number":5,"beat_offset":1,"duration_beats":4,"start_time_sec":9.6,"end_time_sec":12,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":5,"chord_name":"F7","measure_number":6,"beat_offset":1,"duration_beats":4,"start_time_sec":12,"end_time_sec":14.4,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":6,"chord_name":"C7","measure_number":7,"beat_offset":1,"duration_beats":4,"start_time_sec":14.399999999999999,"end_time_sec":16.799999999999997,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":7,"chord_name":"C7","measure_number":8,"beat_offset":1,"duration_beats":4,"start_time_sec":16.8,"end_time_sec":19.2,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":8,"chord_name":"G7","measure_number":9,"beat_offset":1,"duration_beats":4,"start_time_sec":19.2,"end_time_sec":21.599999999999998,"voicing":["F4","B4"],"voicing_staves":[1,1]},{"order_index":9,"chord_name":"F7","measure_number":10,"beat_offset":1,"duration_beats":4,"start_time_sec":21.599999999999998,"end_time_sec":23.999999999999996,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":10,"chord_name":"C7","measure_number":11,"beat_offset":1,"duration_beats":4,"start_time_sec":24,"end_time_sec":26.4,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":11,"chord_name":"G7","measure_number":12,"beat_offset":1,"duration_beats":4,"start_time_sec":26.4,"end_time_sec":28.799999999999997,"voicing":["F4","B4"],"voicing_staves":[1,1]},{"order_index":12,"chord_name":"C7","measure_number":13,"beat_offset":1,"duration_beats":4,"start_time_sec":28.799999999999997,"end_time_sec":31.199999999999996,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":13,"chord_name":"F7","measure_number":14,"beat_offset":1,"duration_beats":4,"start_time_sec":31.2,"end_time_sec":33.6,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":14,"chord_name":"C7","measure_number":15,"beat_offset":1,"duration_beats":4,"start_time_sec":33.6,"end_time_sec":36,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":15,"chord_name":"C7","measure_number":16,"beat_offset":1,"duration_beats":4,"start_time_sec":36,"end_time_sec":38.4,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":16,"chord_name":"F7","measure_number":17,"beat_offset":1,"duration_beats":4,"start_time_sec":38.4,"end_time_sec":40.8,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":17,"chord_name":"F7","measure_number":18,"beat_offset":1,"duration_beats":4,"start_time_sec":40.8,"end_time_sec":43.199999999999996,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":18,"chord_name":"C7","measure_number":19,"beat_offset":1,"duration_beats":4,"start_time_sec":43.199999999999996,"end_time_sec":45.599999999999994,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":19,"chord_name":"C7","measure_number":20,"beat_offset":1,"duration_beats":4,"start_time_sec":45.6,"end_time_sec":48,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":20,"chord_name":"G7","measure_number":21,"beat_offset":1,"duration_beats":4,"start_time_sec":48,"end_time_sec":50.4,"voicing":["F4","B4"],"voicing_staves":[1,1]},{"order_index":21,"chord_name":"F7","measure_number":22,"beat_offset":1,"duration_beats":4,"start_time_sec":50.4,"end_time_sec":52.8,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":22,"chord_name":"C7","measure_number":23,"beat_offset":1,"duration_beats":4,"start_time_sec":52.8,"end_time_sec":55.199999999999996,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":23,"chord_name":"G7","measure_number":24,"beat_offset":1,"duration_beats":4,"start_time_sec":55.199999999999996,"end_time_sec":57.599999999999994,"voicing":["F4","B4"],"voicing_staves":[1,1]}]}]}},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"partner","ja":"今度は、リズムに合わせる練習じゃ。","en":"Now we practice with the groove."},{"speaker":"player","ja":"全部弾くんじゃなくて、1拍目だけ？","en":"Not every beat — just beat one?"},{"speaker":"partner","ja":"そうじゃ。まずは小節の頭を感じる。","en":"Aye. Feel the top of each bar first."},{"speaker":"player","ja":"コードが変わる場所を、ちゃんと踏むんだね。","en":"Land where the chords change."},{"speaker":"partner","ja":"うむ。ジャズは音だけでなく、時間に乗る音楽じゃ。","en":"Jazz rides time, not just notes."},{"speaker":"player","ja":"リズムを聴いて、各小節の1拍目にコードを弾こう。","en":"Listen and hit each chord on beat one."}]},{"type":"chord_osmd","contentRef":"mq-b1-q3-osmd","requiredLoops":1,"timedLines":[{"at":{"loop":0,"measure":1,"beat":1},"text":{"ja":"1拍目","en":"Beat 1"}}]},{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"partner","ja":"見事じゃ。コードをリズムに乗せられたのう。","en":"Well done. You rode the rhythm with your chords."},{"speaker":"player","ja":"ただ押すより、音楽っぽくなった！","en":"It feels more musical than just pressing keys!"},{"speaker":"partner","ja":"これでCブルースの土台はできた。","en":"The foundation of C blues is in place."},{"speaker":"player","ja":"次はもっと自由に弾けそう！","en":"I feel ready to play more freely!"},{"speaker":"partner","ja":"うむ。響きとリズムの上で、アドリブは育つのじゃ。","en":"Aye. Ad-lib grows on harmony and rhythm."},{"speaker":"player","ja":"次のクエストへ進もう。","en":"On to the next quest."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();


-- ---------------------------------------------------------------------------
-- 1-2 アドリブ本編ステージ
-- ---------------------------------------------------------------------------
DELETE FROM public.ear_training_phrase_chords
WHERE phrase_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase');

DELETE FROM public.ear_training_phrases
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase');

DELETE FROM public.ear_training_stages
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-stage'),
  'mq-b1-q1-2-adlib',
  'ドとソでアドリブ',
  'Ad-lib with Do and Sol',
  'Cブルース上でドとソだけ自由に返す。聴く小節と返す小節が交互。',
  'Answer freely with Do and Sol on C blues. Listen and response bars alternate.',
  100, 0, 4, 4, 24, 8,
  0, 300, 100, 2500,
  50, 12, 18, 24,
  0, 0, 4, 8,
  'blue_club', true, false, 'adlib', true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-stage'),
  0,
  'Cブルース・ドとソアドリブ',
  'C blues Do/Sol adlib',
  NULL,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM.mp3',
  57.6,
  57.6,
  0,
  0
);

INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name, measure_number, beat_offset,
  duration_beats, start_time_sec, end_time_sec, voicing, voicing_staves, input_disabled
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    0,
    '—',
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    1,
    'C/G',
    2,
    1,
    4,
    2.4,
    4.8,
    ARRAY['C4', 'G4']::text[],
    ARRAY[1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c2'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    2,
    '—',
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c3'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    3,
    'C/G',
    4,
    1,
    4,
    7.199999999999999,
    9.6,
    ARRAY['C4', 'G4']::text[],
    ARRAY[1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c4'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    4,
    '—',
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c5'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    5,
    'C/G',
    6,
    1,
    4,
    12,
    14.4,
    ARRAY['C4', 'G4']::text[],
    ARRAY[1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c6'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    6,
    '—',
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c7'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    7,
    'C/G',
    8,
    1,
    4,
    16.8,
    19.2,
    ARRAY['C4', 'G4']::text[],
    ARRAY[1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c8'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    8,
    '—',
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c9'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    9,
    'C/G',
    10,
    1,
    4,
    21.599999999999998,
    23.999999999999996,
    ARRAY['C4', 'G4']::text[],
    ARRAY[1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c10'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    10,
    '—',
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c11'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    11,
    'C/G',
    12,
    1,
    4,
    26.4,
    28.799999999999997,
    ARRAY['C4', 'G4']::text[],
    ARRAY[1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c12'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    12,
    '—',
    13,
    1,
    4,
    28.799999999999997,
    31.199999999999996,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c13'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    13,
    'C/G',
    14,
    1,
    4,
    31.2,
    33.6,
    ARRAY['C4', 'G4']::text[],
    ARRAY[1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c14'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    14,
    '—',
    15,
    1,
    4,
    33.6,
    36,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c15'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    15,
    'C/G',
    16,
    1,
    4,
    36,
    38.4,
    ARRAY['C4', 'G4']::text[],
    ARRAY[1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c16'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    16,
    '—',
    17,
    1,
    4,
    38.4,
    40.8,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c17'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    17,
    'C/G',
    18,
    1,
    4,
    40.8,
    43.199999999999996,
    ARRAY['C4', 'G4']::text[],
    ARRAY[1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c18'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    18,
    '—',
    19,
    1,
    4,
    43.199999999999996,
    45.599999999999994,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c19'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    19,
    'C/G',
    20,
    1,
    4,
    45.6,
    48,
    ARRAY['C4', 'G4']::text[],
    ARRAY[1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c20'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    20,
    '—',
    21,
    1,
    4,
    48,
    50.4,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c21'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    21,
    'C/G',
    22,
    1,
    4,
    50.4,
    52.8,
    ARRAY['C4', 'G4']::text[],
    ARRAY[1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c22'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    22,
    '—',
    23,
    1,
    4,
    52.8,
    55.199999999999996,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c23'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    23,
    'C/G',
    24,
    1,
    4,
    55.199999999999996,
    57.599999999999994,
    ARRAY['C4', 'G4']::text[],
    ARRAY[1, 1]::smallint[],
    false
  );

-- ---------------------------------------------------------------------------
-- 2-2 コードラン（tutorial_3 マップ / C7⇔F7）
-- ---------------------------------------------------------------------------
INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, run_map_id, run_time_limit_sec, run_dialogue_script,
  production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'basic',
  182,
  'progression',
  'code_run',
  'MQ B1: C7/F7コードラン',
  'MQ B1: C7/F7 chord run',
  'easy',
  '',
  'C7 / F7',
  'C7 / F7',
  NULL,
  '',
  '',
  'code_run',
  false,
  NULL,
  '[{"name":"C7","voicing":[64,70],"voicing_names":["E4","B♭4"],"key_fifths":0,"voicing_staves":[1,1]},{"name":"F7","voicing":[63,69],"voicing_names":["E♭4","A4"],"key_fifths":0,"voicing_staves":[1,1]},{"name":"C7","voicing":[64,70],"voicing_names":["E4","B♭4"],"key_fifths":0,"voicing_staves":[1,1]},{"name":"F7","voicing":[63,69],"voicing_names":["E♭4","A4"],"key_fifths":0,"voicing_staves":[1,1]},{"name":"C7","voicing":[64,70],"voicing_names":["E4","B♭4"],"key_fifths":0,"voicing_staves":[1,1]},{"name":"F7","voicing":[63,69],"voicing_names":["E♭4","A4"],"key_fifths":0,"voicing_staves":[1,1]},{"name":"C7","voicing":[64,70],"voicing_names":["E4","B♭4"],"key_fifths":0,"voicing_staves":[1,1]},{"name":"F7","voicing":[63,69],"voicing_names":["E♭4","A4"],"key_fifths":0,"voicing_staves":[1,1]}]'::jsonb,
  true,
  'tutorial_3',
  120,
  '{"lines":[{"atSeconds":2,"speaker":"fai","text":"C7とF7を弾こう","textEn":"Let''s play C7 and F7."},{"atSeconds":8,"speaker":"jajii","text":"右に進むんじゃ","textEn":"Head to the right."},{"atSeconds":14,"speaker":"jajii","text":"2段ジャンプもできるぞ","textEn":"You can double-jump too."}]}'::jsonb,
  'always',
  'always'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  run_map_id = EXCLUDED.run_map_id,
  run_time_limit_sec = EXCLUDED.run_time_limit_sec,
  run_dialogue_script = EXCLUDED.run_dialogue_script,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 2-3 風船ラッシュ
-- ---------------------------------------------------------------------------
INSERT INTO public.balloon_rush_stages (
  id, slug, title, title_en, description, description_en,
  stage_type, chord_suffix, root_pattern, allowed_chords, chord_progression,
  time_limit_sec, pop_quota, balloon_lifetime_sec, max_concurrent, respawn_delay_sec,
  bgm_url, key_fifths, lesson_only, is_active,
  production_staff_hint_mode, production_keyboard_hint_mode, hide_chord_names_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-balloon-stage'),
  'mq-b1-balloon-c7f7g7',
  'MQ B1: G7を追加（風船）',
  'MQ B1: Add G7 (balloon)',
  'C7/F7/G7の2音コードをランダム出題。2分以内に15個。',
  'Random two-note C7/F7/G7. Pop 15 balloons within 2 minutes.',
  'random',
  '7',
  NULL,
  '["C7","F7","G7"]'::jsonb,
  NULL,
  120,
  15,
  10,
  5,
  3,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3',
  0,
  true,
  true,
  'always',
  'always',
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  stage_type = EXCLUDED.stage_type,
  chord_suffix = EXCLUDED.chord_suffix,
  root_pattern = EXCLUDED.root_pattern,
  time_limit_sec = EXCLUDED.time_limit_sec,
  pop_quota = EXCLUDED.pop_quota,
  bgm_url = EXCLUDED.bgm_url,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- クエスト（lessons）×3
-- ---------------------------------------------------------------------------
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'クエスト1：ドとソでジャズの返事をしよう',
  'Quest 1: Answer jazz with Do and Sol',
  'Cブルース入門。ドとソだけで聴いて返し、アドリブへ。',
  'C blues intro. Hear and answer with Do and Sol, then ad-lib.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1, 'テスト', 'Test',
  '[]'::jsonb,
  'ドとソでジャズの返事を覚えましょう。',
  'Learn to answer jazz with Do and Sol.'
FROM (SELECT MAX(order_index) AS max_o FROM public.lessons WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')) mx
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, title_en = EXCLUDED.title_en,
  description = EXCLUDED.description, description_en = EXCLUDED.description_en,
  assignment_description = EXCLUDED.assignment_description,
  assignment_description_en = EXCLUDED.assignment_description_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'クエスト2：コードの2音を覚える',
  'Quest 2: Learn two-note chords',
  'C7/F7/G7の2音コード、コードラン、風船ラッシュ。',
  'Two-note C7/F7/G7, chord run, and balloon rush.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1, 'テスト', 'Test',
  '[]'::jsonb,
  '2音でもコードの響きを覚えましょう。',
  'Learn chord color with just two notes.'
FROM (SELECT MAX(order_index) AS max_o FROM public.lessons WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')) mx
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, title_en = EXCLUDED.title_en,
  description = EXCLUDED.description, description_en = EXCLUDED.description_en,
  assignment_description = EXCLUDED.assignment_description,
  assignment_description_en = EXCLUDED.assignment_description_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q3-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'クエスト3：ブルースのコード進行に乗る',
  'Quest 3: Ride the blues changes',
  '進行をゆっくり押し、1周通して、1拍目リズムへ。',
  'Slow changes, one chorus, then beat-one rhythm.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1, 'テスト', 'Test',
  '[]'::jsonb,
  'Cブルースのコード進行に乗りましょう。',
  'Ride the C blues chord changes.'
FROM (SELECT MAX(order_index) AS max_o FROM public.lessons WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')) mx
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, title_en = EXCLUDED.title_en,
  description = EXCLUDED.description, description_en = EXCLUDED.description_en,
  assignment_description = EXCLUDED.assignment_description,
  assignment_description_en = EXCLUDED.assignment_description_en;

-- ---------------------------------------------------------------------------
-- 課題（lesson_songs）×8
-- ---------------------------------------------------------------------------
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-1-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL, false, NULL,
    true, 'mq-b1-q1-osmd-v1', false, NULL, false, NULL, NULL, NULL, NULL, NULL,
    '1-1. ドとソをまねしよう', '1-1. Copy Do and Sol'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-lesson'), NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-stage'),
    false, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL,
    '1-2. ドとソでアドリブしよう', '1-2. Ad-lib with Do and Sol'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-1-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL, false, NULL,
    false, NULL, true, 'mq-b1-q2-survival-v1', false, NULL, NULL, NULL, NULL, NULL,
    '2-1. 2音でもコードの響きになる', '2-1. Two notes make a chord'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-2-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-lesson'), NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, true, 182, 'basic', false, NULL,
    false, NULL, false, NULL, false, NULL,
    '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"}'::jsonb, NULL, 'always', 'always',
    '2-2. C7とF7でコードラン', '2-2. C7/F7 chord run'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-3-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-lesson'), NULL, 2,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL, false, NULL,
    false, NULL, false, NULL, true,
    (SELECT id FROM public.balloon_rush_stages WHERE slug = 'mq-b1-balloon-c7f7g7'),
    NULL,
    '[{"name":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"voicingStaves":[1,1],"keyFifths":0},{"name":"F7","voicing":[63,69],"voicingNames":["E♭4","A4"],"voicingStaves":[1,1],"keyFifths":0},{"name":"G7","voicing":[65,71],"voicingNames":["F4","B4"],"voicingStaves":[1,1],"keyFifths":0}]'::jsonb,
    'always', 'always',
    '2-3. G7を追加しよう', '2-3. Add G7'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q3-1-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q3-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL, false, NULL,
    false, NULL, true, 'mq-b1-q3-survival-v1', false, NULL, NULL, NULL, NULL, NULL,
    '3-1. コード進行をゆっくり押す', '3-1. Slow chord changes'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q3-2-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q3-lesson'), NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL, false, NULL,
    true, 'mq-b1-q3-voicing-v1', false, NULL, false, NULL, NULL, NULL, NULL, NULL,
    '3-2. Cブルースを通して弾く', '3-2. Play through C blues'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q3-3-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q3-lesson'), NULL, 2,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL, false, NULL,
    true, 'mq-b1-q3-osmd-v1', false, NULL, false, NULL, NULL, NULL, NULL, NULL,
    '3-3. リズムに合わせて1拍目だけ弾く', '3-3. Hit beat one'
  )
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_fantasy = EXCLUDED.is_fantasy,
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  is_ear_training_tutorial = EXCLUDED.is_ear_training_tutorial,
  ear_training_tutorial_script_id = EXCLUDED.ear_training_tutorial_script_id,
  is_survival_tutorial = EXCLUDED.is_survival_tutorial,
  survival_tutorial_script_id = EXCLUDED.survival_tutorial_script_id,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  survival_random_chords = EXCLUDED.survival_random_chords,
  override_production_staff_hint_mode = EXCLUDED.override_production_staff_hint_mode,
  override_production_keyboard_hint_mode = EXCLUDED.override_production_keyboard_hint_mode,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
