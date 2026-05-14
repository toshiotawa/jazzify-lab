-- 開発者テストコースのコード演奏バトル（dev-chord-voicing-bpm100-test）の各ヴォイシングにセリフを紐付け
-- 親の phrase_chord が無い環境では何もしない（FK エラー回避）

INSERT INTO public.ear_training_phrase_chord_quotes (phrase_chord_id, text)
SELECT v.phrase_chord_id, v.text
FROM (
  VALUES
    (
      uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-c0'),
      'ツーから始まるよ！'::text
    ),
    (
      uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-c1'),
      'ドミナントで攻める！'::text
    ),
    (
      uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-c2'),
      'トニックに帰還する！'::text
    ),
    (
      uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-c3'),
      'キレイに収まったね！'::text
    ),
    (
      uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-c0'),
      '裏のドミナントだ！'::text
    ),
    (
      uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-c1'),
      'ツーへ向かって押せ！'::text
    ),
    (
      uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-c2'),
      '本物のツーだよ！'::text
    ),
    (
      uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-c3'),
      'ファイブで締めよう！'::text
    )
) AS v(phrase_chord_id, text)
WHERE EXISTS (
  SELECT 1
  FROM public.ear_training_phrase_chords ch
  WHERE ch.id = v.phrase_chord_id
)
ON CONFLICT (phrase_chord_id) DO UPDATE SET
  text = EXCLUDED.text,
  updated_at = now();
