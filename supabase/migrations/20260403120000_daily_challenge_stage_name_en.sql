-- デイリーチャレンジ fantasy_stages の英語名・説明
UPDATE public.fantasy_stages
SET
  name_en = v.name_en,
  description_en = v.description_en
FROM (VALUES
  ('DC-SUPER-BEGINNER', 'Daily Challenge (Super Beginner)', 'Single-note recognition across all 17 pitch classes (including sharps and flats).'),
  ('DC-BEGINNER', 'Daily Challenge (Beginner)', 'Sheet reading mode: treble and bass clefs, all accidentals.'),
  ('DC-INTERMEDIATE', 'Daily Challenge (Intermediate)', 'Major and minor triads on every root.'),
  ('DC-ADVANCED', 'Daily Challenge (Advanced)', 'Seven church modes, harmonic and melodic minor, whole-half and half-whole diminished, altered, and Lydian dominant.'),
  ('DC-SUPER-ADVANCED', 'Daily Challenge (Super Advanced)', 'Jazz voicings on every root: M7(9), m7(9), 7(9.6th), and more.')
) AS v(stage_number, name_en, description_en)
WHERE public.fantasy_stages.stage_number = v.stage_number;
