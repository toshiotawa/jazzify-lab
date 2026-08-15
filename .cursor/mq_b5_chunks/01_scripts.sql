-- メインクエスト Ch6（Fブルースに挑戦）
-- 生成: node scripts/generate-mq-block5-ch6-migration.mjs
-- 事前: node scripts/prepare-mq-b5-assets.mjs && node scripts/upload-sozai-main-quest-block5-r2.mjs
BEGIN;


INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b5-q1-0-v1',
  'MQ Ch6 Q1: C→Fブルース',
  'MQ Ch6 Q1: C to F blues',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenarioOverrides":{"hideStaffOnBSlotCompletion":false,"hideStaff":false},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"Cブルースから、Fブルースへ。キーが上がると、指の形も響きも変わるのじゃ。","en":"From C blues to F blues — a new key means new shapes and new colors."},{"speaker":"fai","ja":"Fブルース…新しい景色だね。","en":"F blues… a new landscape."},{"speaker":"jajii","ja":"まずは2音コードで、F7から始めよう。EbとA——Cブルースの感覚をFへ運ぶんじゃ。","en":"Start with two-note F7: Eb and A — carry your C blues feel into F."},{"speaker":"fai","ja":"キーが変わっても、聴いて返すやり方は同じだ！","en":"New key, same listen-and-answer approach!"}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.ear_training_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b5-q1-1-v1',
  'MQ Ch6 Q1: Fブルース入門',
  'MQ Ch6 Q1: F blues intro',
  '{"version":1,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideLobby":true,"hideMidiToggle":true,"hidePhraseIntroQuota":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{"mq-b5-6-1-2-osmd":{"stage":{"slug":"mq-b5-6-1-2-osmd","title":"Fブルース入門（2音）","title_en":"F blues intro (2 notes)","bpm":100,"key_fifths":-1,"beats_per_measure":4,"beat_type":4,"loop_measures":25,"max_loops_per_phrase":2,"count_in_beats":0,"time_limit_sec":600,"player_hp":100,"enemy_hp":38,"per_correct_note_damage":1,"good_completion_damage":30,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"chord_osmd","show_keyboard_hints_in_battle":true,"osmd_targets_from_score":true,"is_swing":true,"hammer_lead_measures":1},"phrases":[{"order_index":0,"title":"Fブルース入門（2音）","title_en":"F blues intro (2 notes)","music_xml_url":"https://jazzify-cdn.com/sozai/mq-b5-6-1-2-guide-voice4-cue.musicxml?v=202608121000","audio_url":"https://jazzify-cdn.com/sozai/mq-b5-6-1-2.mp3?v=202608121000","loop_duration_sec":60,"audio_duration_sec":60,"note_count":0,"key_fifths":-1}]}},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"Fブルースの最初の課題じゃ。譜面を見ながら、聴いて返そう。","en":"Your first F blues task — read the score, listen, and answer."},{"speaker":"fai","ja":"Voice4のキュー音符、頼りにするね。","en":"I will lean on the Voice4 cue notes."}]},{"type":"chord_osmd","contentRef":"mq-b5-6-1-2-osmd","requiredLoops":1},{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"よし。Fブルースの入口が開いたのう。","en":"Good — the door to F blues is open."},{"speaker":"fai","ja":"次はコードの種類を増やしていこう！","en":"Next, let us learn more chord types!"}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b5-q2-0-v1',
  'MQ Ch6 Q2: 5コード',
  'MQ Ch6 Q2: Five chords',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenarioOverrides":{"hideStaffOnBSlotCompletion":false,"hideStaff":false},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"Fブルースで使うコードは5種類じゃ。F7、Bb7、D7、Gm7、C7。","en":"Five chord types in F blues: F7, Bb7, D7, Gm7, and C7."},{"speaker":"fai","ja":"全部2音から始めるんだね。","en":"We start with two notes each."},{"speaker":"jajii","ja":"まずは2音ヴォイシングを体に入れる。コードラン、風船、クイズ、サバイバルで試すのじゃ。","en":"Lock in two-note voicings — then try Code Run, Balloon, Quiz, and Survival."},{"speaker":"fai","ja":"ゲーム感覚で覚えられそう！","en":"Sounds fun — I am in!"}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b5-q3-0-v1',
  'MQ Ch6 Q3: 3音',
  'MQ Ch6 Q3: Three notes',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenarioOverrides":{"hideStaffOnBSlotCompletion":false,"hideStaff":false},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"2音が安定したら、3音目を足す番じゃ。","en":"Once two notes feel steady, add a third."},{"speaker":"fai","ja":"響きが厚くなるけど、形は覚えやすい？","en":"Richer sound — but still learnable shapes?"},{"speaker":"jajii","ja":"うむ。最低音は変えず、上に1音足すだけ。頭拍で支える練習から始めよう。","en":"Aye — keep the bottom, add one note on top. Start with beat-one support."},{"speaker":"fai","ja":"3音版のサバイバルもあるんだね。","en":"There are three-note Survival modes too."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b5-q4-0-v1',
  'MQ Ch6 Q4: 4パターン',
  'MQ Ch6 Q4: Four patterns',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenarioOverrides":{"hideStaffOnBSlotCompletion":false,"hideStaff":false},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"ここから4つのリズムパターンに挑む。頭拍、裏拍…形は違ってもコードは同じ5つじゃ。","en":"Four rhythm patterns ahead — different placements, same five chords."},{"speaker":"fai","ja":"リズムが変わると、手が迷いそう…","en":"New rhythms might trip me up…"},{"speaker":"jajii","ja":"焦るな。パターン6はまとめじゃ。難しければ飛ばしてよい、おまけもあるぞ。","en":"No rush. Pattern 6 is the summary — skip extras if needed."},{"speaker":"fai","ja":"4パターン、順番にいこう！","en":"Four patterns — one at a time!"}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b5-q5-0-v1',
  'MQ Ch6 Q5: アドリブ導入',
  'MQ Ch6 Q5: Ad-lib intro',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenarioOverrides":{"hideStaffOnBSlotCompletion":false,"hideStaff":false},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"コンピングが動けるようになった。次はアドリブじゃ。","en":"Your comping is moving — time for ad-lib."},{"speaker":"fai","ja":"アドリブ2と3…段階的に難しくなる？","en":"Ad-lib 2 and 3… step by step?"},{"speaker":"jajii","ja":"そうじゃ。2音で返し、3つ目の課題ではF・Ab・BbとC・Eb・Fを組み合わせる。","en":"Aye — answer in two notes, then combine F Ab Bb with C Eb F."},{"speaker":"fai","ja":"自由に返すの、ちょっとワクワクする！","en":"Answering freely — exciting!"}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.ear_training_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b5-q5-4-v1',
  'MQ Ch6 Q5: 3音セット',
  'MQ Ch6 Q5: Three-note sets',
  '{"version":1,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideLobby":true,"hideMidiToggle":true,"hidePhraseIntroQuota":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{"mq-b5-6-5-4-osmd":{"stage":{"slug":"mq-b5-6-5-4-osmd","title":"アドリブ4（まとめ）","title_en":"Ad-lib 4 (summary)","bpm":100,"key_fifths":-1,"beats_per_measure":4,"beat_type":4,"loop_measures":25,"max_loops_per_phrase":2,"count_in_beats":0,"time_limit_sec":600,"player_hp":100,"enemy_hp":64,"per_correct_note_damage":1,"good_completion_damage":30,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"chord_osmd","show_keyboard_hints_in_battle":true,"osmd_targets_from_score":true,"is_swing":true,"hammer_lead_measures":1},"phrases":[{"order_index":0,"title":"アドリブ4（まとめ）","title_en":"Ad-lib 4 (summary)","music_xml_url":"https://jazzify-cdn.com/sozai/mq-b5-6-5-4-guide-voice4-cue.musicxml?v=202608121000","audio_url":"https://jazzify-cdn.com/sozai/mq-b5-6-5-4.mp3?v=202608121000","loop_duration_sec":60,"audio_duration_sec":60,"note_count":0,"key_fifths":-1}]}},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"F・Ab・Bb と C・Eb・F。2つの3音セットを行き来するんじゃ。","en":"F Ab Bb and C Eb F — move between these two three-note sets."},{"speaker":"fai","ja":"セットを切り替える感覚、練習してみる！","en":"I will practice switching between the sets!"}]},{"type":"chord_osmd","contentRef":"mq-b5-6-5-4-osmd","requiredLoops":1},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b5-q5-5-v1',
  'MQ Ch6 Q5: まとめ',
  'MQ Ch6 Q5: Summary',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenarioOverrides":{"hideStaffOnBSlotCompletion":false,"hideStaff":false},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"アドリブの入り口まで来たのう。次はペンタトニックで色を足す。","en":"You reached the ad-lib gateway — next, color with pentatonic."},{"speaker":"fai","ja":"2音コードの上に、メロディを乗せていく感じだね。","en":"Like laying melody over two-note chords."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.ear_training_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b5-q6-1-v1',
  'MQ Ch6 Q6: Fペンタトニック',
  'MQ Ch6 Q6: F pentatonic',
  '{"version":1,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideLobby":true,"hideMidiToggle":true,"hidePhraseIntroQuota":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{"mq-b5-6-6-1-osmd":{"stage":{"slug":"mq-b5-6-6-1-osmd","title":"Fペンタトニック","title_en":"F pentatonic","bpm":60,"key_fifths":-1,"beats_per_measure":4,"beat_type":4,"loop_measures":25,"max_loops_per_phrase":2,"count_in_beats":0,"time_limit_sec":600,"player_hp":100,"enemy_hp":10000,"per_correct_note_damage":10,"good_completion_damage":30,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"chord_osmd","show_keyboard_hints_in_battle":true,"osmd_targets_from_score":true,"is_swing":false,"hammer_lead_measures":1},"phrases":[{"order_index":0,"title":"Fペンタトニック","title_en":"F pentatonic","music_xml_url":"https://jazzify-cdn.com/sozai/mq-b5-6-6-1-guide-voice4-cue.musicxml?v=202608121000","audio_url":"https://jazzify-cdn.com/sozai/mq-b5-6-6-1.mp3?v=202608121000","loop_duration_sec":100,"audio_duration_sec":100,"note_count":0,"key_fifths":-1}]}},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"Fペンタトニックじゃ。60BPM、ストレートでゆっくり確かめる。","en":"F pentatonic — 60 BPM, straight feel, take it slow."},{"speaker":"fai","ja":"5つの音だけ…シンプルだけど奥深いね。","en":"Only five notes — simple yet deep."}]},{"type":"chord_osmd","contentRef":"mq-b5-6-6-1-osmd","requiredLoops":1},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b5-q7-0-v1',
  'MQ Ch6 Q7: ブルーノート',
  'MQ Ch6 Q7: Blue notes',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenarioOverrides":{"hideStaffOnBSlotCompletion":false,"hideStaff":false},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"ブルーノートを使うと、ジャズらしい「色」が出る。","en":"Blue notes add that jazz color."},{"speaker":"fai","ja":"ペンタトニックに、あえて半音ずらすやつ？","en":"Pentatonic notes bent by a half step?"},{"speaker":"jajii","ja":"その通り。まずは譜面通り、次に精密モードで自分の耳を確かめよう。","en":"Exactly. Play from the score first, then test your ear in precision mode."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b5-q8-0-v1',
  'MQ Ch6 Q8: フレーズ',
  'MQ Ch6 Q8: Phrases',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenarioOverrides":{"hideStaffOnBSlotCompletion":false,"hideStaff":false},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"フレーズの中で Bb から B へ——指を横に滑らせる「スライド」の感覚じゃ。","en":"In a phrase, slide from Bb to B — a lateral finger glide."},{"speaker":"fai","ja":"1フレット分の動きだけど、ニュアンスが変わるんだね。","en":"One fret — but the feel changes."},{"speaker":"jajii","ja":"精密モードで3つのフレーズに挑戦。全部クリア必須ではないぞ。","en":"Three precision phrases — clearing all is optional."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b5-q9-0-v1',
  'MQ Ch6 Q9: サバイバル・フレーズ',
  'MQ Ch6 Q9: Survival phrases',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenarioOverrides":{"hideStaffOnBSlotCompletion":false,"hideStaff":false},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"サバイバルで「フレーズ」を弾く番じゃ。1小節ずつ、5つの型を覚える。","en":"Time for Survival phrases — five one-bar shapes."},{"speaker":"fai","ja":"ループBGMに合わせて、同じ型を繰り返すんだね。","en":"Loop BGM, repeat the same shape."},{"speaker":"jajii","ja":"うむ。譜面の音符どおりに、低音から形を押さえるんじゃ。","en":"Aye — read the notes and anchor the shape from the bottom."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b5-q10-0-v1',
  'MQ Ch6 Q10: 章まとめ',
  'MQ Ch6 Q10: Chapter summary',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenarioOverrides":{"hideStaffOnBSlotCompletion":false,"hideStaff":false},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"Fブルースの旅、ここまでよく走ったのう。","en":"You ran the F blues road well."},{"speaker":"fai","ja":"2音から3音、コンピング、アドリブ、フレーズ…長かった！","en":"Two notes to three, comping, ad-lib, phrases — quite a journey!"},{"speaker":"jajii","ja":"最後の精密モードは総仕上げじゃ。余裕があれば挑戦して、なければ次章へ進むのもよい。","en":"The final precision is a capstone — try it if ready, or move on."},{"speaker":"fai","ja":"Fブルース、だいぶ自分のものになった気がする！","en":"F blues is starting to feel like mine!"}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();
