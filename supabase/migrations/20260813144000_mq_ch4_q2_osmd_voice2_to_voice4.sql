-- Ch4 Q2 OSMD: 右手 call（voice 2）を voice 4 cue にし、voice 1 と同一小節に重ならないよう交互配置。
-- コール小節の右手は判定対象外になるため enemy_hp を pitch 数に合わせる。
BEGIN;

UPDATE public.ear_training_phrases AS p
SET
  music_xml_url = CASE s.slug
    WHEN 'mq-b3-4-2-2-osmd' THEN 'https://jazzify-cdn.com/sozai/mq-b3-4-2-2-guide-voice4-cue.musicxml?v=202608131440'
    WHEN 'mq-b3-4-2-4-osmd' THEN 'https://jazzify-cdn.com/sozai/mq-b3-4-2-4-guide-voice4-cue.musicxml?v=202608131440'
  END,
  updated_at = now()
FROM public.ear_training_stages AS s
WHERE p.stage_id = s.id
  AND s.slug IN ('mq-b3-4-2-2-osmd', 'mq-b3-4-2-4-osmd');

UPDATE public.ear_training_stages
SET
  enemy_hp = 92,
  miss_damage = 4,
  fail_damage = 6,
  updated_at = now()
WHERE slug = 'mq-b3-4-2-2-osmd';

UPDATE public.ear_training_stages
SET
  enemy_hp = 132,
  miss_damage = 3,
  fail_damage = 5,
  updated_at = now()
WHERE slug = 'mq-b3-4-2-4-osmd';

COMMIT;
