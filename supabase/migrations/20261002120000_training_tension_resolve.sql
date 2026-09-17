-- Training: tension resolve voicings
BEGIN;

INSERT INTO public.training_categories (
  id, slug, title_ja, title_en, description_ja, description_en, sort_order, is_free
) VALUES (
  uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-tension_resolve'),
  'tension_resolve',
  'テンションリゾルブ',
  'Tension Resolve',
  'テンションからルートへ解決する両手ヴォイシングを、1小節に2〜3ヴォイシング並べて練習します。
1ヴォイシング完成で攻撃。最初のヴォイシング完成時のみルート音が鳴ります。
In C固定（移調楽器の影響なし）。コード進行は調号付き。',
  'Practice two-hand voicings that resolve tension to the root, with 2–3 voicings per measure.
Complete each voicing to attack. The root sounds only when you complete the first voicing.
Concert pitch (In C). Progressions use key signatures.',
  15,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title_ja = EXCLUDED.title_ja,
  title_en = EXCLUDED.title_en,
  description_ja = EXCLUDED.description_ja,
  description_en = EXCLUDED.description_en,
  sort_order = EXCLUDED.sort_order,
  is_free = EXCLUDED.is_free,
  updated_at = now();

INSERT INTO public.trainings (
  id, category_id, slug, title_ja, title_en, sort_order, kind,
  clef_mode, use_key_signature, play_root_on_correct, bgm_url, config, is_active
) VALUES
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-tension-resolve-m7'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-tension_resolve'),
    'tension-resolve-m7',
    'm7',
    'm7',
    1,
    'progression',
    'grand_concert',
    false,
    true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    '{"progression":[{"name":"Cm7","voicing":[50,55,58,65],"voicing_names":["D3","G3","Bb3","F4"],"voicing_staves":[2,2,2,1,2,1],"key_fifths":0,"voicing_slots":[["D3","G3","Bb3","F4"],["C3","Eb4"]]},{"name":"Dbm7","voicing":[51,56,59,66],"voicing_names":["Eb3","Ab3","Cb4","Gb4"],"voicing_staves":[2,2,2,1,2,1],"key_fifths":0,"voicing_slots":[["Eb3","Ab3","Cb4","Gb4"],["Db3","Fb4"]]},{"name":"Dm7","voicing":[52,57,60,67],"voicing_names":["E3","A3","C4","G4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["E3","A3","C4","G4"],["D3","F4"]]},{"name":"Ebm7","voicing":[53,58,61,68],"voicing_names":["F3","Bb3","Db4","Ab4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["F3","Bb3","Db4","Ab4"],["Eb3","Gb4"]]},{"name":"Em7","voicing":[54,59,62,69],"voicing_names":["F#3","B3","D4","A4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["F#3","B3","D4","A4"],["E3","G4"]]},{"name":"Fm7","voicing":[55,60,63,70],"voicing_names":["G3","C4","Eb4","Bb4"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["G3","C4","Eb4","Bb4"],["F3","Ab4"]]},{"name":"Gbm7","voicing":[56,61,64,71],"voicing_names":["Ab3","Db4","Fb4","Cb5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["Ab3","Db4","Fb4","Cb5"],["Gb3","Bbb4"]]},{"name":"Gm7","voicing":[57,62,65,72],"voicing_names":["A3","D4","F4","C5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["A3","D4","F4","C5"],["G3","Bb4"]]},{"name":"Abm7","voicing":[58,63,66,73],"voicing_names":["Bb3","Eb4","Gb4","Db5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["Bb3","Eb4","Gb4","Db5"],["Ab3","Cb5"]]},{"name":"Am7","voicing":[59,64,67,74],"voicing_names":["B3","E4","G4","D5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["B3","E4","G4","D5"],["A3","C5"]]},{"name":"Bbm7","voicing":[60,65,68,75],"voicing_names":["C4","F4","Ab4","Eb5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["C4","F4","Ab4","Eb5"],["Bb3","Db5"]]},{"name":"Bm7","voicing":[61,66,69,76],"voicing_names":["C#4","F#4","A4","E5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["C#4","F#4","A4","E5"],["B3","D5"]]}],"unit_size":1,"shuffle_units":true,"score_per_voicing":true,"play_root_on_first_voicing_complete":true}'::jsonb,
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-tension-resolve-maj7'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-tension_resolve'),
    'tension-resolve-maj7',
    'M7',
    'M7',
    2,
    'progression',
    'grand_concert',
    false,
    true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    '{"progression":[{"name":"CM7","voicing":[59,64,67,74],"voicing_names":["B3","E4","G4","D5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["B3","E4","G4","D5"],["A3","C5"]]},{"name":"DbM7","voicing":[60,65,68,75],"voicing_names":["C4","F4","Ab4","Eb5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["C4","F4","Ab4","Eb5"],["Bb3","Db5"]]},{"name":"DM7","voicing":[61,66,69,76],"voicing_names":["C#4","F#4","A4","E5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["C#4","F#4","A4","E5"],["B3","D5"]]},{"name":"EbM7","voicing":[50,55,58,65],"voicing_names":["D3","G3","Bb3","F4"],"voicing_staves":[2,2,2,1,2,1],"key_fifths":0,"voicing_slots":[["D3","G3","Bb3","F4"],["C3","Eb4"]]},{"name":"EM7","voicing":[51,56,59,66],"voicing_names":["D#3","G#3","B3","F#4"],"voicing_staves":[2,2,2,1,2,1],"key_fifths":0,"voicing_slots":[["D#3","G#3","B3","F#4"],["C#3","E4"]]},{"name":"FM7","voicing":[52,57,60,67],"voicing_names":["E3","A3","C4","G4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["E3","A3","C4","G4"],["D3","F4"]]},{"name":"GbM7","voicing":[53,58,61,68],"voicing_names":["F3","Bb3","Db4","Ab4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["F3","Bb3","Db4","Ab4"],["Eb3","Gb4"]]},{"name":"GM7","voicing":[54,59,62,69],"voicing_names":["F#3","B3","D4","A4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["F#3","B3","D4","A4"],["E3","G4"]]},{"name":"AbM7","voicing":[55,60,63,70],"voicing_names":["G3","C4","Eb4","Bb4"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["G3","C4","Eb4","Bb4"],["F3","Ab4"]]},{"name":"AM7","voicing":[56,61,64,71],"voicing_names":["G#3","C#4","E4","B4"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["G#3","C#4","E4","B4"],["F#3","A4"]]},{"name":"BbM7","voicing":[57,62,65,72],"voicing_names":["A3","D4","F4","C5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["A3","D4","F4","C5"],["G3","Bb4"]]},{"name":"BM7","voicing":[58,63,66,73],"voicing_names":["A#3","D#4","F#4","C#5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["A#3","D#4","F#4","C#5"],["G#3","B4"]]}],"unit_size":1,"shuffle_units":true,"score_per_voicing":true,"play_root_on_first_voicing_complete":true}'::jsonb,
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-tension-resolve-7-mixo'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-tension_resolve'),
    'tension-resolve-7-mixo',
    '7(mixo)',
    '7(mixo)',
    3,
    'progression',
    'grand_concert',
    false,
    true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    '{"progression":[{"name":"C7(mixo)","voicing":[57,62,65,72],"voicing_names":["A3","D4","F4","C5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["A3","D4","F4","C5"],["G3","Bb4"]]},{"name":"Db7(mixo)","voicing":[58,63,66,73],"voicing_names":["Bb3","Eb4","Gb4","Db5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["Bb3","Eb4","Gb4","Db5"],["Ab3","Cb5"]]},{"name":"D7(mixo)","voicing":[59,64,67,74],"voicing_names":["B3","E4","G4","D5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["B3","E4","G4","D5"],["A3","C5"]]},{"name":"Eb7(mixo)","voicing":[60,65,68,75],"voicing_names":["C4","F4","Ab4","Eb5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["C4","F4","Ab4","Eb5"],["Bb3","Db5"]]},{"name":"E7(mixo)","voicing":[61,66,69,76],"voicing_names":["C#4","F#4","A4","E5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["C#4","F#4","A4","E5"],["B3","D5"]]},{"name":"F7(mixo)","voicing":[50,55,58,65],"voicing_names":["D3","G3","Bb3","F4"],"voicing_staves":[2,2,2,1,2,1],"key_fifths":0,"voicing_slots":[["D3","G3","Bb3","F4"],["C3","Eb4"]]},{"name":"Gb7(mixo)","voicing":[51,56,59,66],"voicing_names":["Eb3","Ab3","Cb4","Gb4"],"voicing_staves":[2,2,2,1,2,1],"key_fifths":0,"voicing_slots":[["Eb3","Ab3","Cb4","Gb4"],["Db3","Fb4"]]},{"name":"G7(mixo)","voicing":[52,57,60,67],"voicing_names":["E3","A3","C4","G4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["E3","A3","C4","G4"],["D3","F4"]]},{"name":"Ab7(mixo)","voicing":[53,58,61,68],"voicing_names":["F3","Bb3","Db4","Ab4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["F3","Bb3","Db4","Ab4"],["Eb3","Gb4"]]},{"name":"A7(mixo)","voicing":[54,59,62,69],"voicing_names":["F#3","B3","D4","A4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["F#3","B3","D4","A4"],["E3","G4"]]},{"name":"Bb7(mixo)","voicing":[55,60,63,70],"voicing_names":["G3","C4","Eb4","Bb4"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["G3","C4","Eb4","Bb4"],["F3","Ab4"]]},{"name":"B7(mixo)","voicing":[56,61,64,71],"voicing_names":["G#3","C#4","E4","B4"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["G#3","C#4","E4","B4"],["F#3","A4"]]}],"unit_size":1,"shuffle_units":true,"score_per_voicing":true,"play_root_on_first_voicing_complete":true}'::jsonb,
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-tension-resolve-7-alt'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-tension_resolve'),
    'tension-resolve-7-alt',
    '7(alt)',
    '7(alt)',
    4,
    'progression',
    'grand_concert',
    false,
    true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    '{"progression":[{"name":"C7(alt)","voicing":[60,64,68,75],"voicing_names":["C4","Fb4","Ab4","Eb5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["C4","Fb4","Ab4","Eb5"],["Bb3","Db5"]]},{"name":"Db7(alt)","voicing":[61,65,69,76],"voicing_names":["Db4","Gbb4","Bbb4","Fb5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["Db4","Gbb4","Bbb4","Fb5"],["Cb4","Ebb5"]]},{"name":"D7(alt)","voicing":[50,54,58,65],"voicing_names":["D3","Gb3","Bb3","F4"],"voicing_staves":[2,2,2,1,2,1],"key_fifths":0,"voicing_slots":[["D3","Gb3","Bb3","F4"],["C3","Eb4"]]},{"name":"Eb7(alt)","voicing":[51,55,59,66],"voicing_names":["Eb3","Abb3","Cb4","Gb4"],"voicing_staves":[2,2,2,1,2,1],"key_fifths":0,"voicing_slots":[["Eb3","Abb3","Cb4","Gb4"],["Db3","Fb4"]]},{"name":"E7(alt)","voicing":[52,56,60,67],"voicing_names":["E3","Ab3","C4","G4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["E3","Ab3","C4","G4"],["D3","F4"]]},{"name":"F7(alt)","voicing":[53,57,61,68],"voicing_names":["F3","Bbb3","Db4","Ab4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["F3","Bbb3","Db4","Ab4"],["Eb3","Gb4"]]},{"name":"Gb7(alt)","voicing":[54,58,62,69],"voicing_names":["Gb3","Cbb4","Ebb4","Bbb4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["Gb3","Cbb4","Ebb4","Bbb4"],["Fb3","Abb4"]]},{"name":"G7(alt)","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["G3","Cb4","Eb4","Bb4"],["F3","Ab4"]]},{"name":"Ab7(alt)","voicing":[56,60,64,71],"voicing_names":["Ab3","Dbb4","Fb4","Cb5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["Ab3","Dbb4","Fb4","Cb5"],["Gb3","Bbb4"]]},{"name":"A7(alt)","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["A3","Db4","F4","C5"],["G3","Bb4"]]},{"name":"Bb7(alt)","voicing":[58,62,66,73],"voicing_names":["Bb3","Ebb4","Gb4","Db5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["Bb3","Ebb4","Gb4","Db5"],["Ab3","Cb5"]]},{"name":"B7(alt)","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["B3","Eb4","G4","D5"],["A3","C5"]]}],"unit_size":1,"shuffle_units":true,"score_per_voicing":true,"play_root_on_first_voicing_complete":true}'::jsonb,
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-tension-resolve-m7b5'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-tension_resolve'),
    'tension-resolve-m7b5',
    'm7(b5)',
    'm7(b5)',
    5,
    'progression',
    'grand_concert',
    false,
    true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    '{"progression":[{"name":"Cm7(b5)","voicing":[50,54,58,65],"voicing_names":["D3","Gb3","Bb3","F4"],"voicing_staves":[2,2,2,1,2,1],"key_fifths":0,"voicing_slots":[["D3","Gb3","Bb3","F4"],["C3","Eb4"]]},{"name":"Dbm7(b5)","voicing":[51,55,59,66],"voicing_names":["Eb3","Abb3","Cb4","Gb4"],"voicing_staves":[2,2,2,1,2,1],"key_fifths":0,"voicing_slots":[["Eb3","Abb3","Cb4","Gb4"],["Db3","Fb4"]]},{"name":"Dm7(b5)","voicing":[52,56,60,67],"voicing_names":["E3","Ab3","C4","G4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["E3","Ab3","C4","G4"],["D3","F4"]]},{"name":"Ebm7(b5)","voicing":[53,57,61,68],"voicing_names":["F3","Bbb3","Db4","Ab4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["F3","Bbb3","Db4","Ab4"],["Eb3","Gb4"]]},{"name":"Em7(b5)","voicing":[54,58,62,69],"voicing_names":["F#3","Bb3","D4","A4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["F#3","Bb3","D4","A4"],["E3","G4"]]},{"name":"Fm7(b5)","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["G3","Cb4","Eb4","Bb4"],["F3","Ab4"]]},{"name":"Gbm7(b5)","voicing":[56,60,64,71],"voicing_names":["Ab3","Dbb4","Fb4","Cb5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["Ab3","Dbb4","Fb4","Cb5"],["Gb3","Bbb4"]]},{"name":"Gm7(b5)","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["A3","Db4","F4","C5"],["G3","Bb4"]]},{"name":"Abm7(b5)","voicing":[58,62,66,73],"voicing_names":["Bb3","Ebb4","Gb4","Db5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["Bb3","Ebb4","Gb4","Db5"],["Ab3","Cb5"]]},{"name":"Am7(b5)","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["B3","Eb4","G4","D5"],["A3","C5"]]},{"name":"Bbm7(b5)","voicing":[60,64,68,75],"voicing_names":["C4","Fb4","Ab4","Eb5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["C4","Fb4","Ab4","Eb5"],["Bb3","Db5"]]},{"name":"Bm7(b5)","voicing":[61,65,69,76],"voicing_names":["C#4","F4","A4","E5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["C#4","F4","A4","E5"],["B3","D5"]]}],"unit_size":1,"shuffle_units":true,"score_per_voicing":true,"play_root_on_first_voicing_complete":true}'::jsonb,
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-tension-resolve-7-sharp11'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-tension_resolve'),
    'tension-resolve-7-sharp11',
    '7(#11)',
    '7(#11)',
    6,
    'progression',
    'grand_concert',
    false,
    true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    '{"progression":[{"name":"C7(#11)","voicing":[54,58,62,69],"voicing_names":["F#3","Bb3","D4","A4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["F#3","Bb3","D4","A4"],["E3","G4"]]},{"name":"Db7(#11)","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["G3","Cb4","Eb4","Bb4"],["F3","Ab4"]]},{"name":"D7(#11)","voicing":[56,60,64,71],"voicing_names":["G#3","C4","E4","B4"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["G#3","C4","E4","B4"],["F#3","A4"]]},{"name":"Eb7(#11)","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["A3","Db4","F4","C5"],["G3","Bb4"]]},{"name":"E7(#11)","voicing":[58,62,66,73],"voicing_names":["A#3","D4","F#4","C#5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["A#3","D4","F#4","C#5"],["G#3","B4"]]},{"name":"F7(#11)","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["B3","Eb4","G4","D5"],["A3","C5"]]},{"name":"Gb7(#11)","voicing":[60,64,68,75],"voicing_names":["C4","Fb4","Ab4","Eb5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["C4","Fb4","Ab4","Eb5"],["Bb3","Db5"]]},{"name":"G7(#11)","voicing":[61,65,69,76],"voicing_names":["C#4","F4","A4","E5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["C#4","F4","A4","E5"],["B3","D5"]]},{"name":"Ab7(#11)","voicing":[50,54,58,65],"voicing_names":["D3","Gb3","Bb3","F4"],"voicing_staves":[2,2,2,1,2,1],"key_fifths":0,"voicing_slots":[["D3","Gb3","Bb3","F4"],["C3","Eb4"]]},{"name":"A7(#11)","voicing":[51,55,59,66],"voicing_names":["D#3","G3","B3","F#4"],"voicing_staves":[2,2,2,1,2,1],"key_fifths":0,"voicing_slots":[["D#3","G3","B3","F#4"],["C#3","E4"]]},{"name":"Bb7(#11)","voicing":[52,56,60,67],"voicing_names":["E3","Ab3","C4","G4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["E3","Ab3","C4","G4"],["D3","F4"]]},{"name":"B7(#11)","voicing":[53,57,61,68],"voicing_names":["E#3","A3","C#4","G#4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["E#3","A3","C#4","G#4"],["D#3","F#4"]]}],"unit_size":1,"shuffle_units":true,"score_per_voicing":true,"play_root_on_first_voicing_complete":true}'::jsonb,
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-tension-resolve-m6'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-tension_resolve'),
    'tension-resolve-m6',
    'm6',
    'm6',
    7,
    'progression',
    'grand_concert',
    false,
    true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    '{"progression":[{"name":"Cm6","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["B3","Eb4","G4","D5"],["A3","C5"]]},{"name":"Dbm6","voicing":[60,64,68,75],"voicing_names":["C4","Fb4","Ab4","Eb5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["C4","Fb4","Ab4","Eb5"],["Bb3","Db5"]]},{"name":"Dm6","voicing":[61,65,69,76],"voicing_names":["C#4","F4","A4","E5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["C#4","F4","A4","E5"],["B3","D5"]]},{"name":"Ebm6","voicing":[50,54,58,65],"voicing_names":["D3","Gb3","Bb3","F4"],"voicing_staves":[2,2,2,1,2,1],"key_fifths":0,"voicing_slots":[["D3","Gb3","Bb3","F4"],["C3","Eb4"]]},{"name":"Em6","voicing":[51,55,59,66],"voicing_names":["D#3","G3","B3","F#4"],"voicing_staves":[2,2,2,1,2,1],"key_fifths":0,"voicing_slots":[["D#3","G3","B3","F#4"],["C#3","E4"]]},{"name":"Fm6","voicing":[52,56,60,67],"voicing_names":["E3","Ab3","C4","G4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["E3","Ab3","C4","G4"],["D3","F4"]]},{"name":"Gbm6","voicing":[53,57,61,68],"voicing_names":["F3","Bbb3","Db4","Ab4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["F3","Bbb3","Db4","Ab4"],["Eb3","Gb4"]]},{"name":"Gm6","voicing":[54,58,62,69],"voicing_names":["F#3","Bb3","D4","A4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["F#3","Bb3","D4","A4"],["E3","G4"]]},{"name":"Abm6","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["G3","Cb4","Eb4","Bb4"],["F3","Ab4"]]},{"name":"Am6","voicing":[56,60,64,71],"voicing_names":["G#3","C4","E4","B4"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["G#3","C4","E4","B4"],["F#3","A4"]]},{"name":"Bbm6","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["A3","Db4","F4","C5"],["G3","Bb4"]]},{"name":"Bm6","voicing":[58,62,66,73],"voicing_names":["A#3","D4","F#4","C#5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["A#3","D4","F#4","C#5"],["G#3","B4"]]}],"unit_size":1,"shuffle_units":true,"score_per_voicing":true,"play_root_on_first_voicing_complete":true}'::jsonb,
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-tension-resolve-ii-v-i'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-tension_resolve'),
    'tension-resolve-ii-v-i',
    'II-V-I',
    'II-V-I',
    8,
    'progression',
    'grand_concert',
    true,
    true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    '{"progression":[{"name":"Dm7","voicing":[52,57,60,67],"voicing_names":["E3","A3","C4","G4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["E3","A3","C4","G4"],["D3","F4"]]},{"name":"G7(alt)","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["G3","Cb4","Eb4","Bb4"],["F3","Ab4"]]},{"name":"CM7","voicing":[52,59,62,67],"voicing_names":["E3","B3","D4","G4"],"voicing_staves":[2,2,1,1,2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["E3","B3","D4","G4"],["B3","E4","G4","D5"],["A3","C5"]]},{"name":"Gm7","voicing":[57,62,65,72],"voicing_names":["A3","D4","F4","C5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":-1,"voicing_slots":[["A3","D4","F4","C5"],["G3","Bb4"]]},{"name":"C7(alt)","voicing":[60,64,68,75],"voicing_names":["C4","Fb4","Ab4","Eb5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":-1,"voicing_slots":[["C4","Fb4","Ab4","Eb5"],["Bb3","Db5"]]},{"name":"FM7","voicing":[57,64,67,72],"voicing_names":["A3","E4","G4","C5"],"voicing_staves":[2,1,1,1,1,1,1,1,1,1],"key_fifths":-1,"voicing_slots":[["A3","E4","G4","C5"],["E4","A4","C5","G5"],["D4","F5"]]},{"name":"Cm7","voicing":[50,55,58,65],"voicing_names":["D3","G3","Bb3","F4"],"voicing_staves":[2,2,2,1,2,1],"key_fifths":-2,"voicing_slots":[["D3","G3","Bb3","F4"],["C3","Eb4"]]},{"name":"F7(alt)","voicing":[53,57,61,68],"voicing_names":["F3","Bbb3","Db4","Ab4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":-2,"voicing_slots":[["F3","Bbb3","Db4","Ab4"],["Eb3","Gb4"]]},{"name":"BbM7","voicing":[50,57,60,65],"voicing_names":["D3","A3","C4","F4"],"voicing_staves":[2,2,1,1,2,1,1,1,2,1],"key_fifths":-2,"voicing_slots":[["D3","A3","C4","F4"],["A3","D4","F4","C5"],["G3","Bb4"]]},{"name":"Fm7","voicing":[55,60,63,70],"voicing_names":["G3","C4","Eb4","Bb4"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":-3,"voicing_slots":[["G3","C4","Eb4","Bb4"],["F3","Ab4"]]},{"name":"Bb7(alt)","voicing":[58,62,66,73],"voicing_names":["Bb3","Ebb4","Gb4","Db5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":-3,"voicing_slots":[["Bb3","Ebb4","Gb4","Db5"],["Ab3","Cb5"]]},{"name":"EbM7","voicing":[55,62,65,70],"voicing_names":["G3","D4","F4","Bb4"],"voicing_staves":[2,1,1,1,1,1,1,1,1,1],"key_fifths":-3,"voicing_slots":[["G3","D4","F4","Bb4"],["D4","G4","Bb4","F5"],["C4","Eb5"]]},{"name":"Bbm7","voicing":[60,65,68,75],"voicing_names":["C4","F4","Ab4","Eb5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":-4,"voicing_slots":[["C4","F4","Ab4","Eb5"],["Bb3","Db5"]]},{"name":"Eb7(alt)","voicing":[63,67,71,78],"voicing_names":["Eb4","Abb4","Cb5","Gb5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":-4,"voicing_slots":[["Eb4","Abb4","Cb5","Gb5"],["Db4","Fb5"]]},{"name":"AbM7","voicing":[60,67,70,75],"voicing_names":["C4","G4","Bb4","Eb5"],"voicing_staves":[1,1,1,1,1,1,1,1,1,1],"key_fifths":-4,"voicing_slots":[["C4","G4","Bb4","Eb5"],["G4","C5","Eb5","Bb5"],["F4","Ab5"]]},{"name":"Ebm7","voicing":[53,58,61,68],"voicing_names":["F3","Bb3","Db4","Ab4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":-5,"voicing_slots":[["F3","Bb3","Db4","Ab4"],["Eb3","Gb4"]]},{"name":"Ab7(alt)","voicing":[56,60,64,71],"voicing_names":["Ab3","Dbb4","Fb4","Cb5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":-5,"voicing_slots":[["Ab3","Dbb4","Fb4","Cb5"],["Gb3","Bbb4"]]},{"name":"DbM7","voicing":[53,60,63,68],"voicing_names":["F3","C4","Eb4","Ab4"],"voicing_staves":[2,1,1,1,1,1,1,1,2,1],"key_fifths":-5,"voicing_slots":[["F3","C4","Eb4","Ab4"],["C4","F4","Ab4","Eb5"],["Bb3","Db5"]]},{"name":"Abm7","voicing":[58,63,66,73],"voicing_names":["Bb3","Eb4","Gb4","Db5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":-6,"voicing_slots":[["Bb3","Eb4","Gb4","Db5"],["Ab3","Cb5"]]},{"name":"Db7(alt)","voicing":[61,65,69,76],"voicing_names":["Db4","Gbb4","Bbb4","Fb5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":-6,"voicing_slots":[["Db4","Gbb4","Bbb4","Fb5"],["Cb4","Ebb5"]]},{"name":"GbM7","voicing":[58,65,68,73],"voicing_names":["Bb3","F4","Ab4","Db5"],"voicing_staves":[2,1,1,1,1,1,1,1,1,1],"key_fifths":-6,"voicing_slots":[["Bb3","F4","Ab4","Db5"],["F4","Bb4","Db5","Ab5"],["Eb4","Gb5"]]},{"name":"C#m7","voicing":[51,56,59,66],"voicing_names":["D#3","G#3","B3","F#4"],"voicing_staves":[2,2,2,1,2,1],"key_fifths":5,"voicing_slots":[["D#3","G#3","B3","F#4"],["C#3","E4"]]},{"name":"F#7(alt)","voicing":[54,58,62,69],"voicing_names":["F#3","Bb3","D4","A4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":5,"voicing_slots":[["F#3","Bb3","D4","A4"],["E3","G4"]]},{"name":"BM7","voicing":[51,58,61,66],"voicing_names":["D#3","A#3","C#4","F#4"],"voicing_staves":[2,2,1,1,2,1,1,1,2,1],"key_fifths":5,"voicing_slots":[["D#3","A#3","C#4","F#4"],["A#3","D#4","F#4","C#5"],["G#3","B4"]]},{"name":"F#m7","voicing":[56,61,64,71],"voicing_names":["G#3","C#4","E4","B4"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":4,"voicing_slots":[["G#3","C#4","E4","B4"],["F#3","A4"]]},{"name":"B7(alt)","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":4,"voicing_slots":[["B3","Eb4","G4","D5"],["A3","C5"]]},{"name":"EM7","voicing":[56,63,66,71],"voicing_names":["G#3","D#4","F#4","B4"],"voicing_staves":[2,1,1,1,1,1,1,1,1,1],"key_fifths":4,"voicing_slots":[["G#3","D#4","F#4","B4"],["D#4","G#4","B4","F#5"],["C#4","E5"]]},{"name":"Bm7","voicing":[61,66,69,76],"voicing_names":["C#4","F#4","A4","E5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":3,"voicing_slots":[["C#4","F#4","A4","E5"],["B3","D5"]]},{"name":"E7(alt)","voicing":[64,68,72,79],"voicing_names":["E4","Ab4","C5","G5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":3,"voicing_slots":[["E4","Ab4","C5","G5"],["D4","F5"]]},{"name":"AM7","voicing":[61,68,71,76],"voicing_names":["C#4","G#4","B4","E5"],"voicing_staves":[1,1,1,1,1,1,1,1,1,1],"key_fifths":3,"voicing_slots":[["C#4","G#4","B4","E5"],["G#4","C#5","E5","B5"],["F#4","A5"]]},{"name":"Em7","voicing":[54,59,62,69],"voicing_names":["F#3","B3","D4","A4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":2,"voicing_slots":[["F#3","B3","D4","A4"],["E3","G4"]]},{"name":"A7(alt)","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":2,"voicing_slots":[["A3","Db4","F4","C5"],["G3","Bb4"]]},{"name":"DM7","voicing":[54,61,64,69],"voicing_names":["F#3","C#4","E4","A4"],"voicing_staves":[2,1,1,1,1,1,1,1,2,1],"key_fifths":2,"voicing_slots":[["F#3","C#4","E4","A4"],["C#4","F#4","A4","E5"],["B3","D5"]]},{"name":"Am7","voicing":[59,64,67,74],"voicing_names":["B3","E4","G4","D5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":1,"voicing_slots":[["B3","E4","G4","D5"],["A3","C5"]]},{"name":"D7(alt)","voicing":[62,66,70,77],"voicing_names":["D4","Gb4","Bb4","F5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":1,"voicing_slots":[["D4","Gb4","Bb4","F5"],["C4","Eb5"]]},{"name":"GM7","voicing":[59,66,69,74],"voicing_names":["B3","F#4","A4","D5"],"voicing_staves":[2,1,1,1,1,1,1,1,1,1],"key_fifths":1,"voicing_slots":[["B3","F#4","A4","D5"],["F#4","B4","D5","A5"],["E4","G5"]]}],"unit_size":3,"shuffle_units":true,"score_per_voicing":true,"play_root_on_first_voicing_complete":true}'::jsonb,
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-tension-resolve-i-vi-ii-v'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-tension_resolve'),
    'tension-resolve-i-vi-ii-v',
    'I-VI-II-V',
    'I-VI-II-V',
    9,
    'progression',
    'grand_concert',
    true,
    true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    '{"progression":[{"name":"CM7","voicing":[59,64,67,74],"voicing_names":["B3","E4","G4","D5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["B3","E4","G4","D5"],["A3","C5"]]},{"name":"A7(alt)","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["A3","Db4","F4","C5"],["G3","Bb4"]]},{"name":"Dm7","voicing":[53,60,64,69],"voicing_names":["F3","C4","E4","A4"],"voicing_staves":[2,1,1,1,2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["F3","C4","E4","A4"],["E3","A3","C4","G4"],["D3","F4"]]},{"name":"G7(alt)","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":0,"voicing_slots":[["G3","Cb4","Eb4","Bb4"],["F3","Ab4"]]},{"name":"FM7","voicing":[64,69,72,79],"voicing_names":["E4","A4","C5","G5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":-1,"voicing_slots":[["E4","A4","C5","G5"],["D4","F5"]]},{"name":"D7(alt)","voicing":[62,66,70,77],"voicing_names":["D4","Gb4","Bb4","F5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":-1,"voicing_slots":[["D4","Gb4","Bb4","F5"],["C4","Eb5"]]},{"name":"Gm7","voicing":[58,65,69,74],"voicing_names":["Bb3","F4","A4","D5"],"voicing_staves":[2,1,1,1,2,1,1,1,2,1],"key_fifths":-1,"voicing_slots":[["Bb3","F4","A4","D5"],["A3","D4","F4","C5"],["G3","Bb4"]]},{"name":"C7(alt)","voicing":[60,64,68,75],"voicing_names":["C4","Fb4","Ab4","Eb5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":-1,"voicing_slots":[["C4","Fb4","Ab4","Eb5"],["Bb3","Db5"]]},{"name":"BbM7","voicing":[57,62,65,72],"voicing_names":["A3","D4","F4","C5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":-2,"voicing_slots":[["A3","D4","F4","C5"],["G3","Bb4"]]},{"name":"G7(alt)","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":-2,"voicing_slots":[["G3","Cb4","Eb4","Bb4"],["F3","Ab4"]]},{"name":"Cm7","voicing":[51,58,62,67],"voicing_names":["Eb3","Bb3","D4","G4"],"voicing_staves":[2,2,1,1,2,2,2,1,2,1],"key_fifths":-2,"voicing_slots":[["Eb3","Bb3","D4","G4"],["D3","G3","Bb3","F4"],["C3","Eb4"]]},{"name":"F7(alt)","voicing":[53,57,61,68],"voicing_names":["F3","Bbb3","Db4","Ab4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":-2,"voicing_slots":[["F3","Bbb3","Db4","Ab4"],["Eb3","Gb4"]]},{"name":"EbM7","voicing":[62,67,70,77],"voicing_names":["D4","G4","Bb4","F5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":-3,"voicing_slots":[["D4","G4","Bb4","F5"],["C4","Eb5"]]},{"name":"C7(alt)","voicing":[60,64,68,75],"voicing_names":["C4","Fb4","Ab4","Eb5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":-3,"voicing_slots":[["C4","Fb4","Ab4","Eb5"],["Bb3","Db5"]]},{"name":"Fm7","voicing":[56,63,67,72],"voicing_names":["Ab3","Eb4","G4","C5"],"voicing_staves":[2,1,1,1,2,1,1,1,2,1],"key_fifths":-3,"voicing_slots":[["Ab3","Eb4","G4","C5"],["G3","C4","Eb4","Bb4"],["F3","Ab4"]]},{"name":"Bb7(alt)","voicing":[58,62,66,73],"voicing_names":["Bb3","Ebb4","Gb4","Db5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":-3,"voicing_slots":[["Bb3","Ebb4","Gb4","Db5"],["Ab3","Cb5"]]},{"name":"AbM7","voicing":[67,72,75,82],"voicing_names":["G4","C5","Eb5","Bb5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":-4,"voicing_slots":[["G4","C5","Eb5","Bb5"],["F4","Ab5"]]},{"name":"F7(alt)","voicing":[65,69,73,80],"voicing_names":["F4","Bbb4","Db5","Ab5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":-4,"voicing_slots":[["F4","Bbb4","Db5","Ab5"],["Eb4","Gb5"]]},{"name":"Bbm7","voicing":[61,68,72,77],"voicing_names":["Db4","Ab4","C5","F5"],"voicing_staves":[1,1,1,1,1,1,1,1,2,1],"key_fifths":-4,"voicing_slots":[["Db4","Ab4","C5","F5"],["C4","F4","Ab4","Eb5"],["Bb3","Db5"]]},{"name":"Eb7(alt)","voicing":[63,67,71,78],"voicing_names":["Eb4","Abb4","Cb5","Gb5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":-4,"voicing_slots":[["Eb4","Abb4","Cb5","Gb5"],["Db4","Fb5"]]},{"name":"DbM7","voicing":[60,65,68,75],"voicing_names":["C4","F4","Ab4","Eb5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":-5,"voicing_slots":[["C4","F4","Ab4","Eb5"],["Bb3","Db5"]]},{"name":"Bb7(alt)","voicing":[58,62,66,73],"voicing_names":["Bb3","Ebb4","Gb4","Db5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":-5,"voicing_slots":[["Bb3","Ebb4","Gb4","Db5"],["Ab3","Cb5"]]},{"name":"Ebm7","voicing":[54,61,65,70],"voicing_names":["Gb3","Db4","F4","Bb4"],"voicing_staves":[2,1,1,1,2,2,1,1,2,1],"key_fifths":-5,"voicing_slots":[["Gb3","Db4","F4","Bb4"],["F3","Bb3","Db4","Ab4"],["Eb3","Gb4"]]},{"name":"Ab7(alt)","voicing":[56,60,64,71],"voicing_names":["Ab3","Dbb4","Fb4","Cb5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":-5,"voicing_slots":[["Ab3","Dbb4","Fb4","Cb5"],["Gb3","Bbb4"]]},{"name":"GbM7","voicing":[65,70,73,80],"voicing_names":["F4","Bb4","Db5","Ab5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":-6,"voicing_slots":[["F4","Bb4","Db5","Ab5"],["Eb4","Gb5"]]},{"name":"Eb7(alt)","voicing":[63,67,71,78],"voicing_names":["Eb4","Abb4","Cb5","Gb5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":-6,"voicing_slots":[["Eb4","Abb4","Cb5","Gb5"],["Db4","Fb5"]]},{"name":"Abm7","voicing":[59,66,70,75],"voicing_names":["Cb4","Gb4","Bb4","Eb5"],"voicing_staves":[2,1,1,1,2,1,1,1,2,1],"key_fifths":-6,"voicing_slots":[["Cb4","Gb4","Bb4","Eb5"],["Bb3","Eb4","Gb4","Db5"],["Ab3","Cb5"]]},{"name":"Db7(alt)","voicing":[61,65,69,76],"voicing_names":["Db4","Gbb4","Bbb4","Fb5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":-6,"voicing_slots":[["Db4","Gbb4","Bbb4","Fb5"],["Cb4","Ebb5"]]},{"name":"BM7","voicing":[58,63,66,73],"voicing_names":["A#3","D#4","F#4","C#5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":5,"voicing_slots":[["A#3","D#4","F#4","C#5"],["G#3","B4"]]},{"name":"G#7(alt)","voicing":[56,60,64,71],"voicing_names":["G#3","C4","E4","B4"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":5,"voicing_slots":[["G#3","C4","E4","B4"],["F#3","A4"]]},{"name":"C#m7","voicing":[52,59,63,68],"voicing_names":["E3","B3","D#4","G#4"],"voicing_staves":[2,2,1,1,2,2,2,1,2,1],"key_fifths":5,"voicing_slots":[["E3","B3","D#4","G#4"],["D#3","G#3","B3","F#4"],["C#3","E4"]]},{"name":"F#7(alt)","voicing":[54,58,62,69],"voicing_names":["F#3","Bb3","D4","A4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":5,"voicing_slots":[["F#3","Bb3","D4","A4"],["E3","G4"]]},{"name":"EM7","voicing":[63,68,71,78],"voicing_names":["D#4","G#4","B4","F#5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":4,"voicing_slots":[["D#4","G#4","B4","F#5"],["C#4","E5"]]},{"name":"C#7(alt)","voicing":[61,65,69,76],"voicing_names":["C#4","F4","A4","E5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":4,"voicing_slots":[["C#4","F4","A4","E5"],["B3","D5"]]},{"name":"F#m7","voicing":[57,64,68,73],"voicing_names":["A3","E4","G#4","C#5"],"voicing_staves":[2,1,1,1,2,1,1,1,2,1],"key_fifths":4,"voicing_slots":[["A3","E4","G#4","C#5"],["G#3","C#4","E4","B4"],["F#3","A4"]]},{"name":"B7(alt)","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":4,"voicing_slots":[["B3","Eb4","G4","D5"],["A3","C5"]]},{"name":"AM7","voicing":[68,73,76,83],"voicing_names":["G#4","C#5","E5","B5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":3,"voicing_slots":[["G#4","C#5","E5","B5"],["F#4","A5"]]},{"name":"F#7(alt)","voicing":[66,70,74,81],"voicing_names":["F#4","Bb4","D5","A5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":3,"voicing_slots":[["F#4","Bb4","D5","A5"],["E4","G5"]]},{"name":"Bm7","voicing":[62,69,73,78],"voicing_names":["D4","A4","C#5","F#5"],"voicing_staves":[1,1,1,1,1,1,1,1,2,1],"key_fifths":3,"voicing_slots":[["D4","A4","C#5","F#5"],["C#4","F#4","A4","E5"],["B3","D5"]]},{"name":"E7(alt)","voicing":[64,68,72,79],"voicing_names":["E4","Ab4","C5","G5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":3,"voicing_slots":[["E4","Ab4","C5","G5"],["D4","F5"]]},{"name":"DM7","voicing":[61,66,69,76],"voicing_names":["C#4","F#4","A4","E5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":2,"voicing_slots":[["C#4","F#4","A4","E5"],["B3","D5"]]},{"name":"B7(alt)","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":2,"voicing_slots":[["B3","Eb4","G4","D5"],["A3","C5"]]},{"name":"Em7","voicing":[55,62,66,71],"voicing_names":["G3","D4","F#4","B4"],"voicing_staves":[2,1,1,1,2,2,1,1,2,1],"key_fifths":2,"voicing_slots":[["G3","D4","F#4","B4"],["F#3","B3","D4","A4"],["E3","G4"]]},{"name":"A7(alt)","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":2,"voicing_slots":[["A3","Db4","F4","C5"],["G3","Bb4"]]},{"name":"GM7","voicing":[66,71,74,81],"voicing_names":["F#4","B4","D5","A5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":1,"voicing_slots":[["F#4","B4","D5","A5"],["E4","G5"]]},{"name":"E7(alt)","voicing":[64,68,72,79],"voicing_names":["E4","Ab4","C5","G5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":1,"voicing_slots":[["E4","Ab4","C5","G5"],["D4","F5"]]},{"name":"Am7","voicing":[60,67,71,76],"voicing_names":["C4","G4","B4","E5"],"voicing_staves":[1,1,1,1,2,1,1,1,2,1],"key_fifths":1,"voicing_slots":[["C4","G4","B4","E5"],["B3","E4","G4","D5"],["A3","C5"]]},{"name":"D7(alt)","voicing":[62,66,70,77],"voicing_names":["D4","Gb4","Bb4","F5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":1,"voicing_slots":[["D4","Gb4","Bb4","F5"],["C4","Eb5"]]}],"unit_size":4,"shuffle_units":true,"score_per_voicing":true,"play_root_on_first_voicing_complete":true}'::jsonb,
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-tension-resolve-minor-ii-v-i'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-tension_resolve'),
    'tension-resolve-minor-ii-v-i',
    'Minor II-V-I',
    'Minor II-V-I',
    10,
    'progression',
    'grand_concert',
    true,
    true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    '{"progression":[{"name":"Bm7(b5)","voicing":[61,65,69,76],"voicing_names":["C#4","F4","A4","E5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":0,"voicing_slots":[["C#4","F4","A4","E5"],["B3","D5"]]},{"name":"E7(alt)","voicing":[64,68,72,79],"voicing_names":["E4","Ab4","C5","G5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":0,"voicing_slots":[["E4","Ab4","C5","G5"],["D4","F5"]]},{"name":"Am6","voicing":[60,66,71,76],"voicing_names":["C4","F#4","B4","E5"],"voicing_staves":[1,1,1,1,1,1,1,1,1,1],"key_fifths":0,"voicing_slots":[["C4","F#4","B4","E5"],["G#4","C5","E5","B5"],["F#4","A5"]]},{"name":"Em7(b5)","voicing":[54,58,62,69],"voicing_names":["F#3","Bb3","D4","A4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":-1,"voicing_slots":[["F#3","Bb3","D4","A4"],["E3","G4"]]},{"name":"A7(alt)","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":-1,"voicing_slots":[["A3","Db4","F4","C5"],["G3","Bb4"]]},{"name":"Dm6","voicing":[53,59,64,69],"voicing_names":["F3","B3","E4","A4"],"voicing_staves":[2,2,1,1,1,1,1,1,2,1],"key_fifths":-1,"voicing_slots":[["F3","B3","E4","A4"],["C#4","F4","A4","E5"],["B3","D5"]]},{"name":"Am7(b5)","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":-2,"voicing_slots":[["B3","Eb4","G4","D5"],["A3","C5"]]},{"name":"D7(alt)","voicing":[62,66,70,77],"voicing_names":["D4","Gb4","Bb4","F5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":-2,"voicing_slots":[["D4","Gb4","Bb4","F5"],["C4","Eb5"]]},{"name":"Gm6","voicing":[58,64,69,74],"voicing_names":["Bb3","E4","A4","D5"],"voicing_staves":[2,1,1,1,1,1,1,1,1,1],"key_fifths":-2,"voicing_slots":[["Bb3","E4","A4","D5"],["F#4","Bb4","D5","A5"],["E4","G5"]]},{"name":"Dm7(b5)","voicing":[52,56,60,67],"voicing_names":["E3","Ab3","C4","G4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":-3,"voicing_slots":[["E3","Ab3","C4","G4"],["D3","F4"]]},{"name":"G7(alt)","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":-3,"voicing_slots":[["G3","Cb4","Eb4","Bb4"],["F3","Ab4"]]},{"name":"Cm6","voicing":[51,57,62,67],"voicing_names":["Eb3","A3","D4","G4"],"voicing_staves":[2,2,1,1,2,1,1,1,2,1],"key_fifths":-3,"voicing_slots":[["Eb3","A3","D4","G4"],["B3","Eb4","G4","D5"],["A3","C5"]]},{"name":"Gm7(b5)","voicing":[57,61,65,72],"voicing_names":["A3","Db4","F4","C5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":-4,"voicing_slots":[["A3","Db4","F4","C5"],["G3","Bb4"]]},{"name":"C7(alt)","voicing":[60,64,68,75],"voicing_names":["C4","Fb4","Ab4","Eb5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":-4,"voicing_slots":[["C4","Fb4","Ab4","Eb5"],["Bb3","Db5"]]},{"name":"Fm6","voicing":[56,62,67,72],"voicing_names":["Ab3","D4","G4","C5"],"voicing_staves":[2,1,1,1,1,1,1,1,1,1],"key_fifths":-4,"voicing_slots":[["Ab3","D4","G4","C5"],["E4","Ab4","C5","G5"],["D4","F5"]]},{"name":"Cm7(b5)","voicing":[50,54,58,65],"voicing_names":["D3","Gb3","Bb3","F4"],"voicing_staves":[2,2,2,1,2,1],"key_fifths":-5,"voicing_slots":[["D3","Gb3","Bb3","F4"],["C3","Eb4"]]},{"name":"F7(alt)","voicing":[53,57,61,68],"voicing_names":["F3","Bbb3","Db4","Ab4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":-5,"voicing_slots":[["F3","Bbb3","Db4","Ab4"],["Eb3","Gb4"]]},{"name":"Bbm6","voicing":[49,55,60,65],"voicing_names":["Db3","G3","C4","F4"],"voicing_staves":[2,2,1,1,2,1,1,1,2,1],"key_fifths":-5,"voicing_slots":[["Db3","G3","C4","F4"],["A3","Db4","F4","C5"],["G3","Bb4"]]},{"name":"Fm7(b5)","voicing":[55,59,63,70],"voicing_names":["G3","Cb4","Eb4","Bb4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":-6,"voicing_slots":[["G3","Cb4","Eb4","Bb4"],["F3","Ab4"]]},{"name":"Bb7(alt)","voicing":[58,62,66,73],"voicing_names":["Bb3","Ebb4","Gb4","Db5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":-6,"voicing_slots":[["Bb3","Ebb4","Gb4","Db5"],["Ab3","Cb5"]]},{"name":"Ebm6","voicing":[54,60,65,70],"voicing_names":["Gb3","C4","F4","Bb4"],"voicing_staves":[2,1,1,1,1,1,1,1,1,1],"key_fifths":-6,"voicing_slots":[["Gb3","C4","F4","Bb4"],["D4","Gb4","Bb4","F5"],["C4","Eb5"]]},{"name":"A#m7(b5)","voicing":[60,64,68,75],"voicing_names":["B#3","E4","G#4","D#5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":5,"voicing_slots":[["B#3","E4","G#4","D#5"],["A#3","C#5"]]},{"name":"D#7(alt)","voicing":[63,67,71,78],"voicing_names":["D#4","G4","B4","F#5"],"voicing_staves":[1,1,1,1,1,1],"key_fifths":5,"voicing_slots":[["D#4","G4","B4","F#5"],["C#4","E5"]]},{"name":"G#m6","voicing":[59,65,70,75],"voicing_names":["B3","E#4","A#4","D#5"],"voicing_staves":[2,1,1,1,1,1,1,1,1,1],"key_fifths":5,"voicing_slots":[["B3","E#4","A#4","D#5"],["Fx4","B4","D#5","A#5"],["E#4","G#5"]]},{"name":"D#m7(b5)","voicing":[53,57,61,68],"voicing_names":["E#3","A3","C#4","G#4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":4,"voicing_slots":[["E#3","A3","C#4","G#4"],["D#3","F#4"]]},{"name":"G#7(alt)","voicing":[56,60,64,71],"voicing_names":["G#3","C4","E4","B4"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":4,"voicing_slots":[["G#3","C4","E4","B4"],["F#3","A4"]]},{"name":"C#m6","voicing":[52,58,63,68],"voicing_names":["E3","A#3","D#4","G#4"],"voicing_staves":[2,2,1,1,1,1,1,1,2,1],"key_fifths":4,"voicing_slots":[["E3","A#3","D#4","G#4"],["B#3","E4","G#4","D#5"],["A#3","C#5"]]},{"name":"G#m7(b5)","voicing":[58,62,66,73],"voicing_names":["A#3","D4","F#4","C#5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":3,"voicing_slots":[["A#3","D4","F#4","C#5"],["G#3","B4"]]},{"name":"C#7(alt)","voicing":[61,65,69,76],"voicing_names":["C#4","F4","A4","E5"],"voicing_staves":[1,1,1,1,2,1],"key_fifths":3,"voicing_slots":[["C#4","F4","A4","E5"],["B3","D5"]]},{"name":"F#m6","voicing":[57,63,68,73],"voicing_names":["A3","D#4","G#4","C#5"],"voicing_staves":[2,1,1,1,1,1,1,1,1,1],"key_fifths":3,"voicing_slots":[["A3","D#4","G#4","C#5"],["E#4","A4","C#5","G#5"],["D#4","F#5"]]},{"name":"C#m7(b5)","voicing":[51,55,59,66],"voicing_names":["D#3","G3","B3","F#4"],"voicing_staves":[2,2,2,1,2,1],"key_fifths":2,"voicing_slots":[["D#3","G3","B3","F#4"],["C#3","E4"]]},{"name":"F#7(alt)","voicing":[54,58,62,69],"voicing_names":["F#3","Bb3","D4","A4"],"voicing_staves":[2,2,1,1,2,1],"key_fifths":2,"voicing_slots":[["F#3","Bb3","D4","A4"],["E3","G4"]]},{"name":"Bm6","voicing":[50,56,61,66],"voicing_names":["D3","G#3","C#4","F#4"],"voicing_staves":[2,2,1,1,2,1,1,1,2,1],"key_fifths":2,"voicing_slots":[["D3","G#3","C#4","F#4"],["A#3","D4","F#4","C#5"],["G#3","B4"]]},{"name":"F#m7(b5)","voicing":[56,60,64,71],"voicing_names":["G#3","C4","E4","B4"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":1,"voicing_slots":[["G#3","C4","E4","B4"],["F#3","A4"]]},{"name":"B7(alt)","voicing":[59,63,67,74],"voicing_names":["B3","Eb4","G4","D5"],"voicing_staves":[2,1,1,1,2,1],"key_fifths":1,"voicing_slots":[["B3","Eb4","G4","D5"],["A3","C5"]]},{"name":"Em6","voicing":[55,61,66,71],"voicing_names":["G3","C#4","F#4","B4"],"voicing_staves":[2,1,1,1,1,1,1,1,1,1],"key_fifths":1,"voicing_slots":[["G3","C#4","F#4","B4"],["D#4","G4","B4","F#5"],["C#4","E5"]]}],"unit_size":3,"shuffle_units":true,"score_per_voicing":true,"play_root_on_first_voicing_complete":true}'::jsonb,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  title_ja = EXCLUDED.title_ja,
  title_en = EXCLUDED.title_en,
  sort_order = EXCLUDED.sort_order,
  kind = EXCLUDED.kind,
  clef_mode = EXCLUDED.clef_mode,
  use_key_signature = EXCLUDED.use_key_signature,
  play_root_on_correct = EXCLUDED.play_root_on_correct,
  bgm_url = EXCLUDED.bgm_url,
  config = EXCLUDED.config,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.training_goal_sets (
  id, slug, title_ja, title_en, description_ja, description_en, sort_order, is_active,
  target_instrument, target_level
) VALUES
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-goal-goal-tension-resolve-beginner'),
    'goal-tension-resolve-beginner',
    'テンションリゾルブ ビギナー',
    'Tension Resolve Beginner',
    'テンションからルートへ解決する両手ヴォイシングを、1小節に2〜3ヴォイシング並べて練習します。
1ヴォイシング完成で攻撃。最初のヴォイシング完成時のみルート音が鳴ります。
In C固定（移調楽器の影響なし）。コード進行は調号付き。',
    'Practice two-hand voicings that resolve tension to the root, with 2–3 voicings per measure.
Complete each voicing to attack. The root sounds only when you complete the first voicing.
Concert pitch (In C). Progressions use key signatures.',
    37,
    true,
    'piano',
    'beginner'
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-goal-goal-tension-resolve-trainer'),
    'goal-tension-resolve-trainer',
    'テンションリゾルブ トレーニー',
    'Tension Resolve Trainee',
    'テンションからルートへ解決する両手ヴォイシングを、1小節に2〜3ヴォイシング並べて練習します。
1ヴォイシング完成で攻撃。最初のヴォイシング完成時のみルート音が鳴ります。
In C固定（移調楽器の影響なし）。コード進行は調号付き。',
    'Practice two-hand voicings that resolve tension to the root, with 2–3 voicings per measure.
Complete each voicing to attack. The root sounds only when you complete the first voicing.
Concert pitch (In C). Progressions use key signatures.',
    38,
    true,
    'piano',
    'intermediate'
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-goal-goal-tension-resolve-master'),
    'goal-tension-resolve-master',
    'テンションリゾルブ マスター',
    'Tension Resolve Master',
    'テンションからルートへ解決する両手ヴォイシングを、1小節に2〜3ヴォイシング並べて練習します。
1ヴォイシング完成で攻撃。最初のヴォイシング完成時のみルート音が鳴ります。
In C固定（移調楽器の影響なし）。コード進行は調号付き。',
    'Practice two-hand voicings that resolve tension to the root, with 2–3 voicings per measure.
Complete each voicing to attack. The root sounds only when you complete the first voicing.
Concert pitch (In C). Progressions use key signatures.',
    39,
    true,
    'piano',
    'advanced'
  )
ON CONFLICT (slug) DO UPDATE SET
  title_ja = EXCLUDED.title_ja,
  title_en = EXCLUDED.title_en,
  description_ja = EXCLUDED.description_ja,
  description_en = EXCLUDED.description_en,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  target_instrument = EXCLUDED.target_instrument,
  target_level = EXCLUDED.target_level,
  updated_at = now();

INSERT INTO public.training_goal_set_items (goal_set_id, training_id, target_rank, sort_order)
SELECT
  gs.id,
  t.id,
  v.target_rank,
  t.sort_order
FROM (
  VALUES
    ('goal-tension-resolve-beginner', 'C'),
    ('goal-tension-resolve-trainer', 'B'),
    ('goal-tension-resolve-master', 'A')
) AS v(goal_slug, target_rank)
JOIN public.training_goal_sets AS gs ON gs.slug = v.goal_slug
JOIN public.trainings AS t ON t.category_id = uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-tension_resolve')
WHERE t.is_active IS NOT FALSE
  AND COALESCE(t.lesson_only, false) IS NOT TRUE
ON CONFLICT (goal_set_id, training_id) DO UPDATE SET
  target_rank = EXCLUDED.target_rank,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.badges (id, category, rank, name, name_en, condition_type, condition_value, condition_text, condition_text_en, image_path, sort_order, is_active)
SELECT
  'training_tension_resolve_b_' || v.rank::text,
  'training_tension_resolve',
  v.rank,
  'テンションリゾルブ ' || v.label_ja,
  'Tension Resolve ' || v.label_en,
  'training_category_rank',
  v.threshold,
  'テンションリゾルブの全課題を' || v.label_ja || '以上でクリア',
  'Clear all Tension Resolve trainings at ' || v.label_en || ' or better',
  '/achivement/achievement_monster_33.png',
  200 + 15 * 3 + v.rank,
  true
FROM (
  VALUES
    (1, 2, 'B以上', 'B+'),
    (2, 3, 'A以上', 'A+'),
    (3, 4, 'S以上', 'S+')
) AS v(rank, threshold, label_ja, label_en)
ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  condition_text = EXCLUDED.condition_text,
  condition_text_en = EXCLUDED.condition_text_en,
  updated_at = now();

COMMIT;

