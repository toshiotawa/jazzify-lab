-- II-V-I 1bar / 2bar:
-- 精密モードでも Voice 4 cue を表示し、2bar のハンマー開始を8拍前に固定する。
BEGIN;

UPDATE public.ear_training_phrases AS phrase
SET
  music_xml_url = replace(phrase.music_xml_url, '-precision.musicxml', '-osmd.musicxml'),
  updated_at = now()
FROM public.ear_training_stages AS stage
WHERE phrase.stage_id = stage.id
  AND stage.mode = 'chord_precision'
  AND (
    stage.slug LIKE 'm251-s1-%-precision'
    OR stage.slug LIKE 'm251-s2-%-precision'
  )
  AND phrase.music_xml_url LIKE '%-precision.musicxml%';

-- 4/4の2小節 = 8拍前。
UPDATE public.ear_training_stages
SET
  hammer_lead_measures = 2,
  updated_at = now()
WHERE slug LIKE 'm251-s2-%';

COMMIT;
