-- MQ Block1 コンテンツ編集（1-1, 1-2, 2-2, 3-1削除, 3-2, 3-3）
-- 生成: node scripts/generate-mq-block1-c-blues-migration.mjs --write-patch-migration
BEGIN;

-- 1-1 台本

INSERT INTO public.ear_training_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b1-q1-osmd-v1',
  'MQ B1: ドとソをまねしよう',
  'MQ B1: Copy Do and Sol',
  '{"version":1,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideLobby":true,"hideMidiToggle":true,"hidePhraseIntroQuota":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{"mq-b1-q1-osmd":{"stage":{"slug":"mq-b1-q1-osmd","title":"ドとソをまねしよう","title_en":"Copy Do and Sol","bpm":100,"key_fifths":0,"beats_per_measure":4,"beat_type":4,"loop_measures":24,"max_loops_per_phrase":2,"count_in_beats":0,"time_limit_sec":600,"player_hp":100,"enemy_hp":10000,"per_correct_note_damage":10,"good_completion_damage":30,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"chord_osmd","show_keyboard_hints_in_battle":true,"osmd_targets_from_score":true},"phrases":[{"order_index":0,"title":"Cブルース・ドとソ","title_en":"C Blues Do/Sol","music_xml_url":"https://jazzify-cdn.com/sozai/1-1_count-in.musicxml","audio_url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_count-in.mp3","loop_duration_sec":60,"audio_duration_sec":60,"note_count":24,"key_fifths":0,"chords":[{"order_index":0,"chord_name":"—","measure_number":2,"beat_offset":1,"duration_beats":4,"start_time_sec":2.4,"end_time_sec":4.8,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":1,"chord_name":"C/G","measure_number":3,"beat_offset":1,"duration_beats":4,"start_time_sec":4.8,"end_time_sec":7.199999999999999,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":2,"chord_name":"—","measure_number":4,"beat_offset":1,"duration_beats":4,"start_time_sec":7.199999999999999,"end_time_sec":9.6,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":3,"chord_name":"C/G","measure_number":5,"beat_offset":1,"duration_beats":4,"start_time_sec":9.6,"end_time_sec":12,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":4,"chord_name":"—","measure_number":6,"beat_offset":1,"duration_beats":4,"start_time_sec":12,"end_time_sec":14.4,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":5,"chord_name":"C/G","measure_number":7,"beat_offset":1,"duration_beats":4,"start_time_sec":14.399999999999999,"end_time_sec":16.799999999999997,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":6,"chord_name":"—","measure_number":8,"beat_offset":1,"duration_beats":4,"start_time_sec":16.8,"end_time_sec":19.2,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":7,"chord_name":"C/G","measure_number":9,"beat_offset":1,"duration_beats":4,"start_time_sec":19.2,"end_time_sec":21.599999999999998,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":8,"chord_name":"—","measure_number":10,"beat_offset":1,"duration_beats":4,"start_time_sec":21.599999999999998,"end_time_sec":23.999999999999996,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":9,"chord_name":"C/G","measure_number":11,"beat_offset":1,"duration_beats":4,"start_time_sec":24,"end_time_sec":26.4,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":10,"chord_name":"—","measure_number":12,"beat_offset":1,"duration_beats":4,"start_time_sec":26.4,"end_time_sec":28.799999999999997,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":11,"chord_name":"C/G","measure_number":13,"beat_offset":1,"duration_beats":4,"start_time_sec":28.799999999999997,"end_time_sec":31.199999999999996,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":12,"chord_name":"—","measure_number":14,"beat_offset":1,"duration_beats":4,"start_time_sec":31.2,"end_time_sec":33.6,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":13,"chord_name":"C/G","measure_number":15,"beat_offset":1,"duration_beats":4,"start_time_sec":33.6,"end_time_sec":36,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":14,"chord_name":"—","measure_number":16,"beat_offset":1,"duration_beats":4,"start_time_sec":36,"end_time_sec":38.4,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":15,"chord_name":"C/G","measure_number":17,"beat_offset":1,"duration_beats":4,"start_time_sec":38.4,"end_time_sec":40.8,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":16,"chord_name":"—","measure_number":18,"beat_offset":1,"duration_beats":4,"start_time_sec":40.8,"end_time_sec":43.199999999999996,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":17,"chord_name":"C/G","measure_number":19,"beat_offset":1,"duration_beats":4,"start_time_sec":43.199999999999996,"end_time_sec":45.599999999999994,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":18,"chord_name":"—","measure_number":20,"beat_offset":1,"duration_beats":4,"start_time_sec":45.6,"end_time_sec":48,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":19,"chord_name":"C/G","measure_number":21,"beat_offset":1,"duration_beats":4,"start_time_sec":48,"end_time_sec":50.4,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":20,"chord_name":"—","measure_number":22,"beat_offset":1,"duration_beats":4,"start_time_sec":50.4,"end_time_sec":52.8,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":21,"chord_name":"C/G","measure_number":23,"beat_offset":1,"duration_beats":4,"start_time_sec":52.8,"end_time_sec":55.199999999999996,"voicing":["C4","G4"],"voicing_staves":[1,1]},{"order_index":22,"chord_name":"—","measure_number":24,"beat_offset":1,"duration_beats":4,"start_time_sec":55.199999999999996,"end_time_sec":57.599999999999994,"voicing":[],"voicing_staves":[],"input_disabled":true},{"order_index":23,"chord_name":"C/G","measure_number":25,"beat_offset":1,"duration_beats":4,"start_time_sec":57.599999999999994,"end_time_sec":59.99999999999999,"voicing":["C4","G4"],"voicing_staves":[1,1]}]}]}},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"partner","ja":"ファイよ、この世界は音のチカラを失い、崩れかけておる。","en":"Fai, this world has lost the power of sound and is crumbling."},{"speaker":"player","ja":"えっ、オレが何とかするの？","en":"Wait — I have to fix this?"},{"speaker":"partner","ja":"うむ。必要なのは、ジャズのチカラじゃ。","en":"Aye. What we need is the power of jazz."},{"speaker":"player","ja":"ジャズって、むずかしそうだけど。","en":"Jazz sounds pretty hard though."},{"speaker":"partner","ja":"心配いらん。まず使う音は、ドとソだけじゃ。","en":"Fear not. For now you only need Do and Sol."},{"speaker":"player","ja":"2つだけなら、いけそう！","en":"Only two notes — I can do that!"},{"speaker":"partner","ja":"ワシの音を1小節聴き、次の1小節でまねするのじゃ。","en":"Listen for one bar, then copy me in the next bar."},{"speaker":"player","ja":"まずは、ドとソをまねしてみよう。","en":"Let''s start by copying Do and Sol."}]},{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"partner","ja":"この章では、Cブルースに挑戦する。","en":"In this chapter we take on the C blues."},{"speaker":"player","ja":"Cブルース？","en":"C blues?"},{"speaker":"partner","ja":"ジャズの入口にぴったりの流れじゃ。","en":"A perfect entry into jazz."},{"speaker":"player","ja":"いきなり曲っぽいことするんだね。","en":"So we jump into something song-like right away."},{"speaker":"partner","ja":"そうじゃ。読むより先に、聴いて、返して、手で覚えるのじゃ。","en":"Aye. Hear, answer, and learn with your hands before reading."},{"speaker":"player","ja":"よし、まずは音で会話だ！","en":"Alright — conversation with sound first!"},{"speaker":"player","ja":"流れる音を聴いて、次の小節で同じように返そう。","en":"Listen to the music, then answer the same way in the next bar."}]},{"type":"chord_osmd","contentRef":"mq-b1-q1-osmd","requiredLoops":1,"timedLines":[{"at":{"loop":0,"measure":2,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":3,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":4,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":5,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":6,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":7,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":8,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":9,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":10,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":11,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":12,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":13,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":14,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":15,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":16,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":17,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":18,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":19,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":20,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":21,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":22,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":23,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":24,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":25,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}}]},{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"partner","ja":"よし。ドとソで返事ができたのう。","en":"Good. You answered with Do and Sol."},{"speaker":"player","ja":"ちょっと音で会話してる感じがした！","en":"It felt like talking with sound!"},{"speaker":"partner","ja":"次は、まねるだけではない。","en":"Next, you won''t only copy."},{"speaker":"player","ja":"じゃあ、どうするの？","en":"So what do I do?"},{"speaker":"partner","ja":"ドとソだけで、自分の返事を弾くのじゃ。","en":"Answer in your own way with just Do and Sol."},{"speaker":"player","ja":"次は、ドとソで自由にアドリブしよう。","en":"Next up: ad-lib with Do and Sol."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();


-- 1-2 アドリブ chords + quotes
DELETE FROM public.ear_training_phrase_chord_quotes
WHERE phrase_chord_id IN (
  SELECT id FROM public.ear_training_phrase_chords
  WHERE phrase_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase')
);

DELETE FROM public.ear_training_phrase_chords
WHERE phrase_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase');

INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name, measure_number, beat_offset,
  duration_beats, start_time_sec, end_time_sec, voicing, voicing_staves, input_disabled
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    1,
    'F7',
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c3'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    3,
    'C7',
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c5'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    5,
    'F7',
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c7'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    7,
    'C7',
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c9'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    9,
    'F7',
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c11'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase'),
    11,
    'G7',
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
    'C7',
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
    'F7',
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
    'C7',
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
    'C7',
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
    'F7',
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
    'F7',
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
    'C7',
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
    'C7',
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
    'G7',
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
    'F7',
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
    'C7',
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
    'G7',
    24,
    1,
    4,
    55.199999999999996,
    57.599999999999994,
    ARRAY['C4', 'G4']::text[],
    ARRAY[1, 1]::smallint[],
    false
  );

DELETE FROM public.ear_training_phrase_chord_quotes
WHERE phrase_chord_id IN (
  SELECT id FROM public.ear_training_phrase_chords
  WHERE phrase_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-phrase')
);

INSERT INTO public.ear_training_phrase_chord_quotes (phrase_chord_id, text) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c0'), '聴いて…'),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-adlib-c1'), 'ドとソでアドリブしよう')
ON CONFLICT (phrase_chord_id) DO UPDATE SET
  text = EXCLUDED.text,
  updated_at = now();


-- 2-2 コードラン プレイ中セリフ
UPDATE public.survival_stages
SET
  run_dialogue_script = '{"lines":[{"atSeconds":2,"speaker":"fai","text":"C7とF7を弾こう","textEn":"Let''s play C7 and F7."},{"atSeconds":8,"speaker":"jajii","text":"右に進むんじゃ","textEn":"Head to the right."},{"atSeconds":14,"speaker":"jajii","text":"2段ジャンプもできるぞ","textEn":"You can double-jump too."},{"atSeconds":22,"speaker":"jajii","text":"この「コードランモード」が気に入ったなら、目的別コースから、集中して取り組むこともできるぞ。","textEn":"If you like Code Run mode, focus on it in purpose-based courses."},{"atSeconds":30,"speaker":"jajii","text":"コードランで、自然にジャズのヴォイシング(音の積み方)を覚えるんじゃ","textEn":"Code Run helps you learn jazz voicing naturally."},{"atSeconds":38,"speaker":"jajii","text":"アクションゲームが苦手な人も大丈夫、メインクエストではコードラン課題はクリアしなくてもいい「おまけ課題」としてのみ出されるぞい。","textEn":"Struggling with action games? Code Run in the main quest is optional bonus content only."}]}'::jsonb,
  updated_at = now()
WHERE map_category = 'basic' AND stage_number = 182;

-- 3-1 削除
DELETE FROM public.user_lesson_requirements_progress
WHERE lesson_song_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q3-1-lsong');

DELETE FROM public.lesson_songs
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q3-1-lsong');

DELETE FROM public.survival_tutorial_scripts
WHERE id = 'mq-b1-q3-survival-v1';

UPDATE public.lesson_songs
SET order_index = 0
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q3-2-lsong');

UPDATE public.lesson_songs
SET order_index = 1
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q3-3-lsong');

UPDATE public.lessons
SET
  description = 'デモで流れを見て、1拍目リズムへ。',
  description_en = 'Watch the flow in demo play, then beat-one rhythm.'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q3-lesson');

-- 3-2 / 3-3 台本

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'mq-b1-q3-demo-play-v1',
  'MQ B1: Cブルースデモ',
  'MQ B1: C blues demo play',
  '{"version":3,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM.mp3","volume":0.35}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"scenarioOverrides":{"hideStaffOnBSlotCompletion":false,"hideStaff":false},"content":{},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"ここではCブルースのコードの流れを通して見る。","en":"Here we watch the C blues chord flow from start to finish."},{"speaker":"fai","ja":"今度は自分で弾くんじゃなくて、見るんだね。","en":"This time I watch instead of playing."},{"speaker":"jajii","ja":"そうじゃ。まずは流れを目で追うのじゃ。","en":"Aye. Follow the flow with your eyes first."},{"speaker":"fai","ja":"BGMに合わせてコードが進むのを見よう。","en":"Watch the chords move with the BGM."}]},{"type":"demo_play","bpm":100,"beatsPerMeasure":4,"keyFifths":0,"introLines":[{"speaker":"fai","ja":"デモプレイ、開始！","en":"Demo play — start!"},{"speaker":"jajii","ja":"デモプレイじゃが、おぬしも一緒に弾いていいぞい。","en":"It''s a demo, but you may play along too."}],"chords":[{"startBeat":0,"durationBeats":4,"chordName":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"voicing_staves":[1,1],"measureNumber":1,"keyFifths":0},{"startBeat":4,"durationBeats":4,"chordName":"F7","voicing":[63,69],"voicingNames":["E♭4","A4"],"voicing_staves":[1,1],"measureNumber":2,"keyFifths":0},{"startBeat":8,"durationBeats":4,"chordName":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"voicing_staves":[1,1],"measureNumber":3,"keyFifths":0},{"startBeat":12,"durationBeats":4,"chordName":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"voicing_staves":[1,1],"measureNumber":4,"keyFifths":0},{"startBeat":16,"durationBeats":4,"chordName":"F7","voicing":[63,69],"voicingNames":["E♭4","A4"],"voicing_staves":[1,1],"measureNumber":5,"keyFifths":0},{"startBeat":20,"durationBeats":4,"chordName":"F7","voicing":[63,69],"voicingNames":["E♭4","A4"],"voicing_staves":[1,1],"measureNumber":6,"keyFifths":0},{"startBeat":24,"durationBeats":4,"chordName":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"voicing_staves":[1,1],"measureNumber":7,"keyFifths":0},{"startBeat":28,"durationBeats":4,"chordName":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"voicing_staves":[1,1],"measureNumber":8,"keyFifths":0},{"startBeat":32,"durationBeats":4,"chordName":"G7","voicing":[65,71],"voicingNames":["F4","B4"],"voicing_staves":[1,1],"measureNumber":9,"keyFifths":0},{"startBeat":36,"durationBeats":4,"chordName":"F7","voicing":[63,69],"voicingNames":["E♭4","A4"],"voicing_staves":[1,1],"measureNumber":10,"keyFifths":0},{"startBeat":40,"durationBeats":4,"chordName":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"voicing_staves":[1,1],"measureNumber":11,"keyFifths":0},{"startBeat":44,"durationBeats":4,"chordName":"G7","voicing":[65,71],"voicingNames":["F4","B4"],"voicing_staves":[1,1],"measureNumber":12,"keyFifths":0},{"startBeat":48,"durationBeats":4,"chordName":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"voicing_staves":[1,1],"measureNumber":13,"keyFifths":0},{"startBeat":52,"durationBeats":4,"chordName":"F7","voicing":[63,69],"voicingNames":["E♭4","A4"],"voicing_staves":[1,1],"measureNumber":14,"keyFifths":0},{"startBeat":56,"durationBeats":4,"chordName":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"voicing_staves":[1,1],"measureNumber":15,"keyFifths":0},{"startBeat":60,"durationBeats":4,"chordName":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"voicing_staves":[1,1],"measureNumber":16,"keyFifths":0},{"startBeat":64,"durationBeats":4,"chordName":"F7","voicing":[63,69],"voicingNames":["E♭4","A4"],"voicing_staves":[1,1],"measureNumber":17,"keyFifths":0},{"startBeat":68,"durationBeats":4,"chordName":"F7","voicing":[63,69],"voicingNames":["E♭4","A4"],"voicing_staves":[1,1],"measureNumber":18,"keyFifths":0},{"startBeat":72,"durationBeats":4,"chordName":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"voicing_staves":[1,1],"measureNumber":19,"keyFifths":0},{"startBeat":76,"durationBeats":4,"chordName":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"voicing_staves":[1,1],"measureNumber":20,"keyFifths":0},{"startBeat":80,"durationBeats":4,"chordName":"G7","voicing":[65,71],"voicingNames":["F4","B4"],"voicing_staves":[1,1],"measureNumber":21,"keyFifths":0},{"startBeat":84,"durationBeats":4,"chordName":"F7","voicing":[63,69],"voicingNames":["E♭4","A4"],"voicing_staves":[1,1],"measureNumber":22,"keyFifths":0},{"startBeat":88,"durationBeats":4,"chordName":"C7","voicing":[64,70],"voicingNames":["E4","B♭4"],"voicing_staves":[1,1],"measureNumber":23,"keyFifths":0},{"startBeat":92,"durationBeats":4,"chordName":"G7","voicing":[65,71],"voicingNames":["F4","B4"],"voicing_staves":[1,1],"measureNumber":24,"keyFifths":0}],"lines":[{"speaker":"fai","ja":"C7から始まる！","en":"It starts on C7!","startBeat":0,"durationBeats":4},{"speaker":"jajii","ja":"F7に変わったぞ。","en":"Now F7.","startBeat":16,"durationBeats":4},{"speaker":"fai","ja":"G7が来た！","en":"Here comes G7!","startBeat":32,"durationBeats":4},{"speaker":"jajii","ja":"戻るんだ。C7じゃ。","en":"Back to C7.","startBeat":40,"durationBeats":4},{"speaker":"jajii","ja":"2周目じゃ。","en":"Second chorus.","startBeat":48,"durationBeats":4},{"speaker":"fai","ja":"曲の流れ、わかってきた！","en":"I feel the flow now!","startBeat":64,"durationBeats":4},{"speaker":"jajii","ja":"そろそろ終わるぞい。","en":"Almost done.","startBeat":80,"durationBeats":4},{"speaker":"fai","ja":"1周、通しで見えた！","en":"I saw the whole chorus!","startBeat":92,"durationBeats":4}],"endHoldBeats":4},{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"jajii","ja":"よし。ブルースの形がつながってきたのう。","en":"Good. The blues shape is connecting."},{"speaker":"fai","ja":"コードだけでも、曲っぽくなってきた！","en":"Even chords alone sound like a tune now!"},{"speaker":"jajii","ja":"次はリズムじゃ。1拍目だけをねらって弾く。","en":"Next is rhythm — aim for beat one only."},{"speaker":"fai","ja":"リズムに合わせて、1拍目だけコードを弾こう。","en":"Hit the chords on beat one with the groove."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
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
  '{"version":1,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideLobby":true,"hideMidiToggle":true,"hidePhraseIntroQuota":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{"mq-b1-q3-osmd":{"stage":{"slug":"mq-b1-q3-osmd","title":"1拍目だけ弾く","title_en":"Hit beat one","bpm":100,"key_fifths":0,"beats_per_measure":4,"beat_type":4,"loop_measures":24,"max_loops_per_phrase":2,"count_in_beats":0,"time_limit_sec":600,"player_hp":100,"enemy_hp":10000,"per_correct_note_damage":10,"good_completion_damage":30,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"chord_osmd","show_keyboard_hints_in_battle":true,"osmd_targets_from_score":true},"phrases":[{"order_index":0,"title":"Cブルース・1拍目","title_en":"C blues beat one","music_xml_url":"https://jazzify-cdn.com/sozai/2-3_count-in.musicxml","audio_url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_count-in.mp3","loop_duration_sec":60,"audio_duration_sec":60,"note_count":24,"key_fifths":0,"chords":[{"order_index":0,"chord_name":"C7","measure_number":2,"beat_offset":1,"duration_beats":4,"start_time_sec":2.4,"end_time_sec":4.8,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":1,"chord_name":"F7","measure_number":3,"beat_offset":1,"duration_beats":4,"start_time_sec":4.8,"end_time_sec":7.199999999999999,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":2,"chord_name":"C7","measure_number":4,"beat_offset":1,"duration_beats":4,"start_time_sec":7.199999999999999,"end_time_sec":9.6,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":3,"chord_name":"C7","measure_number":5,"beat_offset":1,"duration_beats":4,"start_time_sec":9.6,"end_time_sec":12,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":4,"chord_name":"F7","measure_number":6,"beat_offset":1,"duration_beats":4,"start_time_sec":12,"end_time_sec":14.4,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":5,"chord_name":"F7","measure_number":7,"beat_offset":1,"duration_beats":4,"start_time_sec":14.399999999999999,"end_time_sec":16.799999999999997,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":6,"chord_name":"C7","measure_number":8,"beat_offset":1,"duration_beats":4,"start_time_sec":16.8,"end_time_sec":19.2,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":7,"chord_name":"C7","measure_number":9,"beat_offset":1,"duration_beats":4,"start_time_sec":19.2,"end_time_sec":21.599999999999998,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":8,"chord_name":"G7","measure_number":10,"beat_offset":1,"duration_beats":4,"start_time_sec":21.599999999999998,"end_time_sec":23.999999999999996,"voicing":["F4","B4"],"voicing_staves":[1,1]},{"order_index":9,"chord_name":"F7","measure_number":11,"beat_offset":1,"duration_beats":4,"start_time_sec":24,"end_time_sec":26.4,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":10,"chord_name":"C7","measure_number":12,"beat_offset":1,"duration_beats":4,"start_time_sec":26.4,"end_time_sec":28.799999999999997,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":11,"chord_name":"G7","measure_number":13,"beat_offset":1,"duration_beats":4,"start_time_sec":28.799999999999997,"end_time_sec":31.199999999999996,"voicing":["F4","B4"],"voicing_staves":[1,1]},{"order_index":12,"chord_name":"C7","measure_number":14,"beat_offset":1,"duration_beats":4,"start_time_sec":31.2,"end_time_sec":33.6,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":13,"chord_name":"F7","measure_number":15,"beat_offset":1,"duration_beats":4,"start_time_sec":33.6,"end_time_sec":36,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":14,"chord_name":"C7","measure_number":16,"beat_offset":1,"duration_beats":4,"start_time_sec":36,"end_time_sec":38.4,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":15,"chord_name":"C7","measure_number":17,"beat_offset":1,"duration_beats":4,"start_time_sec":38.4,"end_time_sec":40.8,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":16,"chord_name":"F7","measure_number":18,"beat_offset":1,"duration_beats":4,"start_time_sec":40.8,"end_time_sec":43.199999999999996,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":17,"chord_name":"F7","measure_number":19,"beat_offset":1,"duration_beats":4,"start_time_sec":43.199999999999996,"end_time_sec":45.599999999999994,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":18,"chord_name":"C7","measure_number":20,"beat_offset":1,"duration_beats":4,"start_time_sec":45.6,"end_time_sec":48,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":19,"chord_name":"C7","measure_number":21,"beat_offset":1,"duration_beats":4,"start_time_sec":48,"end_time_sec":50.4,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":20,"chord_name":"G7","measure_number":22,"beat_offset":1,"duration_beats":4,"start_time_sec":50.4,"end_time_sec":52.8,"voicing":["F4","B4"],"voicing_staves":[1,1]},{"order_index":21,"chord_name":"F7","measure_number":23,"beat_offset":1,"duration_beats":4,"start_time_sec":52.8,"end_time_sec":55.199999999999996,"voicing":["E♭4","A4"],"voicing_staves":[1,1]},{"order_index":22,"chord_name":"C7","measure_number":24,"beat_offset":1,"duration_beats":4,"start_time_sec":55.199999999999996,"end_time_sec":57.599999999999994,"voicing":["E4","B♭4"],"voicing_staves":[1,1]},{"order_index":23,"chord_name":"G7","measure_number":25,"beat_offset":1,"duration_beats":4,"start_time_sec":57.599999999999994,"end_time_sec":59.99999999999999,"voicing":["F4","B4"],"voicing_staves":[1,1]}]}]}},"scenes":[{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"partner","ja":"流れが見えたら、次はリズムの上にコードを置く。","en":"Once you see the flow, place chords on the groove."},{"speaker":"player","ja":"1拍目だけ、シンプルに弾こう。","en":"Keep it simple — hit beat one."},{"speaker":"partner","ja":"今度は、リズムに合わせる練習じゃ。","en":"Now we practice with the groove."},{"speaker":"player","ja":"全部弾くんじゃなくて、1拍目だけ？","en":"Not every beat — just beat one?"},{"speaker":"partner","ja":"そうじゃ。まずは小節の頭を感じる。","en":"Aye. Feel the top of each bar first."},{"speaker":"player","ja":"コードが変わる場所を、ちゃんと踏むんだね。","en":"Land where the chords change."},{"speaker":"partner","ja":"うむ。ジャズは音だけでなく、時間に乗る音楽じゃ。","en":"Jazz rides time, not just notes."},{"speaker":"player","ja":"リズムを聴いて、各小節の1拍目にコードを弾こう。","en":"Listen and hit each chord on beat one."}]},{"type":"chord_osmd","contentRef":"mq-b1-q3-osmd","requiredLoops":1,"timedLines":[{"at":{"loop":0,"measure":2,"beat":1},"text":{"ja":"1拍目","en":"Beat 1"}}]},{"type":"dialogue_only","lineIntervalSeconds":4,"lines":[{"speaker":"partner","ja":"見事じゃ。コードをリズムに乗せられたのう。","en":"Well done. You rode the rhythm with your chords."},{"speaker":"player","ja":"ただ押すより、音楽っぽくなった！","en":"It feels more musical than just pressing keys!"},{"speaker":"partner","ja":"これでCブルースの土台はできた。","en":"The foundation of C blues is in place."},{"speaker":"player","ja":"次はもっと自由に弾けそう！","en":"I feel ready to play more freely!"},{"speaker":"partner","ja":"うむ。響きとリズムの上で、アドリブは育つのじゃ。","en":"Aye. Ad-lib grows on harmony and rhythm."},{"speaker":"player","ja":"次のクエストへ進もう。","en":"On to the next quest."}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();


COMMIT;
