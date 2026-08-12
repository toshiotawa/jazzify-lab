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


DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-1-2-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-1-2-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-1-2-stage'),
  'mq-b5-6-1-2-osmd',
  'Fブルース入門（2音）',
  'F blues intro (2 notes)',
  'Fブルースでコール＆レスポンス。',
  'Call and response on the F blues.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 38,
  1, 0, 0, 0,
  9, 14, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-1-2-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-1-2-stage'),
  0,
  'Fブルース入門（2音）',
  'F blues intro (2 notes)',
  'https://jazzify-cdn.com/sozai/mq-b5-6-1-2-guide-voice4-cue.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-1-2.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-2-6-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-2-6-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-2-6-stage'),
  'mq-b5-6-2-6-osmd',
  '2音・頭拍パターン',
  'Two-note head-beat pattern',
  'F7〜C7の2音コードを頭拍で。',
  'Two-note chords on beat one.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 56,
  1, 0, 0, 0,
  6, 9, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-2-6-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-2-6-stage'),
  0,
  '2音・頭拍パターン',
  'Two-note head-beat pattern',
  'https://jazzify-cdn.com/sozai/mq-b5-6-2-6.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-karaoke.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-3-6-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-3-6-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-3-6-stage'),
  'mq-b5-6-3-6-osmd',
  '3音・頭拍パターン',
  'Three-note head-beat pattern',
  '3音ヴォイシングで頭拍を支える。',
  'Support beat one with three-note voicings.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 84,
  1, 0, 0, 0,
  4, 6, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-3-6-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-3-6-stage'),
  0,
  '3音・頭拍パターン',
  'Three-note head-beat pattern',
  'https://jazzify-cdn.com/sozai/mq-b5-6-3-6.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-karaoke.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-2-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-2-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-2-stage'),
  'mq-b5-6-4-2-osmd',
  'パターン2（3音・頭拍）',
  'Pattern 2 (3-note head beat)',
  '6-3-6 と同じ譜面・音源。',
  'Same score and audio as 6-3-6.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 84,
  1, 0, 0, 0,
  4, 6, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-2-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-2-stage'),
  0,
  'パターン2（3音・頭拍）',
  'Pattern 2 (3-note head beat)',
  'https://jazzify-cdn.com/sozai/mq-b5-6-3-6.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-karaoke.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-3-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-3-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-3-stage'),
  'mq-b5-6-4-3-osmd',
  'パターン3',
  'Pattern 3',
  '4つのリズムパターンの3つ目。',
  'Third of four rhythm patterns.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 147,
  1, 0, 0, 0,
  2, 3, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-3-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-3-stage'),
  0,
  'パターン3',
  'Pattern 3',
  'https://jazzify-cdn.com/sozai/mq-b5-6-4-3.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-4-3.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-4-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-4-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-4-stage'),
  'mq-b5-6-4-4-osmd',
  'パターン4',
  'Pattern 4',
  '4つのリズムパターンの4つ目。',
  'Fourth of four rhythm patterns.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 144,
  1, 0, 0, 0,
  2, 3, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-4-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-4-stage'),
  0,
  'パターン4',
  'Pattern 4',
  'https://jazzify-cdn.com/sozai/mq-b5-6-4-4.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-4-4.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-5-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-5-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-5-stage'),
  'mq-b5-6-4-5-osmd',
  'パターン5',
  'Pattern 5',
  '4つのリズムパターンの5つ目。',
  'Fifth rhythm pattern.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 148,
  1, 0, 0, 0,
  2, 3, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-5-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-5-stage'),
  0,
  'パターン5',
  'Pattern 5',
  'https://jazzify-cdn.com/sozai/mq-b5-6-4-5.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-4-5.mp3?v=202608121000',
  60.048,
  60.048,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-6-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-6-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-6-stage'),
  'mq-b5-6-4-6-osmd',
  'パターン6（まとめ）',
  'Pattern 6 (summary)',
  '4パターンのまとめ（クリア必須ではない）。',
  'Summary of four patterns (optional clear).',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 185,
  1, 0, 0, 0,
  2, 3, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-6-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-6-stage'),
  0,
  'パターン6（まとめ）',
  'Pattern 6 (summary)',
  'https://jazzify-cdn.com/sozai/mq-b5-6-4-6-guide-voice4-cue.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-4-3.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-2-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-2-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-2-stage'),
  'mq-b5-6-5-2-osmd',
  'アドリブ2（2音）',
  'Ad-lib 2 (2 notes)',
  '2音コードでアドリブに挑戦。',
  'Ad-lib with two-note voicings.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 43,
  1, 0, 0, 0,
  8, 12, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-2-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-2-stage'),
  0,
  'アドリブ2（2音）',
  'Ad-lib 2 (2 notes)',
  'https://jazzify-cdn.com/sozai/mq-b5-6-5-2-guide-voice4-cue.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-5-2.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-3-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-3-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-3-stage'),
  'mq-b5-6-5-3-osmd',
  'アドリブ3（2音）',
  'Ad-lib 3 (2 notes)',
  '聴いて返すアドリブ。',
  'Listen-and-answer ad-lib.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 43,
  1, 0, 0, 0,
  8, 12, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-3-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-3-stage'),
  0,
  'アドリブ3（2音）',
  'Ad-lib 3 (2 notes)',
  'https://jazzify-cdn.com/sozai/mq-b5-6-5-3-guide-voice4-cue.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-5-3.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-4-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-4-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-4-stage'),
  'mq-b5-6-5-4-osmd',
  'アドリブ4（まとめ）',
  'Ad-lib 4 (summary)',
  'F・Ab・Bb / C・Eb・F の組み合わせ。',
  'Combine F Ab Bb and C Eb F.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 64,
  1, 0, 0, 0,
  5, 8, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-4-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-4-stage'),
  0,
  'アドリブ4（まとめ）',
  'Ad-lib 4 (summary)',
  'https://jazzify-cdn.com/sozai/mq-b5-6-5-4-guide-voice4-cue.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-5-4.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-6-2-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-6-2-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-6-2-stage'),
  'mq-b5-6-6-2-osmd',
  'ペンタトニック実戦',
  'Pentatonic in action',
  '80BPMスウィングでペンタトニック。',
  'Pentatonic at 80 BPM swing.',
  80, -1, 4, 4, 25, 2,
  0, 600, 100, 64,
  1, 0, 0, 0,
  5, 8, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-6-2-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-6-2-stage'),
  0,
  'ペンタトニック実戦',
  'Pentatonic in action',
  'https://jazzify-cdn.com/sozai/mq-b5-6-6-2-guide-voice4-cue.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-6-2.mp3?v=202608121000',
  75.048,
  75.048,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-2-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-2-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-2-stage'),
  'mq-b5-6-7-2-osmd',
  'ブルーノート・スケール',
  'Blue-note scale',
  'ブルーノートを使ったフレーズ。',
  'Phrases using blue notes.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 76,
  1, 0, 0, 0,
  4, 6, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-2-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-2-stage'),
  0,
  'ブルーノート・スケール',
  'Blue-note scale',
  'https://jazzify-cdn.com/sozai/mq-b5-6-7-2-guide-voice4-cue.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-7-2.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-3-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-3-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-3-stage'),
  'mq-b5-6-7-3-precision',
  'ブルーノート・精密',
  'Blue notes · Precision',
  '7-2 の精密モード。',
  'Precision version of 7-2.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 1,
  0, 0, 0, 0,
  0, 0, 4, 8,
  'blue_club', true, false, 'chord_precision',
  false, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-3-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-3-stage'),
  0,
  'ブルーノート・精密',
  'Blue notes · Precision',
  'https://jazzify-cdn.com/sozai/mq-b5-6-7-2-precision.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-7-2.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-2-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-2-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-2-stage'),
  'mq-b5-6-8-2-precision',
  'フレーズ1・精密',
  'Phrase 1 · Precision',
  '精密モード（クリア必須ではない）。',
  'Precision mode (optional clear).',
  80, -1, 4, 4, 25, 2,
  0, 600, 100, 1,
  0, 0, 0, 0,
  0, 0, 4, 8,
  'blue_club', true, false, 'chord_precision',
  false, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-2-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-2-stage'),
  0,
  'フレーズ1・精密',
  'Phrase 1 · Precision',
  'https://jazzify-cdn.com/sozai/mq-b5-6-8-2-precision.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-8-2.mp3?v=202608121000',
  75.048,
  75.048,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-3-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-3-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-3-stage'),
  'mq-b5-6-8-3-precision',
  'フレーズ2・精密',
  'Phrase 2 · Precision',
  '精密モード（クリア必須ではない）。',
  'Precision mode (optional clear).',
  80, -1, 4, 4, 25, 2,
  0, 600, 100, 1,
  0, 0, 0, 0,
  0, 0, 4, 8,
  'blue_club', true, false, 'chord_precision',
  false, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-3-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-3-stage'),
  0,
  'フレーズ2・精密',
  'Phrase 2 · Precision',
  'https://jazzify-cdn.com/sozai/mq-b5-6-8-3-precision.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-8-3.mp3?v=202608121000',
  75.048,
  75.048,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-4-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-4-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-4-stage'),
  'mq-b5-6-8-4-precision',
  'フレーズ3・精密',
  'Phrase 3 · Precision',
  '精密モード（クリア必須ではない）。',
  'Precision mode (optional clear).',
  80, -1, 4, 4, 25, 2,
  0, 600, 100, 1,
  0, 0, 0, 0,
  0, 0, 4, 8,
  'blue_club', true, false, 'chord_precision',
  false, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-4-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-4-stage'),
  0,
  'フレーズ3・精密',
  'Phrase 3 · Precision',
  'https://jazzify-cdn.com/sozai/mq-b5-6-8-4-precision.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-8-4.mp3?v=202608121000',
  75.048,
  75.048,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-10-2-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-10-2-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-10-2-stage'),
  'mq-b5-6-10-2-precision',
  'Fブルース総仕上げ・精密',
  'F blues finale · Precision',
  '章の総仕上げ（クリア必須ではない）。',
  'Chapter finale (optional clear).',
  80, -1, 4, 4, 25, 2,
  0, 600, 100, 1,
  0, 0, 0, 0,
  0, 0, 4, 8,
  'blue_club', true, false, 'chord_precision',
  false, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-10-2-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-10-2-stage'),
  0,
  'Fブルース総仕上げ・精密',
  'F blues finale · Precision',
  'https://jazzify-cdn.com/sozai/mq-b5-6-10-2-precision.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-10-2.mp3?v=202608121000',
  75.048,
  75.048,
  0,
  -1
);


INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, run_map_id, run_time_limit_sec, run_dialogue_script
) VALUES (
  'lesson', 1301, 'random', 'code_run',
  'MQ Ch6: Fブルース コードラン（2音）', 'MQ Ch6: F blues Code Run (2v)', 'easy',
  '7', 'F7 / Bb7 / D7 / Gm7 / C7', 'F7 / Bb7 / D7 / Gm7 / C7',
  NULL, NULL, NULL,
  'mq-b5-ch6', false, NULL, NULL,
  true, 'always', 'always', 'tutorial_3', 120, '{"lines":[{"atSeconds":2,"speaker":"fai","text":"Fブルースのコードを弾きながら進む！","textEn":"Play F blues chords and run!"},{"atSeconds":8,"speaker":"jajii","text":"2音でも形を覚えれば、自然にヴォイシングが身につく。","textEn":"Two-note shapes build voicing naturally."},{"atSeconds":16,"speaker":"jajii","text":"右端の旗まで進むんじゃ。","textEn":"Head for the flag on the right."}]}'::jsonb
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  run_map_id = EXCLUDED.run_map_id,
  run_time_limit_sec = EXCLUDED.run_time_limit_sec,
  run_dialogue_script = EXCLUDED.run_dialogue_script,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1302, 'random', 'survival',
  'MQ Ch6: Fブルース サバイバル（2音）', 'MQ Ch6: F blues Survival (2v)', 'easy',
  '7', 'F7 / Bb7 / D7 / Gm7 / C7', 'F7 / Bb7 / D7 / Gm7 / C7',
  NULL, NULL, NULL,
  'mq-b5-ch6', false, NULL, NULL,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, run_map_id, run_time_limit_sec, run_dialogue_script
) VALUES (
  'lesson', 1311, 'random', 'code_run',
  'MQ Ch6: Fブルース コードラン（3音）', 'MQ Ch6: F blues Code Run (3v)', 'easy',
  '7', 'F7 / Bb7 / D7 / Gm7 / C7', 'F7 / Bb7 / D7 / Gm7 / C7',
  NULL, NULL, NULL,
  'mq-b5-ch6', false, NULL, NULL,
  true, 'always', 'always', 'tutorial_3', 120, '{"lines":[{"atSeconds":2,"speaker":"fai","text":"Fブルースのコードを弾きながら進む！","textEn":"Play F blues chords and run!"},{"atSeconds":8,"speaker":"jajii","text":"2音でも形を覚えれば、自然にヴォイシングが身につく。","textEn":"Two-note shapes build voicing naturally."},{"atSeconds":16,"speaker":"jajii","text":"右端の旗まで進むんじゃ。","textEn":"Head for the flag on the right."}]}'::jsonb
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  run_map_id = EXCLUDED.run_map_id,
  run_time_limit_sec = EXCLUDED.run_time_limit_sec,
  run_dialogue_script = EXCLUDED.run_dialogue_script,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1312, 'random', 'survival',
  'MQ Ch6: Fブルース サバイバル（3音）', 'MQ Ch6: F blues Survival (3v)', 'easy',
  '7', 'F7 / Bb7 / D7 / Gm7 / C7', 'F7 / Bb7 / D7 / Gm7 / C7',
  NULL, NULL, NULL,
  'mq-b5-ch6', false, NULL, NULL,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();


INSERT INTO public.balloon_rush_stages (
  id, slug, title, title_en, description, description_en,
  stage_type, chord_suffix, root_pattern, allowed_chords, chord_progression,
  time_limit_sec, pop_quota, balloon_lifetime_sec, max_concurrent, respawn_delay_sec,
  bgm_url, key_fifths, lesson_only, is_active,
  production_staff_hint_mode, production_keyboard_hint_mode, hide_chord_names_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-balloon-2v'),
  'mq-b5-balloon-2v',
  'MQ Ch6: Fブルース 風船（2音）',
  'MQ Ch6: F blues balloon (2v)',
  'F7/Bb7/D7/Gm7/C7をランダム出題。90秒以内に20個。',
  'Random F7/Bb7/D7/Gm7/C7. Pop 20 balloons within 90 seconds.',
  'random', '7', NULL,
  '["F7","Bb7","D7","Gm7","C7"]'::jsonb,
  NULL,
  90, 20, 10, 5, 3,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3', -1, true, true,
  'fade_15s', 'fade_15s', false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  time_limit_sec = EXCLUDED.time_limit_sec,
  pop_quota = EXCLUDED.pop_quota,
  allowed_chords = EXCLUDED.allowed_chords,
  bgm_url = EXCLUDED.bgm_url,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.balloon_rush_stages (
  id, slug, title, title_en, description, description_en,
  stage_type, chord_suffix, root_pattern, allowed_chords, chord_progression,
  time_limit_sec, pop_quota, balloon_lifetime_sec, max_concurrent, respawn_delay_sec,
  bgm_url, key_fifths, lesson_only, is_active,
  production_staff_hint_mode, production_keyboard_hint_mode, hide_chord_names_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-balloon-3v'),
  'mq-b5-balloon-3v',
  'MQ Ch6: Fブルース 風船（3音）',
  'MQ Ch6: F blues balloon (3v)',
  'F7/Bb7/D7/Gm7/C7をランダム出題。90秒以内に20個。',
  'Random F7/Bb7/D7/Gm7/C7. Pop 20 balloons within 90 seconds.',
  'random', '7', NULL,
  '["F7","Bb7","D7","Gm7","C7"]'::jsonb,
  NULL,
  90, 20, 10, 5, 3,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3', -1, true, true,
  'fade_15s', 'fade_15s', false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  time_limit_sec = EXCLUDED.time_limit_sec,
  pop_quota = EXCLUDED.pop_quota,
  allowed_chords = EXCLUDED.allowed_chords,
  bgm_url = EXCLUDED.bgm_url,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();


DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-stage');

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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-stage'),
  'mq-b5-quiz-2v',
  'MQ Ch6: Fブルース クイズ（2音）',
  'MQ Ch6: F blues quiz (2v)',
  '40秒以内に20問正解。Fブルースの2音ヴォイシング。',
  'Answer 20 questions within 40 seconds using 2-note F blues voicings.',
  100, -1, 4, 4, 5, 6,
  0, 40, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  40, 'random', true, false, 20, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-stage'),
  0, 1, 1, 4,
  'F7',
  ARRAY['Eb3', 'A3']::text[],
  ARRAY[2, 2]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-stage'),
  1, 2, 1, 4,
  'Bb7',
  ARRAY['D3', 'Ab3']::text[],
  ARRAY[2, 2]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-stage'),
  2, 3, 1, 4,
  'D7',
  ARRAY['Gb3', 'C4']::text[],
  ARRAY[2, 2]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-stage'),
  3, 4, 1, 4,
  'Gm7',
  ARRAY['F3', 'Bb3']::text[],
  ARRAY[2, 2]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-stage'),
  4, 5, 1, 4,
  'C7',
  ARRAY['E3', 'Bb3']::text[],
  ARRAY[2, 2]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-stage');

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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-stage'),
  'mq-b5-quiz-3v',
  'MQ Ch6: Fブルース クイズ（3音）',
  'MQ Ch6: F blues quiz (3v)',
  '40秒以内に20問正解。Fブルースの3音ヴォイシング。',
  'Answer 20 questions within 40 seconds using 3-note F blues voicings.',
  100, -1, 4, 4, 5, 6,
  0, 40, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  40, 'random', true, false, 20, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-stage'),
  0, 1, 1, 4,
  'F7',
  ARRAY['Eb3', 'A3', 'D4']::text[],
  ARRAY[2, 2, 2]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-stage'),
  1, 2, 1, 4,
  'Bb7',
  ARRAY['D3', 'Ab3', 'C4']::text[],
  ARRAY[2, 2, 2]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-stage'),
  2, 3, 1, 4,
  'D7',
  ARRAY['Gb3', 'C4', 'Eb4']::text[],
  ARRAY[2, 2, 2]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-stage'),
  3, 4, 1, 4,
  'Gm7',
  ARRAY['F3', 'Bb3', 'D4']::text[],
  ARRAY[2, 2, 2]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-stage'),
  4, 5, 1, 4,
  'C7',
  ARRAY['E3', 'Bb3', 'D4']::text[],
  ARRAY[2, 2, 2]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();


DELETE FROM public.survival_phrase_chord_notes
WHERE chord_id IN (
  SELECT c.id FROM public.survival_phrase_chords c
  JOIN public.survival_phrases p ON p.id = c.phrase_id
  WHERE p.map_category = 'phrases' AND p.stage_number BETWEEN 501 AND 505
);

DELETE FROM public.survival_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.survival_phrases
  WHERE map_category = 'phrases' AND stage_number BETWEEN 501 AND 505
);

DELETE FROM public.survival_phrases
WHERE map_category = 'phrases' AND stage_number BETWEEN 501 AND 505;


INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'phrases', 501, 'progression',
  'MQ Ch6 フレーズ I', 'MQ Ch6 Phrase I', 'easy',
  '', 'F7', 'F7',
  NULL, NULL, NULL,
  'mq-b5-ch6-phrases', false, NULL, NULL,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'phrases', 502, 'progression',
  'MQ Ch6 フレーズ II', 'MQ Ch6 Phrase II', 'easy',
  '', 'Bb7', 'Bb7',
  NULL, NULL, NULL,
  'mq-b5-ch6-phrases', false, NULL, NULL,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'phrases', 503, 'progression',
  'MQ Ch6 フレーズ III', 'MQ Ch6 Phrase III', 'easy',
  '', 'F7', 'F7',
  NULL, NULL, NULL,
  'mq-b5-ch6-phrases', false, NULL, NULL,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'phrases', 504, 'progression',
  'MQ Ch6 フレーズ IV', 'MQ Ch6 Phrase IV', 'easy',
  '', 'Gm7', 'Gm7',
  NULL, NULL, NULL,
  'mq-b5-ch6-phrases', false, NULL, NULL,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'phrases', 505, 'progression',
  'MQ Ch6 フレーズ V', 'MQ Ch6 Phrase V', 'easy',
  '', 'C7', 'C7',
  NULL, NULL, NULL,
  'mq-b5-ch6-phrases', false, NULL, NULL,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases', 501,
  'MQ Ch6 Phrase I',
  'https://jazzify-cdn.com/sozai/mq-b5-6-9-1-loop.mp3?v=202608121000',
  -1
);

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases', 502,
  'MQ Ch6 Phrase II',
  'https://jazzify-cdn.com/sozai/mq-b5-6-9-2-loop.mp3?v=202608121000',
  -1
);

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases', 503,
  'MQ Ch6 Phrase III',
  'https://jazzify-cdn.com/sozai/mq-b5-6-9-3-loop.mp3?v=202608121000',
  -1
);

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases', 504,
  'MQ Ch6 Phrase IV',
  'https://jazzify-cdn.com/sozai/mq-b5-6-9-4-loop.mp3?v=202608121000',
  -1
);

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases', 505,
  'MQ Ch6 Phrase V',
  'https://jazzify-cdn.com/sozai/mq-b5-6-9-5-loop.mp3?v=202608121000',
  -1
);
DO $$
DECLARE
  v_phrase_501 uuid;
  v_phrase_502 uuid;
  v_phrase_503 uuid;
  v_phrase_504 uuid;
  v_phrase_505 uuid;
  v_chord_501 uuid;
  v_chord_502 uuid;
  v_chord_503 uuid;
  v_chord_504 uuid;
  v_chord_505 uuid;
BEGIN
  SELECT id INTO v_phrase_501 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 501;
  SELECT id INTO v_phrase_502 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 502;
  SELECT id INTO v_phrase_503 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 503;
  SELECT id INTO v_phrase_504 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 504;
  SELECT id INTO v_phrase_505 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 505;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_501, 0, 'F7', 1)
  RETURNING id INTO v_chord_501;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index) VALUES
    (v_chord_501, 0, 71, 11, 'B4', 2, 0),
    (v_chord_501, 1, 72, 0, 'C5', 2, 1),
    (v_chord_501, 2, 77, 5, 'F5', 2, 2),
    (v_chord_501, 3, 75, 3, 'Eb5', 2, 3),
    (v_chord_501, 4, 72, 0, 'C5', 2, 4),
    (v_chord_501, 5, 71, 11, 'B4', 2, 5),
    (v_chord_501, 6, 70, 10, 'Bb4', 2, 6),
    (v_chord_501, 7, 68, 8, 'Ab4', 2, 7),
    (v_chord_501, 8, 65, 5, 'F4', 2, 8);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_502, 0, 'Bb7', 1)
  RETURNING id INTO v_chord_502;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index) VALUES
    (v_chord_502, 0, 68, 8, 'Ab4', 2, 0),
    (v_chord_502, 1, 74, 2, 'D5', 2, 0),
    (v_chord_502, 2, 70, 10, 'Bb4', 2, 1),
    (v_chord_502, 3, 68, 8, 'Ab4', 2, 2),
    (v_chord_502, 4, 65, 5, 'F4', 2, 3),
    (v_chord_502, 5, 68, 8, 'Ab4', 2, 4),
    (v_chord_502, 6, 74, 2, 'D5', 2, 4);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_503, 0, 'F7', 1)
  RETURNING id INTO v_chord_503;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index) VALUES
    (v_chord_503, 0, 65, 5, 'F4', 2, 0),
    (v_chord_503, 1, 70, 10, 'Bb4', 2, 1),
    (v_chord_503, 2, 74, 2, 'D5', 2, 1),
    (v_chord_503, 3, 71, 11, 'B4', 2, 2),
    (v_chord_503, 4, 70, 10, 'Bb4', 2, 3),
    (v_chord_503, 5, 74, 2, 'D5', 2, 3);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_504, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_504;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index) VALUES
    (v_chord_504, 0, 72, 0, 'C5', 2, 0),
    (v_chord_504, 1, 77, 5, 'F5', 2, 1),
    (v_chord_504, 2, 75, 3, 'Eb5', 2, 2),
    (v_chord_504, 3, 72, 0, 'C5', 2, 3),
    (v_chord_504, 4, 71, 11, 'B4', 2, 4),
    (v_chord_504, 5, 70, 10, 'Bb4', 2, 5),
    (v_chord_504, 6, 68, 8, 'Ab4', 2, 6),
    (v_chord_504, 7, 65, 5, 'F4', 2, 7);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_505, 0, 'C7', 1)
  RETURNING id INTO v_chord_505;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index) VALUES
    (v_chord_505, 0, 71, 11, 'B4', 2, 0),
    (v_chord_505, 1, 72, 0, 'C5', 2, 1),
    (v_chord_505, 2, 71, 11, 'B4', 2, 2),
    (v_chord_505, 3, 70, 10, 'Bb4', 2, 3),
    (v_chord_505, 4, 68, 8, 'Ab4', 2, 4),
    (v_chord_505, 5, 65, 5, 'F4', 2, 5);
END $$;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en, block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en, manual_completion_disabled
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q1-lesson'), 'a0000000-0000-0000-0000-000000000001'::uuid,
    'クエスト1：Fブルース入門', 'Quest 1: F blues intro',
    'CブルースからFへ。2音コール＆レスポンス。', 'From C blues to F. Two-note call and response.',
    false, 0, 6,
    'Fブルースに挑戦', 'Take on the F Blues',
    'Fブルースで2音・3音ヴォイシング、コンピング、アドリブ、フレーズまで。', 'Two- and three-note voicings, comping, ad-lib, and phrases on the F blues.',
    '[]'::jsonb,
    'Fブルースの入口を通しましょう。', 'Pass the gateway to F blues.',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q2-lesson'), 'a0000000-0000-0000-0000-000000000001'::uuid,
    'クエスト2：5つのコード', 'Quest 2: Five chords',
    'F7/Bb7/D7/Gm7/C7の2音を覚える。', 'Learn two-note F7/Bb7/D7/Gm7/C7.',
    false, 1, 6,
    'Fブルースに挑戦', 'Take on the F Blues',
    'Fブルースで2音・3音ヴォイシング、コンピング、アドリブ、フレーズまで。', 'Two- and three-note voicings, comping, ad-lib, and phrases on the F blues.',
    '[]'::jsonb,
    '5コードを体に入れましょう。', 'Internalize the five chords.',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q3-lesson'), 'a0000000-0000-0000-0000-000000000001'::uuid,
    'クエスト3：3音ヴォイシング', 'Quest 3: Three-note voicings',
    '3音に広げ、頭拍パターンを弾く。', 'Expand to three notes and play head-beat patterns.',
    false, 2, 6,
    'Fブルースに挑戦', 'Take on the F Blues',
    'Fブルースで2音・3音ヴォイシング、コンピング、アドリブ、フレーズまで。', 'Two- and three-note voicings, comping, ad-lib, and phrases on the F blues.',
    '[]'::jsonb,
    '3音ヴォイシングを練習しましょう。', 'Practice three-note voicings.',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q4-lesson'), 'a0000000-0000-0000-0000-000000000001'::uuid,
    'クエスト4：4パターン', 'Quest 4: Four patterns',
    '4つのリズムパターンに挑戦。', 'Take on four rhythm patterns.',
    false, 3, 6,
    'Fブルースに挑戦', 'Take on the F Blues',
    'Fブルースで2音・3音ヴォイシング、コンピング、アドリブ、フレーズまで。', 'Two- and three-note voicings, comping, ad-lib, and phrases on the F blues.',
    '[]'::jsonb,
    '4パターンを順に練習しましょう。', 'Work through the four patterns.',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q5-lesson'), 'a0000000-0000-0000-0000-000000000001'::uuid,
    'クエスト5：アドリブ', 'Quest 5: Ad-lib',
    '2音アドリブと3音セットの組み合わせ。', 'Two-note ad-lib and three-note set combinations.',
    false, 4, 6,
    'Fブルースに挑戦', 'Take on the F Blues',
    'Fブルースで2音・3音ヴォイシング、コンピング、アドリブ、フレーズまで。', 'Two- and three-note voicings, comping, ad-lib, and phrases on the F blues.',
    '[]'::jsonb,
    'アドリブ課題に挑戦しましょう。', 'Try the ad-lib tasks.',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q6-lesson'), 'a0000000-0000-0000-0000-000000000001'::uuid,
    'クエスト6：ペンタトニック', 'Quest 6: Pentatonic',
    'Fペンタトニックで色を足す。', 'Add color with the F pentatonic.',
    false, 5, 6,
    'Fブルースに挑戦', 'Take on the F Blues',
    'Fブルースで2音・3音ヴォイシング、コンピング、アドリブ、フレーズまで。', 'Two- and three-note voicings, comping, ad-lib, and phrases on the F blues.',
    '[]'::jsonb,
    'ペンタトニックを弾きましょう。', 'Play the pentatonic scale.',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q7-lesson'), 'a0000000-0000-0000-0000-000000000001'::uuid,
    'クエスト7：ブルーノート', 'Quest 7: Blue notes',
    'ブルーノート・スケールのフレーズ。', 'Phrases with the blue-note scale.',
    false, 6, 6,
    'Fブルースに挑戦', 'Take on the F Blues',
    'Fブルースで2音・3音ヴォイシング、コンピング、アドリブ、フレーズまで。', 'Two- and three-note voicings, comping, ad-lib, and phrases on the F blues.',
    '[]'::jsonb,
    'ブルーノートを確かめましょう。', 'Explore blue notes.',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q8-lesson'), 'a0000000-0000-0000-0000-000000000001'::uuid,
    'クエスト8：フレーズ', 'Quest 8: Phrases',
    'Bb→Bのスライドを含む精密フレーズ。', 'Precision phrases including Bb→B slide.',
    false, 7, 6,
    'Fブルースに挑戦', 'Take on the F Blues',
    'Fブルースで2音・3音ヴォイシング、コンピング、アドリブ、フレーズまで。', 'Two- and three-note voicings, comping, ad-lib, and phrases on the F blues.',
    '[]'::jsonb,
    '精密フレーズに挑戦しましょう。', 'Try the precision phrases.',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q9-lesson'), 'a0000000-0000-0000-0000-000000000001'::uuid,
    'クエスト9：サバイバル・フレーズ', 'Quest 9: Survival phrases',
    '5つの1小節フレーズをサバイバルで。', 'Five one-bar phrases in Survival.',
    false, 8, 6,
    'Fブルースに挑戦', 'Take on the F Blues',
    'Fブルースで2音・3音ヴォイシング、コンピング、アドリブ、フレーズまで。', 'Two- and three-note voicings, comping, ad-lib, and phrases on the F blues.',
    '[]'::jsonb,
    'フレーズを覚えましょう。', 'Learn the survival phrases.',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q10-lesson'), 'a0000000-0000-0000-0000-000000000001'::uuid,
    'クエスト10：まとめ', 'Quest 10: Summary',
    'Fブルース章の総仕上げ。', 'F blues chapter finale.',
    false, 9, 6,
    'Fブルースに挑戦', 'Take on the F Blues',
    'Fブルースで2音・3音ヴォイシング、コンピング、アドリブ、フレーズまで。', 'Two- and three-note voicings, comping, ad-lib, and phrases on the F blues.',
    '[]'::jsonb,
    '総仕上げに挑戦しましょう。', 'Take on the finale.',
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q1-0-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q1-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    false, NULL,
    false, NULL,
    true, 'mq-b5-q1-0-v1',
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '1-0. C→Fブルース', '1-0. C to F blues',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q1-1-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q1-lesson'), NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    false, NULL,
    true, 'mq-b5-q1-1-v1',
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '1-1. Fブルース入門', '1-1. F blues intro',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q2-0-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q2-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    false, NULL,
    false, NULL,
    true, 'mq-b5-q2-0-v1',
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '2-0. 5つのコード', '2-0. Five chords',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q2-1-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q2-lesson'), NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    true, 1301, 'lesson',
    false, NULL,
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    '[{"name":"F7","voicing":[51,57],"voicingNames":["Eb3","A3"],"voicingStaves":[2,2],"keyFifths":-1},{"name":"Bb7","voicing":[50,56],"voicingNames":["D3","Ab3"],"voicingStaves":[2,2],"keyFifths":-1},{"name":"D7","voicing":[54,60],"voicingNames":["Gb3","C4"],"voicingStaves":[2,2],"keyFifths":-1},{"name":"Gm7","voicing":[53,58],"voicingNames":["F3","Bb3"],"voicingStaves":[2,2],"keyFifths":-1},{"name":"C7","voicing":[52,58],"voicingNames":["E3","Bb3"],"voicingStaves":[2,2],"keyFifths":-1}]'::jsonb,
    'always', 'always',
    '2-1. コードラン（2音）', '2-1. Code Run (2v)',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q2-2-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q2-lesson'), NULL, 2,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    false, NULL,
    false, NULL,
    false, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-balloon-2v'),
    NULL,
    '[{"name":"F7","voicing":[51,57],"voicingNames":["Eb3","A3"],"voicingStaves":[2,2],"keyFifths":-1},{"name":"Bb7","voicing":[50,56],"voicingNames":["D3","Ab3"],"voicingStaves":[2,2],"keyFifths":-1},{"name":"D7","voicing":[54,60],"voicingNames":["Gb3","C4"],"voicingStaves":[2,2],"keyFifths":-1},{"name":"Gm7","voicing":[53,58],"voicingNames":["F3","Bb3"],"voicingStaves":[2,2],"keyFifths":-1},{"name":"C7","voicing":[52,58],"voicingNames":["E3","Bb3"],"voicingStaves":[2,2],"keyFifths":-1}]'::jsonb,
    'fade_15s', 'fade_15s',
    '2-2. 風船（2音）', '2-2. Balloon (2v)',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q2-3-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q2-lesson'), NULL, 3,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-stage'),
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '2-3. クイズ（2音）', '2-3. Quiz (2v)',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q2-4-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q2-lesson'), NULL, 4,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    true, 1302, 'lesson',
    false, NULL,
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    '[{"name":"F7","voicing":[51,57],"voicingNames":["Eb3","A3"],"voicingStaves":[2,2],"keyFifths":-1},{"name":"Bb7","voicing":[50,56],"voicingNames":["D3","Ab3"],"voicingStaves":[2,2],"keyFifths":-1},{"name":"D7","voicing":[54,60],"voicingNames":["Gb3","C4"],"voicingStaves":[2,2],"keyFifths":-1},{"name":"Gm7","voicing":[53,58],"voicingNames":["F3","Bb3"],"voicingStaves":[2,2],"keyFifths":-1},{"name":"C7","voicing":[52,58],"voicingNames":["E3","Bb3"],"voicingStaves":[2,2],"keyFifths":-1}]'::jsonb,
    'fade_15s', 'fade_15s',
    '2-4. サバイバル（2音）', '2-4. Survival (2v)',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q3-0-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q3-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    false, NULL,
    false, NULL,
    true, 'mq-b5-q3-0-v1',
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '3-0. 3音の説明', '3-0. Three-note intro',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q3-1-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q3-lesson'), NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-2-6-stage'),
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '3-1. 2音・頭拍', '3-1. Two-note head beat',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q3-2-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q3-lesson'), NULL, 2,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-3-6-stage'),
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '3-2. 3音・頭拍', '3-2. Three-note head beat',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q3-3-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q3-lesson'), NULL, 3,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    true, 1311, 'lesson',
    false, NULL,
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    '[{"name":"F7","voicing":[51,57,62],"voicingNames":["Eb3","A3","D4"],"voicingStaves":[2,2,2],"keyFifths":-1},{"name":"Bb7","voicing":[50,56,60],"voicingNames":["D3","Ab3","C4"],"voicingStaves":[2,2,2],"keyFifths":-1},{"name":"D7","voicing":[54,60,63],"voicingNames":["Gb3","C4","Eb4"],"voicingStaves":[2,2,2],"keyFifths":-1},{"name":"Gm7","voicing":[53,58,62],"voicingNames":["F3","Bb3","D4"],"voicingStaves":[2,2,2],"keyFifths":-1},{"name":"C7","voicing":[52,58,62],"voicingNames":["E3","Bb3","D4"],"voicingStaves":[2,2,2],"keyFifths":-1}]'::jsonb,
    'always', 'always',
    '3-3. コードラン（3音）', '3-3. Code Run (3v)',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q3-4-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q3-lesson'), NULL, 4,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    false, NULL,
    false, NULL,
    false, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-balloon-3v'),
    NULL,
    '[{"name":"F7","voicing":[51,57,62],"voicingNames":["Eb3","A3","D4"],"voicingStaves":[2,2,2],"keyFifths":-1},{"name":"Bb7","voicing":[50,56,60],"voicingNames":["D3","Ab3","C4"],"voicingStaves":[2,2,2],"keyFifths":-1},{"name":"D7","voicing":[54,60,63],"voicingNames":["Gb3","C4","Eb4"],"voicingStaves":[2,2,2],"keyFifths":-1},{"name":"Gm7","voicing":[53,58,62],"voicingNames":["F3","Bb3","D4"],"voicingStaves":[2,2,2],"keyFifths":-1},{"name":"C7","voicing":[52,58,62],"voicingNames":["E3","Bb3","D4"],"voicingStaves":[2,2,2],"keyFifths":-1}]'::jsonb,
    'fade_15s', 'fade_15s',
    '3-4. 風船（3音）', '3-4. Balloon (3v)',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q3-5-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q3-lesson'), NULL, 5,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-stage'),
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '3-5. クイズ（3音）', '3-5. Quiz (3v)',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q3-6-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q3-lesson'), NULL, 6,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    true, 1312, 'lesson',
    false, NULL,
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    '[{"name":"F7","voicing":[51,57,62],"voicingNames":["Eb3","A3","D4"],"voicingStaves":[2,2,2],"keyFifths":-1},{"name":"Bb7","voicing":[50,56,60],"voicingNames":["D3","Ab3","C4"],"voicingStaves":[2,2,2],"keyFifths":-1},{"name":"D7","voicing":[54,60,63],"voicingNames":["Gb3","C4","Eb4"],"voicingStaves":[2,2,2],"keyFifths":-1},{"name":"Gm7","voicing":[53,58,62],"voicingNames":["F3","Bb3","D4"],"voicingStaves":[2,2,2],"keyFifths":-1},{"name":"C7","voicing":[52,58,62],"voicingNames":["E3","Bb3","D4"],"voicingStaves":[2,2,2],"keyFifths":-1}]'::jsonb,
    'fade_15s', 'fade_15s',
    '3-6. サバイバル（3音）', '3-6. Survival (3v)',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q4-0-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q4-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    false, NULL,
    false, NULL,
    true, 'mq-b5-q4-0-v1',
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '4-0. 4パターン紹介', '4-0. Four patterns intro',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q4-1-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q4-lesson'), NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-2-stage'),
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '4-1. パターン2', '4-1. Pattern 2',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q4-2-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q4-lesson'), NULL, 2,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-3-stage'),
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '4-2. パターン3', '4-2. Pattern 3',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q4-3-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q4-lesson'), NULL, 3,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-4-stage'),
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '4-3. パターン4', '4-3. Pattern 4',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q4-4-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q4-lesson'), NULL, 4,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-5-stage'),
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '4-4. パターン5', '4-4. Pattern 5',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q4-5-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q4-lesson'), NULL, 5,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-6-stage'),
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '4-5. パターン6（まとめ）', '4-5. Pattern 6 (optional)',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q5-0-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q5-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    false, NULL,
    false, NULL,
    true, 'mq-b5-q5-0-v1',
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '5-0. アドリブの説明', '5-0. Ad-lib intro',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q5-1-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q5-lesson'), NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-2-stage'),
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '5-1. アドリブ2', '5-1. Ad-lib 2',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q5-2-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q5-lesson'), NULL, 2,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-3-stage'),
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '5-2. アドリブ3', '5-2. Ad-lib 3',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q5-3-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q5-lesson'), NULL, 3,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-4-stage'),
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '5-3. アドリブ4', '5-3. Ad-lib 4',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q5-4-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q5-lesson'), NULL, 4,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    false, NULL,
    true, 'mq-b5-q5-4-v1',
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '5-4. 3音セット練習', '5-4. Three-note sets',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q5-5-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q5-lesson'), NULL, 5,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    false, NULL,
    false, NULL,
    true, 'mq-b5-q5-5-v1',
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '5-5. クエスト5まとめ', '5-5. Quest 5 summary',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q6-1-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q6-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    false, NULL,
    true, 'mq-b5-q6-1-v1',
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '6-1. Fペンタトニック', '6-1. F pentatonic',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q6-2-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q6-lesson'), NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-6-2-stage'),
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '6-2. ペンタトニック実戦', '6-2. Pentatonic in action',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q7-0-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q7-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    false, NULL,
    false, NULL,
    true, 'mq-b5-q7-0-v1',
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '7-0. ブルーノート', '7-0. Blue notes',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q7-1-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q7-lesson'), NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-2-stage'),
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '7-1. ブルーノート・スケール', '7-1. Blue-note scale',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q7-2-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q7-lesson'), NULL, 2,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-3-stage'),
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '7-2. ブルーノート・精密', '7-2. Blue notes · Precision',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q8-0-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q8-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    false, NULL,
    false, NULL,
    true, 'mq-b5-q8-0-v1',
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '8-0. フレーズのコツ', '8-0. Phrase tips',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q8-1-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q8-lesson'), NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-2-stage'),
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '8-1. フレーズ1・精密', '8-1. Phrase 1 · Precision',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q8-2-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q8-lesson'), NULL, 2,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-3-stage'),
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '8-2. フレーズ2・精密', '8-2. Phrase 2 · Precision',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q8-3-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q8-lesson'), NULL, 3,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-4-stage'),
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '8-3. フレーズ3・精密', '8-3. Phrase 3 · Precision',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q9-0-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q9-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    false, NULL,
    false, NULL,
    true, 'mq-b5-q9-0-v1',
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '9-0. フレーズの弾き方', '9-0. How to play phrases',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q9-1-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q9-lesson'), NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    true, 501, 'phrases',
    false, NULL,
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    'fade_15s', 'fade_15s',
    '9-1. フレーズ I', '9-1. Phrase I',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q9-2-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q9-lesson'), NULL, 2,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    true, 502, 'phrases',
    false, NULL,
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    'fade_15s', 'fade_15s',
    '9-2. フレーズ II', '9-2. Phrase II',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q9-3-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q9-lesson'), NULL, 3,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    true, 503, 'phrases',
    false, NULL,
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    'fade_15s', 'fade_15s',
    '9-3. フレーズ III', '9-3. Phrase III',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q9-4-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q9-lesson'), NULL, 4,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    true, 504, 'phrases',
    false, NULL,
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    'fade_15s', 'fade_15s',
    '9-4. フレーズ IV', '9-4. Phrase IV',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q9-5-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q9-lesson'), NULL, 5,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    true, 505, 'phrases',
    false, NULL,
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    'fade_15s', 'fade_15s',
    '9-5. フレーズ V', '9-5. Phrase V',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q10-0-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q10-lesson'), NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    false, NULL,
    false, NULL,
    true, 'mq-b5-q10-0-v1',
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '10-0. 章のまとめ', '10-0. Chapter summary',
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q10-1-lsong'), uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q10-lesson'), NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    false, NULL, NULL,
    true, uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-10-2-stage'),
    false, NULL,
    false, NULL,
    false, NULL,
    NULL,
    NULL,
    NULL, NULL,
    '10-1. 総仕上げ・精密', '10-1. Finale · Precision',
    false
  )
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
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
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

COMMIT;
