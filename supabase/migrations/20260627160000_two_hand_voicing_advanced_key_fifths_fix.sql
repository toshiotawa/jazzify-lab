-- 両手ヴォイシング上級: key_fifths 機能度数修正 (Im7 / ImM7 / IIm7b5 / bVII7 / V7alt)
BEGIN;

UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-quiz')
  AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-quiz')
  AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-quiz')
  AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-quiz')
  AND order_index = 3;
UPDATE public.ear_training_phrases
SET key_fifths = -3, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p1-voicing-ph0');

UPDATE public.survival_stages
SET chord_progression = '[{"name":"Cm7","voicing":[48,53,58,63,67],"voicing_names":["C3","F3","Bb3","Eb4","G4"],"key_fifths":-3,"voicing_staves":[2,2,1,1,1]},{"name":"Fm7","voicing":[53,58,63,68,72],"voicing_names":["F3","Bb3","Eb4","Ab4","C5"],"key_fifths":-4,"voicing_staves":[2,2,1,1,1]},{"name":"Bbm7","voicing":[58,63,68,73,77],"voicing_names":["Bb3","Eb4","Ab4","Db5","F5"],"key_fifths":-5,"voicing_staves":[2,1,1,1,1]},{"name":"Ebm7","voicing":[51,56,61,66,70],"voicing_names":["Eb3","Ab3","Db4","Gb4","Bb4"],"key_fifths":-6,"voicing_staves":[2,2,1,1,1]}]'::jsonb, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 1253;

UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-quiz')
  AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-quiz')
  AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-quiz')
  AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-quiz')
  AND order_index = 3;
UPDATE public.ear_training_phrases
SET key_fifths = 4, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p2-voicing-ph0');

UPDATE public.survival_stages
SET chord_progression = '[{"name":"C#m7","voicing":[49,54,59,64,68],"voicing_names":["C#3","F#3","B3","E4","G#4"],"key_fifths":4,"voicing_staves":[2,2,1,1,1]},{"name":"F#m7","voicing":[54,59,64,69,73],"voicing_names":["F#3","B3","E4","A4","C#5"],"key_fifths":3,"voicing_staves":[2,2,1,1,1]},{"name":"Bm7","voicing":[59,64,69,74,78],"voicing_names":["B3","E4","A4","D5","F#5"],"key_fifths":2,"voicing_staves":[2,1,1,1,1]},{"name":"Em7","voicing":[52,57,62,67,71],"voicing_names":["E3","A3","D4","G4","B4"],"key_fifths":1,"voicing_staves":[2,2,1,1,1]}]'::jsonb, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 1254;

UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-quiz')
  AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-quiz')
  AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-quiz')
  AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-quiz')
  AND order_index = 3;
UPDATE public.ear_training_phrases
SET key_fifths = -2, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-p3-voicing-ph0');

UPDATE public.survival_stages
SET chord_progression = '[{"name":"Gm7","voicing":[55,60,65,70,74],"voicing_names":["G3","C4","F4","Bb4","D5"],"key_fifths":-2,"voicing_staves":[2,1,1,1,1]},{"name":"Am7","voicing":[57,62,67,72,76],"voicing_names":["A3","D4","G4","C5","E5"],"key_fifths":0,"voicing_staves":[2,1,1,1,1]},{"name":"Dm7","voicing":[50,55,60,65,69],"voicing_names":["D3","G3","C4","F4","A4"],"key_fifths":-1,"voicing_staves":[2,2,1,1,1]},{"name":"G#m7","voicing":[56,61,66,71,75],"voicing_names":["G#3","C#4","F#4","B4","D#5"],"key_fifths":5,"voicing_staves":[2,1,1,1,1]}]'::jsonb, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 1255;

UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz')
  AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz')
  AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz')
  AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz')
  AND order_index = 3;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz')
  AND order_index = 4;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz')
  AND order_index = 5;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz')
  AND order_index = 6;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz')
  AND order_index = 7;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz')
  AND order_index = 8;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz')
  AND order_index = 9;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz')
  AND order_index = 10;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7-summary-quiz')
  AND order_index = 11;
UPDATE public.survival_stages
SET chord_progression = '[{"name":"Cm7","voicing":[48,53,58,63,67],"voicing_names":["C3","F3","Bb3","Eb4","G4"],"key_fifths":-3,"voicing_staves":[2,2,1,1,1]},{"name":"Fm7","voicing":[53,58,63,68,72],"voicing_names":["F3","Bb3","Eb4","Ab4","C5"],"key_fifths":-4,"voicing_staves":[2,2,1,1,1]},{"name":"Bbm7","voicing":[58,63,68,73,77],"voicing_names":["Bb3","Eb4","Ab4","Db5","F5"],"key_fifths":-5,"voicing_staves":[2,1,1,1,1]},{"name":"Ebm7","voicing":[51,56,61,66,70],"voicing_names":["Eb3","Ab3","Db4","Gb4","Bb4"],"key_fifths":-6,"voicing_staves":[2,2,1,1,1]},{"name":"C#m7","voicing":[49,54,59,64,68],"voicing_names":["C#3","F#3","B3","E4","G#4"],"key_fifths":4,"voicing_staves":[2,2,1,1,1]},{"name":"F#m7","voicing":[54,59,64,69,73],"voicing_names":["F#3","B3","E4","A4","C#5"],"key_fifths":3,"voicing_staves":[2,2,1,1,1]},{"name":"Bm7","voicing":[59,64,69,74,78],"voicing_names":["B3","E4","A4","D5","F#5"],"key_fifths":2,"voicing_staves":[2,1,1,1,1]},{"name":"Em7","voicing":[52,57,62,67,71],"voicing_names":["E3","A3","D4","G4","B4"],"key_fifths":1,"voicing_staves":[2,2,1,1,1]},{"name":"Gm7","voicing":[55,60,65,70,74],"voicing_names":["G3","C4","F4","Bb4","D5"],"key_fifths":-2,"voicing_staves":[2,1,1,1,1]},{"name":"Am7","voicing":[57,62,67,72,76],"voicing_names":["A3","D4","G4","C5","E5"],"key_fifths":0,"voicing_staves":[2,1,1,1,1]},{"name":"Dm7","voicing":[50,55,60,65,69],"voicing_names":["D3","G3","C4","F4","A4"],"key_fifths":-1,"voicing_staves":[2,2,1,1,1]},{"name":"G#m7","voicing":[56,61,66,71,75],"voicing_names":["G#3","C#4","F#4","B4","D#5"],"key_fifths":5,"voicing_staves":[2,1,1,1,1]}]'::jsonb, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 1256;

UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-quiz')
  AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-quiz')
  AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-quiz')
  AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-quiz')
  AND order_index = 3;
UPDATE public.ear_training_phrases
SET key_fifths = -3, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p1-voicing-ph0');

UPDATE public.survival_stages
SET chord_progression = '[{"name":"G7alt","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":-3,"voicing_staves":[2,2,1,1,1]},{"name":"C7alt","voicing":[58,64,68,72,75],"voicing_names":["Bb3","Fb4","Ab4","C5","Eb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1,1]},{"name":"F7alt","voicing":[51,57,61,65,68],"voicing_names":["Eb3","Bbb3","Db4","F4","Ab4"],"key_fifths":-5,"voicing_staves":[2,2,1,1,1]},{"name":"Bb7alt","voicing":[56,62,66,70,73],"voicing_names":["Ab3","Ebb4","Gb4","Bb4","Db5"],"key_fifths":-6,"voicing_staves":[2,1,1,1,1]}]'::jsonb, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 1261;

UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-quiz')
  AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-quiz')
  AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-quiz')
  AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-quiz')
  AND order_index = 3;
UPDATE public.ear_training_phrases
SET key_fifths = 5, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p2-voicing-ph0');

UPDATE public.survival_stages
SET chord_progression = '[{"name":"Eb7alt","voicing":[49,55,59,63,66],"voicing_names":["Db3","Abb3","Cb4","Eb4","Gb4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]},{"name":"Ab7alt","voicing":[54,60,64,68,71],"voicing_names":["Gb3","Dbb4","Fb4","Ab4","Cb5"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"Db7alt","voicing":[59,65,69,73,76],"voicing_names":["Cb4","Gbb4","Bbb4","Db5","Fb5"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]},{"name":"F#7alt","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]}]'::jsonb, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 1262;

UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-quiz')
  AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-quiz')
  AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-quiz')
  AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-quiz')
  AND order_index = 3;
UPDATE public.ear_training_phrases
SET key_fifths = 1, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-p3-voicing-ph0');

UPDATE public.survival_stages
SET chord_progression = '[{"name":"B7alt","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]},{"name":"E7alt","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"A7alt","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]},{"name":"D7alt","voicing":[48,54,58,62,65],"voicing_names":["C3","Gb3","Bb3","D4","F4"],"key_fifths":-2,"voicing_staves":[2,2,1,1,1]}]'::jsonb, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 1263;

UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz')
  AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz')
  AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz')
  AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz')
  AND order_index = 3;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz')
  AND order_index = 4;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz')
  AND order_index = 5;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz')
  AND order_index = 6;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz')
  AND order_index = 7;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz')
  AND order_index = 8;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz')
  AND order_index = 9;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz')
  AND order_index = 10;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7alt-summary-quiz')
  AND order_index = 11;
UPDATE public.survival_stages
SET chord_progression = '[{"name":"G7alt","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":-3,"voicing_staves":[2,2,1,1,1]},{"name":"C7alt","voicing":[58,64,68,72,75],"voicing_names":["Bb3","Fb4","Ab4","C5","Eb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1,1]},{"name":"F7alt","voicing":[51,57,61,65,68],"voicing_names":["Eb3","Bbb3","Db4","F4","Ab4"],"key_fifths":-5,"voicing_staves":[2,2,1,1,1]},{"name":"Bb7alt","voicing":[56,62,66,70,73],"voicing_names":["Ab3","Ebb4","Gb4","Bb4","Db5"],"key_fifths":-6,"voicing_staves":[2,1,1,1,1]},{"name":"Eb7alt","voicing":[49,55,59,63,66],"voicing_names":["Db3","Abb3","Cb4","Eb4","Gb4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]},{"name":"Ab7alt","voicing":[54,60,64,68,71],"voicing_names":["Gb3","Dbb4","Fb4","Ab4","Cb5"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"Db7alt","voicing":[59,65,69,73,76],"voicing_names":["Cb4","Gbb4","Bbb4","Db5","Fb5"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]},{"name":"F#7alt","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]},{"name":"B7alt","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]},{"name":"E7alt","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"A7alt","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]},{"name":"D7alt","voicing":[48,54,58,62,65],"voicing_names":["C3","Gb3","Bb3","D4","F4"],"key_fifths":-2,"voicing_staves":[2,2,1,1,1]}]'::jsonb, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 1264;

UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-quiz')
  AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-quiz')
  AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-quiz')
  AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-quiz')
  AND order_index = 3;
UPDATE public.ear_training_phrases
SET key_fifths = -3, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p1-voicing-ph0');

UPDATE public.survival_stages
SET chord_progression = '[{"name":"CmM7","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":-3,"voicing_staves":[2,1,1,1,1]},{"name":"FmM7","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":-4,"voicing_staves":[2,2,1,1,1]},{"name":"BbmM7","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":-5,"voicing_staves":[2,1,1,1,1]},{"name":"EbmM7","voicing":[48,54,58,62,65],"voicing_names":["C3","Gb3","Bb3","D4","F4"],"key_fifths":-6,"voicing_staves":[2,2,1,1,1]}]'::jsonb, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 1272;

UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-quiz')
  AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-quiz')
  AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-quiz')
  AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-quiz')
  AND order_index = 3;
UPDATE public.ear_training_phrases
SET key_fifths = 5, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p2-voicing-ph0');

UPDATE public.survival_stages
SET chord_progression = '[{"name":"AbmM7","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]},{"name":"DbmM7","voicing":[58,64,68,72,75],"voicing_names":["Bb3","Fb4","Ab4","C5","Eb5"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"GbmM7","voicing":[51,57,61,65,68],"voicing_names":["Eb3","Bbb3","Db4","F4","Ab4"],"key_fifths":3,"voicing_staves":[2,2,1,1,1]},{"name":"BmM7","voicing":[56,62,66,70,73],"voicing_names":["G#3","D4","F#4","A#4","C#5"],"key_fifths":2,"voicing_staves":[2,1,1,1,1]}]'::jsonb, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 1273;

UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-quiz')
  AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-quiz')
  AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-quiz')
  AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-quiz')
  AND order_index = 3;
UPDATE public.ear_training_phrases
SET key_fifths = 1, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-p3-voicing-ph0');

UPDATE public.survival_stages
SET chord_progression = '[{"name":"EmM7","voicing":[49,55,59,63,66],"voicing_names":["C#3","G3","B3","D#4","F#4"],"key_fifths":1,"voicing_staves":[2,2,1,1,1]},{"name":"AmM7","voicing":[54,60,64,68,71],"voicing_names":["F#3","C4","E4","G#4","B4"],"key_fifths":0,"voicing_staves":[2,1,1,1,1]},{"name":"DmM7","voicing":[59,65,69,73,76],"voicing_names":["B3","F4","A4","C#5","E5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]},{"name":"GmM7","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":-2,"voicing_staves":[2,2,1,1,1]}]'::jsonb, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 1274;

UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz')
  AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz')
  AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz')
  AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz')
  AND order_index = 3;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz')
  AND order_index = 4;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz')
  AND order_index = 5;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz')
  AND order_index = 6;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz')
  AND order_index = 7;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz')
  AND order_index = 8;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz')
  AND order_index = 9;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz')
  AND order_index = 10;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-mm7-summary-quiz')
  AND order_index = 11;
UPDATE public.survival_stages
SET chord_progression = '[{"name":"CmM7","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":-3,"voicing_staves":[2,1,1,1,1]},{"name":"FmM7","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":-4,"voicing_staves":[2,2,1,1,1]},{"name":"BbmM7","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":-5,"voicing_staves":[2,1,1,1,1]},{"name":"EbmM7","voicing":[48,54,58,62,65],"voicing_names":["C3","Gb3","Bb3","D4","F4"],"key_fifths":-6,"voicing_staves":[2,2,1,1,1]},{"name":"AbmM7","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]},{"name":"DbmM7","voicing":[58,64,68,72,75],"voicing_names":["Bb3","Fb4","Ab4","C5","Eb5"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"GbmM7","voicing":[51,57,61,65,68],"voicing_names":["Eb3","Bbb3","Db4","F4","Ab4"],"key_fifths":3,"voicing_staves":[2,2,1,1,1]},{"name":"BmM7","voicing":[56,62,66,70,73],"voicing_names":["G#3","D4","F#4","A#4","C#5"],"key_fifths":2,"voicing_staves":[2,1,1,1,1]},{"name":"EmM7","voicing":[49,55,59,63,66],"voicing_names":["C#3","G3","B3","D#4","F#4"],"key_fifths":1,"voicing_staves":[2,2,1,1,1]},{"name":"AmM7","voicing":[54,60,64,68,71],"voicing_names":["F#3","C4","E4","G#4","B4"],"key_fifths":0,"voicing_staves":[2,1,1,1,1]},{"name":"DmM7","voicing":[59,65,69,73,76],"voicing_names":["B3","F4","A4","C#5","E5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]},{"name":"GmM7","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":-2,"voicing_staves":[2,2,1,1,1]}]'::jsonb, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 1275;

UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-quiz')
  AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-quiz')
  AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-quiz')
  AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-quiz')
  AND order_index = 3;
UPDATE public.ear_training_phrases
SET key_fifths = 1, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p1-voicing-ph0');

UPDATE public.survival_stages
SET chord_progression = '[{"name":"Am7b5","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]},{"name":"Dm7b5","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"Gm7b5","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]},{"name":"Cm7b5","voicing":[48,54,58,62,65],"voicing_names":["C3","Gb3","Bb3","D4","F4"],"key_fifths":-2,"voicing_staves":[2,2,1,1,1]}]'::jsonb, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 1276;

UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-quiz')
  AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-quiz')
  AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-quiz')
  AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-quiz')
  AND order_index = 3;
UPDATE public.ear_training_phrases
SET key_fifths = -3, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p2-voicing-ph0');

UPDATE public.survival_stages
SET chord_progression = '[{"name":"Fm7b5","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":-3,"voicing_staves":[2,2,1,1,1]},{"name":"Bbm7b5","voicing":[58,64,68,72,75],"voicing_names":["Bb3","Fb4","Ab4","C5","Eb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1,1]},{"name":"Ebm7b5","voicing":[51,57,61,65,68],"voicing_names":["Eb3","Bbb3","Db4","F4","Ab4"],"key_fifths":-5,"voicing_staves":[2,2,1,1,1]},{"name":"G#m7b5","voicing":[56,62,66,70,73],"voicing_names":["G#3","D4","F#4","A#4","C#5"],"key_fifths":-6,"voicing_staves":[2,1,1,1,1]}]'::jsonb, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 1277;

UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-quiz')
  AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-quiz')
  AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-quiz')
  AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-quiz')
  AND order_index = 3;
UPDATE public.ear_training_phrases
SET key_fifths = 5, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-p3-voicing-ph0');

UPDATE public.survival_stages
SET chord_progression = '[{"name":"C#m7b5","voicing":[49,55,59,63,66],"voicing_names":["C#3","G3","B3","D#4","F#4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]},{"name":"F#m7b5","voicing":[54,60,64,68,71],"voicing_names":["F#3","C4","E4","G#4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"Bm7b5","voicing":[59,65,69,73,76],"voicing_names":["B3","F4","A4","C#5","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]},{"name":"Em7b5","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]}]'::jsonb, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 1278;

UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz')
  AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz')
  AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz')
  AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz')
  AND order_index = 3;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz')
  AND order_index = 4;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz')
  AND order_index = 5;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz')
  AND order_index = 6;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz')
  AND order_index = 7;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz')
  AND order_index = 8;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz')
  AND order_index = 9;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz')
  AND order_index = 10;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-m7b5-summary-quiz')
  AND order_index = 11;
UPDATE public.survival_stages
SET chord_progression = '[{"name":"Am7b5","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]},{"name":"Dm7b5","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"Gm7b5","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]},{"name":"Cm7b5","voicing":[48,54,58,62,65],"voicing_names":["C3","Gb3","Bb3","D4","F4"],"key_fifths":-2,"voicing_staves":[2,2,1,1,1]},{"name":"Fm7b5","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":-3,"voicing_staves":[2,2,1,1,1]},{"name":"Bbm7b5","voicing":[58,64,68,72,75],"voicing_names":["Bb3","Fb4","Ab4","C5","Eb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1,1]},{"name":"Ebm7b5","voicing":[51,57,61,65,68],"voicing_names":["Eb3","Bbb3","Db4","F4","Ab4"],"key_fifths":-5,"voicing_staves":[2,2,1,1,1]},{"name":"G#m7b5","voicing":[56,62,66,70,73],"voicing_names":["G#3","D4","F#4","A#4","C#5"],"key_fifths":-6,"voicing_staves":[2,1,1,1,1]},{"name":"C#m7b5","voicing":[49,55,59,63,66],"voicing_names":["C#3","G3","B3","D#4","F#4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]},{"name":"F#m7b5","voicing":[54,60,64,68,71],"voicing_names":["F#3","C4","E4","G#4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"Bm7b5","voicing":[59,65,69,73,76],"voicing_names":["B3","F4","A4","C#5","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]},{"name":"Em7b5","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]}]'::jsonb, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 1279;

UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-quiz')
  AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-quiz')
  AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-quiz')
  AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-quiz')
  AND order_index = 3;
UPDATE public.ear_training_phrases
SET key_fifths = 2, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p1-voicing-ph0');

UPDATE public.survival_stages
SET chord_progression = '[{"name":"C7","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]},{"name":"F7","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]},{"name":"Bb7","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"Eb7","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]}]'::jsonb, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 1280;

UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-quiz')
  AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-quiz')
  AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-quiz')
  AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-quiz')
  AND order_index = 3;
UPDATE public.ear_training_phrases
SET key_fifths = -2, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p2-voicing-ph0');

UPDATE public.survival_stages
SET chord_progression = '[{"name":"Ab7","voicing":[48,54,58,62,65],"voicing_names":["C3","Gb3","Bb3","D4","F4"],"key_fifths":-2,"voicing_staves":[2,2,1,1,1]},{"name":"Db7","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":-3,"voicing_staves":[2,2,1,1,1]},{"name":"Gb7","voicing":[58,64,68,72,75],"voicing_names":["Bb3","Fb4","Ab4","C5","Eb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1,1]},{"name":"B7","voicing":[51,57,61,65,68],"voicing_names":["D#3","A3","C#4","E#4","G#4"],"key_fifths":-5,"voicing_staves":[2,2,1,1,1]}]'::jsonb, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 1281;

UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-quiz')
  AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-quiz')
  AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-quiz')
  AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-quiz')
  AND order_index = 3;
UPDATE public.ear_training_phrases
SET key_fifths = -6, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-p3-voicing-ph0');

UPDATE public.survival_stages
SET chord_progression = '[{"name":"E7","voicing":[56,62,66,70,73],"voicing_names":["G#3","D4","F#4","A#4","C#5"],"key_fifths":-6,"voicing_staves":[2,1,1,1,1]},{"name":"A7","voicing":[49,55,59,63,66],"voicing_names":["C#3","G3","B3","D#4","F#4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]},{"name":"D7","voicing":[54,60,64,68,71],"voicing_names":["F#3","C4","E4","G#4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"G7","voicing":[59,65,69,73,76],"voicing_names":["B3","F4","A4","C#5","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]}]'::jsonb, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 1282;

UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz')
  AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz')
  AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz')
  AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz')
  AND order_index = 3;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz')
  AND order_index = 4;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz')
  AND order_index = 5;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz')
  AND order_index = 6;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz')
  AND order_index = 7;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz')
  AND order_index = 8;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz')
  AND order_index = 9;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz')
  AND order_index = 10;
UPDATE public.ear_training_chord_quiz_items
SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'thva-b1-7s11-summary-quiz')
  AND order_index = 11;
UPDATE public.survival_stages
SET chord_progression = '[{"name":"C7","voicing":[52,58,62,66,69],"voicing_names":["E3","Bb3","D4","F#4","A4"],"key_fifths":2,"voicing_staves":[2,2,1,1,1]},{"name":"F7","voicing":[57,63,67,71,74],"voicing_names":["A3","Eb4","G4","B4","D5"],"key_fifths":1,"voicing_staves":[2,1,1,1,1]},{"name":"Bb7","voicing":[50,56,60,64,67],"voicing_names":["D3","Ab3","C4","E4","G4"],"key_fifths":0,"voicing_staves":[2,2,1,1,1]},{"name":"Eb7","voicing":[55,61,65,69,72],"voicing_names":["G3","Db4","F4","A4","C5"],"key_fifths":-1,"voicing_staves":[2,1,1,1,1]},{"name":"Ab7","voicing":[48,54,58,62,65],"voicing_names":["C3","Gb3","Bb3","D4","F4"],"key_fifths":-2,"voicing_staves":[2,2,1,1,1]},{"name":"Db7","voicing":[53,59,63,67,70],"voicing_names":["F3","Cb4","Eb4","G4","Bb4"],"key_fifths":-3,"voicing_staves":[2,2,1,1,1]},{"name":"Gb7","voicing":[58,64,68,72,75],"voicing_names":["Bb3","Fb4","Ab4","C5","Eb5"],"key_fifths":-4,"voicing_staves":[2,1,1,1,1]},{"name":"B7","voicing":[51,57,61,65,68],"voicing_names":["D#3","A3","C#4","E#4","G#4"],"key_fifths":-5,"voicing_staves":[2,2,1,1,1]},{"name":"E7","voicing":[56,62,66,70,73],"voicing_names":["G#3","D4","F#4","A#4","C#5"],"key_fifths":-6,"voicing_staves":[2,1,1,1,1]},{"name":"A7","voicing":[49,55,59,63,66],"voicing_names":["C#3","G3","B3","D#4","F#4"],"key_fifths":5,"voicing_staves":[2,2,1,1,1]},{"name":"D7","voicing":[54,60,64,68,71],"voicing_names":["F#3","C4","E4","G#4","B4"],"key_fifths":4,"voicing_staves":[2,1,1,1,1]},{"name":"G7","voicing":[59,65,69,73,76],"voicing_names":["B3","F4","A4","C#5","E5"],"key_fifths":3,"voicing_staves":[2,1,1,1,1]}]'::jsonb, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 1283;

COMMIT;
