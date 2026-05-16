-- OSMD 開発者コース レッスン8（developer-course-osmd-finale-two-staves-whole-lab）:
-- phrase chord の voicing を MusicXML の同時発音と一致させる。

UPDATE public.ear_training_phrase_chords SET
  voicing = ARRAY['D4', 'E2']::text[],
  voicing_staves = ARRAY[1, 2]::smallint[]
WHERE id = 'a3bb401e-ff91-5065-8fc8-ccbaed5600b9'::uuid;

UPDATE public.ear_training_phrase_chords SET
  voicing = ARRAY['G4', 'E6']::text[],
  voicing_staves = ARRAY[1, 1]::smallint[]
WHERE id = '293d7e68-224d-573f-987d-11b66672daa9'::uuid;

UPDATE public.ear_training_phrase_chords SET
  voicing = ARRAY['C4', 'C3']::text[],
  voicing_staves = ARRAY[1, 2]::smallint[]
WHERE id = 'be901d9e-a661-5935-9f0d-2dce2d20c70b'::uuid;

UPDATE public.ear_training_phrase_chords SET
  voicing = ARRAY['A4']::text[],
  voicing_staves = ARRAY[1]::smallint[]
WHERE id = '818d5719-118e-5527-b89a-588a9e8e5b3d'::uuid;
