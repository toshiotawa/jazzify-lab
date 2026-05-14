-- 開発者テストコース / iOS デモ用に投入していた chord voicing のテストセリフを削除する。
-- 本番データのセリフは別途管理する想定。テーブル定義は維持する。

DELETE FROM public.ear_training_phrase_chord_quotes q
USING public.ear_training_phrase_chords c
JOIN public.ear_training_phrases p ON p.id = c.phrase_id
JOIN public.ear_training_stages s ON s.id = p.stage_id
WHERE q.phrase_chord_id = c.id
  AND s.slug IN (
    'dev-chord-voicing-bpm100-test',
    'demo-ios-chord-voicing-bpm100'
  );
