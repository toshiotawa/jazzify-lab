-- 開発者用コードヴォイシング・テストレッスンをセルフペースにし、
-- 各ヴォイシング行（ear_training_phrase_chords の 1 行）にサンプル quote を付与。
-- phrase 分割後の行 ID に依存しないよう、ステージ slug で JOIN して生成する。

UPDATE public.ear_training_stages
SET chord_voicing_self_paced = true
WHERE slug = 'dev-chord-voicing-bpm100-test';

WITH ranked AS (
  SELECT
    c.id AS phrase_chord_id,
    c.chord_name,
    ROW_NUMBER() OVER (
      PARTITION BY p.id, c.chord_name
      ORDER BY c.order_index
    ) AS voicing_num
  FROM public.ear_training_phrase_chords c
  JOIN public.ear_training_phrases p ON p.id = c.phrase_id
  JOIN public.ear_training_stages s ON s.id = p.stage_id
  WHERE s.slug = 'dev-chord-voicing-bpm100-test'
)
INSERT INTO public.ear_training_phrase_chord_quotes (phrase_chord_id, text)
SELECT
  phrase_chord_id,
  LEFT(
    chord_name || '：第' || voicing_num::text || 'ヴォイシング（サンプル）',
    80
  )
FROM ranked
ON CONFLICT (phrase_chord_id) DO UPDATE SET
  text = EXCLUDED.text,
  updated_at = now();
