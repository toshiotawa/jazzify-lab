-- Developer test course: Rock With You full progression; Moanin / Killer Joe use Sir Duke chords
BEGIN;

UPDATE public.survival_stages
SET
  chord_progression = '[{"name":"Ebm7","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-3},{"name":"Ab","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4},{"name":"Bb / Ab","voicing":[58,62,65],"voicing_names":["Bb3","D4","F4"],"key_fifths":-3},{"name":"Ebm7","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-3},{"name":"Ab","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4},{"name":"Cb / Db","voicing":[59,62,66],"voicing_names":["B3","D4","F#4"],"key_fifths":-5},{"name":"Ebm7","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-3},{"name":"Ab","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4},{"name":"Bb / Ab","voicing":[58,62,65],"voicing_names":["Bb3","D4","F4"],"key_fifths":-3},{"name":"Gb / Ab","voicing":[54,58,61],"voicing_names":["Gb3","Bb3","Db4"],"key_fifths":-6},{"name":"Ab","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4}]'::jsonb,
  updated_at = now()
WHERE map_category = 'basic'
  AND stage_number BETWEEN 201 AND 204
  AND play_mode = 'code_run'
  AND block_key = 'rock_with_you';

UPDATE public.survival_stages
SET
  chord_progression = '[{"name":"BM7(9)","voicing":[58,61,63,66],"voicing_names":["A#3","C#4","D#4","F#4"],"key_fifths":5},{"name":"Fm7(9)","voicing":[56,60,63,67],"voicing_names":["Ab3","C4","Eb4","G4"],"key_fifths":1},{"name":"EM7(9)","voicing":[56,59,63,66],"voicing_names":["G#3","B3","D#4","F#4"],"key_fifths":4},{"name":"D#m7","voicing":[58,61,63,66],"voicing_names":["A#3","C#4","D#4","F#4"],"key_fifths":3},{"name":"C#m7(9)","voicing":[59,63,64,68],"voicing_names":["B3","D#4","E4","G#4"],"key_fifths":5},{"name":"C#m7(9) / F#","voicing":[59,63,64,68],"voicing_names":["B3","D#4","E4","G#4"],"key_fifths":5}]'::jsonb,
  updated_at = now()
WHERE map_category = 'basic'
  AND stage_number BETWEEN 195 AND 200
  AND play_mode = 'code_run'
  AND block_key IN ('moanin', 'killer_joe');

UPDATE public.lessons
SET
  description = 'Moanin マップのプレイテスト用です。出題コードは Sir Duke と同じ進行です。',
  description_en = 'Map playtest for Moanin stages. Chord progression matches Sir Duke.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-moanin-lesson');

UPDATE public.lessons
SET
  description = 'Killer Joe マップのプレイテスト用です。出題コードは Sir Duke と同じ進行です。',
  description_en = 'Map playtest for Killer Joe stages. Chord progression matches Sir Duke.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-killer-joe-lesson');

UPDATE public.lessons
SET
  description = 'Rock With You のフル進行（11コード）を big underground / tower / crate tower / snow climb マップでプレイする開発者向けテストです。',
  description_en = 'Developer test for the full Rock With You progression (11 chords) on four specialty Code Run maps.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-rock-with-you-lesson');

UPDATE public.lesson_songs
SET
  title = '課題（big_underground）',
  title_en = 'Assignment (big_underground)'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-rock-lsong-a');

UPDATE public.lesson_songs
SET
  title = '課題（tower）',
  title_en = 'Assignment (tower)'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-rock-lsong-b');

UPDATE public.lesson_songs
SET
  title = '課題（crate_tower）',
  title_en = 'Assignment (crate_tower)'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-rock-lsong-c');

UPDATE public.lesson_songs
SET
  title = '課題（snow_climb）',
  title_en = 'Assignment (snow_climb)'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-rock-lsong-d');

COMMIT;
