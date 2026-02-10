-- ランク8ステージのスケール出題に修正
-- 作成日: 2026-02-09

BEGIN;

-- 8-1: C/F/G のメジャー・ナチュラルマイナー
UPDATE fantasy_stages
SET allowed_chords = jsonb_build_array(
  'C major',
  'F major',
  'G major',
  'C natural_minor',
  'F natural_minor',
  'G natural_minor'
)
WHERE stage_number = '8-1';

-- 8-2: D/A/E/B のメジャー・ナチュラルマイナー
UPDATE fantasy_stages
SET allowed_chords = jsonb_build_array(
  'D major',
  'A major',
  'E major',
  'B major',
  'D natural_minor',
  'A natural_minor',
  'E natural_minor',
  'B natural_minor'
)
WHERE stage_number = '8-2';

-- 8-3: ♭系（F, Bb, Eb, Ab, Db, Gb）のメジャー・ナチュラルマイナー
UPDATE fantasy_stages
SET allowed_chords = jsonb_build_array(
  'F major',
  'Bb major',
  'Eb major',
  'Ab major',
  'Db major',
  'Gb major',
  'F natural_minor',
  'Bb natural_minor',
  'Eb natural_minor',
  'Ab natural_minor',
  'Db natural_minor',
  'Gb natural_minor'
)
WHERE stage_number = '8-3';

-- 8-4: #系（G, D, A, E, B, F#, C#）のメジャー・ナチュラルマイナー
UPDATE fantasy_stages
SET allowed_chords = jsonb_build_array(
  'G major',
  'D major',
  'A major',
  'E major',
  'B major',
  'F# major',
  'C# major',
  'G natural_minor',
  'D natural_minor',
  'A natural_minor',
  'E natural_minor',
  'B natural_minor',
  'F# natural_minor',
  'C# natural_minor'
)
WHERE stage_number = '8-4';

-- 8-5: メジャー・ナチュラルマイナー全体まとめ（12キー）
UPDATE fantasy_stages
SET allowed_chords = jsonb_build_array(
  'C major',
  'G major',
  'D major',
  'A major',
  'E major',
  'B major',
  'F# major',
  'C# major',
  'F major',
  'Bb major',
  'Eb major',
  'Ab major',
  'C natural_minor',
  'G natural_minor',
  'D natural_minor',
  'A natural_minor',
  'E natural_minor',
  'B natural_minor',
  'F# natural_minor',
  'C# natural_minor',
  'F natural_minor',
  'Bb natural_minor',
  'Eb natural_minor',
  'Ab natural_minor'
)
WHERE stage_number = '8-5';

-- 8-6: Am/Dm/Em のメジャー・ナチュラルマイナー
UPDATE fantasy_stages
SET allowed_chords = jsonb_build_array(
  'A major',
  'D major',
  'E major',
  'A natural_minor',
  'D natural_minor',
  'E natural_minor'
)
WHERE stage_number = '8-6';

-- 8-7: Cm/Fm/Gm のメジャー・ナチュラルマイナー
UPDATE fantasy_stages
SET allowed_chords = jsonb_build_array(
  'C major',
  'F major',
  'G major',
  'C natural_minor',
  'F natural_minor',
  'G natural_minor'
)
WHERE stage_number = '8-7';

-- 8-8: Bm/Bbm/F#m のメジャー・ナチュラルマイナー
UPDATE fantasy_stages
SET allowed_chords = jsonb_build_array(
  'B major',
  'Bb major',
  'F# major',
  'B natural_minor',
  'Bb natural_minor',
  'F# natural_minor'
)
WHERE stage_number = '8-8';

-- 8-9: 黒鍵のみ（#系と♭系全て）
UPDATE fantasy_stages
SET allowed_chords = jsonb_build_array(
  'C# major',
  'D# major',
  'F# major',
  'G# major',
  'A# major',
  'Db major',
  'Eb major',
  'Gb major',
  'Ab major',
  'Bb major',
  'C# natural_minor',
  'D# natural_minor',
  'F# natural_minor',
  'G# natural_minor',
  'A# natural_minor',
  'Db natural_minor',
  'Eb natural_minor',
  'Gb natural_minor',
  'Ab natural_minor',
  'Bb natural_minor'
)
WHERE stage_number = '8-9';

-- 8-10: メジャー・ナチュラルマイナー全体まとめ（12キー）
UPDATE fantasy_stages
SET allowed_chords = jsonb_build_array(
  'C major',
  'G major',
  'D major',
  'A major',
  'E major',
  'B major',
  'F# major',
  'C# major',
  'F major',
  'Bb major',
  'Eb major',
  'Ab major',
  'C natural_minor',
  'G natural_minor',
  'D natural_minor',
  'A natural_minor',
  'E natural_minor',
  'B natural_minor',
  'F# natural_minor',
  'C# natural_minor',
  'F natural_minor',
  'Bb natural_minor',
  'Eb natural_minor',
  'Ab natural_minor'
)
WHERE stage_number = '8-10';

COMMIT;
