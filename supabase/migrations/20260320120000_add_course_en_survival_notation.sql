-- レッスンコースの英語タイトル・説明（Web/iOS 共通の title_en / description_en）
UPDATE courses SET
  title_en = 'Survival Mode Mastery',
  description_en = 'A course to thoroughly practice every chord type that appears in Survival Mode. Organized into blocks by chord type and difficulty so you can master them step by step.'
WHERE id = '95cf6992-e987-4235-b8e2-03fe1bad8a00';

UPDATE courses SET
  title_en = 'Reading Music Notation',
  description_en = 'Learn to read notes on the staff. Study treble and bass clef progressively and build your sight-reading skills.'
WHERE id = 'a2fe7c8c-a754-4a11-8b60-890abf37329e';
