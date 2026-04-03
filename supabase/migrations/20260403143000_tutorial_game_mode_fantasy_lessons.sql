-- チュートリアル: ファンタジーゲームモード説明用レッスン（3件）
-- 体力200・敵は約10ヒットで撃破（enemy_hp 100, min/max_damage 10）・クリア条件 B ランク以上
BEGIN;

-- 1) 横スクロールRPG風: progression_timing（ファソラシの里と同一楽曲・データ）
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url, music_xml, chord_progression_data,
  enable_transposition, call_response_enabled, call_response_mode,
  call_response_listen_bars, call_response_play_bars,
  use_rhythm_notation, note_interval_beats,
  required_clears_for_next
)
SELECT
  '47ac266e-c640-5478-b420-5c4db4050b6a'::uuid,
  NULL,
  'チュートリアル：ファソラシの泉（横スクロールRPG風）',
  'Tutorial: Fasorasi Spring (horizontal RPG-style)',
  'ファンタジーの「横スクロールRPG風」モードです。ノーツが判定線へ流れます。タイミングよく和音を演奏して敵を倒しましょう。課題曲は本編ステージ「ファソラシの里」と同じです。',
  'Fantasy horizontal RPG-style mode: notes scroll toward the hit line. Play chords in time to defeat enemies. Uses the same piece as the main stage Fasorasi Village.',
  200,
  80,
  9999,
  mode,
  allowed_chords,
  chord_progression,
  true,
  1,
  100,
  10,
  10,
  simultaneous_monster_count,
  play_root_on_correct,
  'basic',
  bpm,
  time_signature,
  measure_count,
  count_in_measures,
  'lesson',
  false,
  is_auftakt,
  production_repeat_transposition_mode,
  production_start_key,
  bgm_url,
  mp3_url,
  music_xml,
  chord_progression_data,
  enable_transposition,
  call_response_enabled,
  call_response_mode,
  call_response_listen_bars,
  call_response_play_bars,
  use_rhythm_notation,
  note_interval_beats,
  1
FROM public.fantasy_stages
WHERE id = '64c8bc49-127e-449d-a792-236886cfdd6e'::uuid;

-- 2) 攻撃ゲージ: single（出題 C / D / E のメジャーコード）
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  '898cc873-a55e-5278-b801-91f643b349e5'::uuid,
  NULL,
  'チュートリアル：攻撃ゲージ（ドレミ）',
  'Tutorial: Attack gauge (C D E)',
  '「攻撃ゲージ」モードです。敵のゲージが満ちる前に、表示されたコードを入力しましょう。出題は C・D・E の単音コードのみです。',
  'Attack gauge mode: input the shown chord before the enemy gauge fills. Only C, D, and E major triads are used.',
  200,
  15,
  4.0,
  'single',
  '["C","D","E"]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  100,
  10,
  10,
  1,
  false,
  'basic',
  100,
  4,
  4,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/e56446c6-50eb-494f-9d26-3a1c35e60d78.mp3',
  NULL
);

-- 3) 縦スクロール（レジェンド）: progression_timing + 楽譜表示（バッハ平均律クラヴィーア曲集第1巻 第1番 先頭2小節・右手のみ）
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url, music_xml, chord_progression_data,
  enable_transposition, use_rhythm_notation
) VALUES (
  '81ef6591-e75d-563b-ad78-f7735a129241'::uuid,
  NULL,
  'チュートリアル：縦スクロール（レジェンド）',
  'Tutorial: Vertical scroll (Legend)',
  '「縦スクロール（レジェンド）」モードです。楽譜に沿ってノーツが進みます。J.S.バッハ 平均律クラヴィーア曲集 第1巻 第1番 ハ長調 プレリュードの冒頭2小節（右手パート）の課題です。',
  'Legend vertical-scroll style: notes advance along the sheet music. Excerpt: first two measures (right hand) of Bach WTC Book I No.1 in C major, BWV 846.',
  200,
  40,
  9999,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  100,
  10,
  10,
  1,
  false,
  'advanced',
  72,
  4,
  2,
  1,
  'lesson',
  true,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/e56446c6-50eb-494f-9d26-3a1c35e60d78.mp3',
  NULL,
  $bach$<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>8</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><sound tempo="72"/><note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>E</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>C</step><octave>5</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>E</step><octave>5</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>E</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>E</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>C</step><octave>5</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>E</step><octave>5</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>E</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>E</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note></measure><measure number="2"><note><pitch><step>D</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>F</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>A</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>D</step><octave>5</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>F</step><octave>5</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>A</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>F</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>D</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>F</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>A</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>D</step><octave>5</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>F</step><octave>5</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>A</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>F</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>D</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note><note><pitch><step>F</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>16th</type><stem>up</stem></note></measure></part></score-partwise>$bach$,
  '[]'::jsonb,
  false,
  false
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES
(
  '19b12c25-e35f-5165-98d2-35a43b14b1e0'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'ゲームモード：横スクロールRPG風',
  'Game mode: Horizontal RPG-style',
  $d1$ファンタジーモードの「横スクロールRPG風」です。ノーツが流れるリズムに合わせてコードを演奏し、モンスターを倒します。下の課題で B ランク以上を目指してください。$d1$,
  $e1$Fantasy horizontal RPG-style: play chords in time with scrolling notes to defeat monsters. Clear the assignment below with rank B or higher.$e1$,
  5,
  2,
  'ゲームモード',
  'Game modes',
  false,
  $a1$リンク先のファンタジーステージをクリアしてください（ランク B 以上・1 回）。$a1$,
  '["fantasy"]'::jsonb
),
(
  '2b9f605b-f460-5d06-a76f-39f198a6345c'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'ゲームモード：攻撃ゲージ',
  'Game mode: Attack gauge',
  $d2$表示されたコードを入力して敵にダメージを与えます。敵の「攻撃ゲージ」が満ちる前に正解しましょう。出題は C・D・E です。課題で B ランク以上を目指してください。$d2$,
  $e2$Input the shown chord to damage the enemy before its attack gauge fills. Prompts use C, D, and E. Clear the assignment with rank B or higher.$e2$,
  6,
  2,
  'ゲームモード',
  'Game modes',
  false,
  $a2$リンク先のファンタジーステージをクリアしてください（ランク B 以上・1 回）。$a2$,
  '["fantasy"]'::jsonb
),
(
  '5d9718a4-2760-5453-92f0-b9a3a6c200e5'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'ゲームモード：縦スクロール（レジェンド）',
  'Game mode: Vertical scroll (Legend)',
  $d3$楽譜表示付きの「レジェンド」向けモードです。バッハ平均律第1巻第1番プレリュードの冒頭2小節（右手）に沿って演奏します。課題で B ランク以上を目指してください。$d3$,
  $e3$Legend-style mode with scrolling sheet music. Play the first two measures (right hand) of Bach WTC I/1 Prelude. Clear the assignment with rank B or higher.$e3$,
  7,
  2,
  'ゲームモード',
  'Game modes',
  false,
  $a3$リンク先のファンタジーステージをクリアしてください（ランク B 以上・1 回）。$a3$,
  '["fantasy"]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title, title_en
) VALUES
(
  '8ed37296-4064-56c7-b29f-1fb9a5f7887e'::uuid,
  '19b12c25-e35f-5165-98d2-35a43b14b1e0'::uuid,
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  '47ac266e-c640-5478-b420-5c4db4050b6a'::uuid,
  'ファンタジー（横スクロールRPG風）',
  'Fantasy (horizontal RPG-style)'
),
(
  '75107c2d-f8a0-5ab5-ad64-bbd336fb9f64'::uuid,
  '2b9f605b-f460-5d06-a76f-39f198a6345c'::uuid,
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  '898cc873-a55e-5278-b801-91f643b349e5'::uuid,
  'ファンタジー（攻撃ゲージ）',
  'Fantasy (attack gauge)'
),
(
  '4cc08ceb-6d40-5391-85eb-2e144f648012'::uuid,
  '5d9718a4-2760-5453-92f0-b9a3a6c200e5'::uuid,
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  '81ef6591-e75d-563b-ad78-f7735a129241'::uuid,
  'ファンタジー（縦スクロール・レジェンド）',
  'Fantasy (vertical scroll, Legend)'
);

COMMIT;
