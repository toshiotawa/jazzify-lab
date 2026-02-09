-- ステージ7に度数（インターバル）出題を追加
-- 作成日: 2026-02-09

BEGIN;

-- 7-1: 短2度（m2）の上行・下行
UPDATE fantasy_stages
SET allowed_chords = jsonb_build_array(
  -- C root
  jsonb_build_object('chord', 'C', 'interval', 'm2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C', 'interval', 'm2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  -- C# root
  jsonb_build_object('chord', 'C#', 'interval', 'm2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C#', 'interval', 'm2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  -- D root
  jsonb_build_object('chord', 'D', 'interval', 'm2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D', 'interval', 'm2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  -- D# root
  jsonb_build_object('chord', 'D#', 'interval', 'm2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D#', 'interval', 'm2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  -- E root
  jsonb_build_object('chord', 'E', 'interval', 'm2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'E', 'interval', 'm2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  -- F root
  jsonb_build_object('chord', 'F', 'interval', 'm2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F', 'interval', 'm2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  -- F# root
  jsonb_build_object('chord', 'F#', 'interval', 'm2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F#', 'interval', 'm2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  -- G root
  jsonb_build_object('chord', 'G', 'interval', 'm2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G', 'interval', 'm2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  -- G# root
  jsonb_build_object('chord', 'G#', 'interval', 'm2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G#', 'interval', 'm2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  -- A root
  jsonb_build_object('chord', 'A', 'interval', 'm2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A', 'interval', 'm2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  -- A# root
  jsonb_build_object('chord', 'A#', 'interval', 'm2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A#', 'interval', 'm2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  -- B root
  jsonb_build_object('chord', 'B', 'interval', 'm2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'B', 'interval', 'm2', 'direction', 'down', 'octave', 4, 'type', 'interval')
)
WHERE stage_number = '7-1';

-- 7-2: 長2度（M2）の上行・下行
UPDATE fantasy_stages
SET allowed_chords = jsonb_build_array(
  jsonb_build_object('chord', 'C', 'interval', 'M2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C', 'interval', 'M2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C#', 'interval', 'M2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C#', 'interval', 'M2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D', 'interval', 'M2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D', 'interval', 'M2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D#', 'interval', 'M2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D#', 'interval', 'M2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'E', 'interval', 'M2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'E', 'interval', 'M2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F', 'interval', 'M2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F', 'interval', 'M2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F#', 'interval', 'M2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F#', 'interval', 'M2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G', 'interval', 'M2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G', 'interval', 'M2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G#', 'interval', 'M2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G#', 'interval', 'M2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A', 'interval', 'M2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A', 'interval', 'M2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A#', 'interval', 'M2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A#', 'interval', 'M2', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'B', 'interval', 'M2', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'B', 'interval', 'M2', 'direction', 'down', 'octave', 4, 'type', 'interval')
)
WHERE stage_number = '7-2';

-- 7-3: 短3度（m3）の上行・下行
UPDATE fantasy_stages
SET allowed_chords = jsonb_build_array(
  jsonb_build_object('chord', 'C', 'interval', 'm3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C', 'interval', 'm3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C#', 'interval', 'm3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C#', 'interval', 'm3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D', 'interval', 'm3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D', 'interval', 'm3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D#', 'interval', 'm3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D#', 'interval', 'm3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'E', 'interval', 'm3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'E', 'interval', 'm3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F', 'interval', 'm3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F', 'interval', 'm3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F#', 'interval', 'm3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F#', 'interval', 'm3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G', 'interval', 'm3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G', 'interval', 'm3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G#', 'interval', 'm3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G#', 'interval', 'm3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A', 'interval', 'm3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A', 'interval', 'm3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A#', 'interval', 'm3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A#', 'interval', 'm3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'B', 'interval', 'm3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'B', 'interval', 'm3', 'direction', 'down', 'octave', 4, 'type', 'interval')
)
WHERE stage_number = '7-3';

-- 7-4: 長3度（M3）の上行・下行
UPDATE fantasy_stages
SET allowed_chords = jsonb_build_array(
  jsonb_build_object('chord', 'C', 'interval', 'M3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C', 'interval', 'M3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C#', 'interval', 'M3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C#', 'interval', 'M3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D', 'interval', 'M3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D', 'interval', 'M3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D#', 'interval', 'M3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D#', 'interval', 'M3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'E', 'interval', 'M3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'E', 'interval', 'M3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F', 'interval', 'M3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F', 'interval', 'M3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F#', 'interval', 'M3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F#', 'interval', 'M3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G', 'interval', 'M3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G', 'interval', 'M3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G#', 'interval', 'M3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G#', 'interval', 'M3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A', 'interval', 'M3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A', 'interval', 'M3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A#', 'interval', 'M3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A#', 'interval', 'M3', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'B', 'interval', 'M3', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'B', 'interval', 'M3', 'direction', 'down', 'octave', 4, 'type', 'interval')
)
WHERE stage_number = '7-4';

-- 7-5: 完全4度（P4）の上行・下行
UPDATE fantasy_stages
SET allowed_chords = jsonb_build_array(
  jsonb_build_object('chord', 'C', 'interval', 'P4', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C', 'interval', 'P4', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C#', 'interval', 'P4', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C#', 'interval', 'P4', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D', 'interval', 'P4', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D', 'interval', 'P4', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D#', 'interval', 'P4', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D#', 'interval', 'P4', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'E', 'interval', 'P4', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'E', 'interval', 'P4', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F', 'interval', 'P4', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F', 'interval', 'P4', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F#', 'interval', 'P4', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F#', 'interval', 'P4', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G', 'interval', 'P4', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G', 'interval', 'P4', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G#', 'interval', 'P4', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G#', 'interval', 'P4', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A', 'interval', 'P4', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A', 'interval', 'P4', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A#', 'interval', 'P4', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A#', 'interval', 'P4', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'B', 'interval', 'P4', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'B', 'interval', 'P4', 'direction', 'down', 'octave', 4, 'type', 'interval')
)
WHERE stage_number = '7-5';

-- 7-6: 完全5度（P5）の上行・下行
UPDATE fantasy_stages
SET allowed_chords = jsonb_build_array(
  jsonb_build_object('chord', 'C', 'interval', 'P5', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C', 'interval', 'P5', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C#', 'interval', 'P5', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C#', 'interval', 'P5', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D', 'interval', 'P5', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D', 'interval', 'P5', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D#', 'interval', 'P5', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D#', 'interval', 'P5', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'E', 'interval', 'P5', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'E', 'interval', 'P5', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F', 'interval', 'P5', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F', 'interval', 'P5', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F#', 'interval', 'P5', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F#', 'interval', 'P5', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G', 'interval', 'P5', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G', 'interval', 'P5', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G#', 'interval', 'P5', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G#', 'interval', 'P5', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A', 'interval', 'P5', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A', 'interval', 'P5', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A#', 'interval', 'P5', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A#', 'interval', 'P5', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'B', 'interval', 'P5', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'B', 'interval', 'P5', 'direction', 'down', 'octave', 4, 'type', 'interval')
)
WHERE stage_number = '7-6';

-- 7-7: 短6度（m6）の上行・下行
UPDATE fantasy_stages
SET allowed_chords = jsonb_build_array(
  jsonb_build_object('chord', 'C', 'interval', 'm6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C', 'interval', 'm6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C#', 'interval', 'm6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C#', 'interval', 'm6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D', 'interval', 'm6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D', 'interval', 'm6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D#', 'interval', 'm6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D#', 'interval', 'm6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'E', 'interval', 'm6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'E', 'interval', 'm6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F', 'interval', 'm6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F', 'interval', 'm6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F#', 'interval', 'm6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F#', 'interval', 'm6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G', 'interval', 'm6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G', 'interval', 'm6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G#', 'interval', 'm6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G#', 'interval', 'm6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A', 'interval', 'm6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A', 'interval', 'm6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A#', 'interval', 'm6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A#', 'interval', 'm6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'B', 'interval', 'm6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'B', 'interval', 'm6', 'direction', 'down', 'octave', 4, 'type', 'interval')
)
WHERE stage_number = '7-7';

-- 7-8: 長6度（M6）の上行・下行
UPDATE fantasy_stages
SET allowed_chords = jsonb_build_array(
  jsonb_build_object('chord', 'C', 'interval', 'M6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C', 'interval', 'M6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C#', 'interval', 'M6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C#', 'interval', 'M6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D', 'interval', 'M6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D', 'interval', 'M6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D#', 'interval', 'M6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D#', 'interval', 'M6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'E', 'interval', 'M6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'E', 'interval', 'M6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F', 'interval', 'M6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F', 'interval', 'M6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F#', 'interval', 'M6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F#', 'interval', 'M6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G', 'interval', 'M6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G', 'interval', 'M6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G#', 'interval', 'M6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G#', 'interval', 'M6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A', 'interval', 'M6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A', 'interval', 'M6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A#', 'interval', 'M6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A#', 'interval', 'M6', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'B', 'interval', 'M6', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'B', 'interval', 'M6', 'direction', 'down', 'octave', 4, 'type', 'interval')
)
WHERE stage_number = '7-8';

-- 7-9: 短7度（m7）の上行・下行
UPDATE fantasy_stages
SET allowed_chords = jsonb_build_array(
  jsonb_build_object('chord', 'C', 'interval', 'm7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C', 'interval', 'm7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C#', 'interval', 'm7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C#', 'interval', 'm7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D', 'interval', 'm7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D', 'interval', 'm7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D#', 'interval', 'm7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D#', 'interval', 'm7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'E', 'interval', 'm7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'E', 'interval', 'm7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F', 'interval', 'm7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F', 'interval', 'm7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F#', 'interval', 'm7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F#', 'interval', 'm7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G', 'interval', 'm7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G', 'interval', 'm7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G#', 'interval', 'm7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G#', 'interval', 'm7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A', 'interval', 'm7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A', 'interval', 'm7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A#', 'interval', 'm7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A#', 'interval', 'm7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'B', 'interval', 'm7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'B', 'interval', 'm7', 'direction', 'down', 'octave', 4, 'type', 'interval')
)
WHERE stage_number = '7-9';

-- 7-10: 長7度（M7）の上行・下行
UPDATE fantasy_stages
SET allowed_chords = jsonb_build_array(
  jsonb_build_object('chord', 'C', 'interval', 'M7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C', 'interval', 'M7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C#', 'interval', 'M7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'C#', 'interval', 'M7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D', 'interval', 'M7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D', 'interval', 'M7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D#', 'interval', 'M7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'D#', 'interval', 'M7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'E', 'interval', 'M7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'E', 'interval', 'M7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F', 'interval', 'M7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F', 'interval', 'M7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F#', 'interval', 'M7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'F#', 'interval', 'M7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G', 'interval', 'M7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G', 'interval', 'M7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G#', 'interval', 'M7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'G#', 'interval', 'M7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A', 'interval', 'M7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A', 'interval', 'M7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A#', 'interval', 'M7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'A#', 'interval', 'M7', 'direction', 'down', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'B', 'interval', 'M7', 'direction', 'up', 'octave', 4, 'type', 'interval'),
  jsonb_build_object('chord', 'B', 'interval', 'M7', 'direction', 'down', 'octave', 4, 'type', 'interval')
)
WHERE stage_number = '7-10';

COMMIT;
