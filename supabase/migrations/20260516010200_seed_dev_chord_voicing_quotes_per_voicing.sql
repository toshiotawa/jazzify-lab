-- 開発者テストコース（dev-chord-voicing-bpm100-test）と iOS デモ（demo-ios-chord-voicing-bpm100）の
-- 各「ヴォイシング行」（ear_training_phrase_chords の 1 行）にユニークなセリフを紐付ける。
-- 1 つのコード名（ハーモニー）の中に複数ヴォイシングがある場合でも、行ごとに別の文を持つ。
--
-- 親 phrase_chord 行が無い環境では JOIN により自然にスキップされる。
-- スキーマ上 (phrase_chord_id) は UNIQUE なので、行ごとに 0..1 の関係で安全。

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
  WHERE s.slug IN (
    'dev-chord-voicing-bpm100-test',
    'demo-ios-chord-voicing-bpm100'
  )
)
INSERT INTO public.ear_training_phrase_chord_quotes (phrase_chord_id, text)
SELECT
  phrase_chord_id,
  chord_name || ':第' || voicing_num || 'ヴォイシング'
FROM ranked
ON CONFLICT (phrase_chord_id) DO UPDATE SET
  text = EXCLUDED.text,
  updated_at = now();
