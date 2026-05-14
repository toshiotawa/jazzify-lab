-- 開発者テストコース（dev-chord-voicing-bpm100-test）と iOS デモ（demo-ios-chord-voicing-bpm100）の
-- 各ヴォイシングに 8〜15 文字のセリフを紐付ける。
-- フレーズ内で同一コードが複数回出現する分割スキーマでも、コード名一致でまとめて当てる。
-- 親 phrase_chord 行が無い環境では JOIN により自然にスキップされる。

INSERT INTO public.ear_training_phrase_chord_quotes (phrase_chord_id, text)
SELECT c.id, m.text
FROM public.ear_training_phrase_chords c
JOIN public.ear_training_phrases p ON p.id = c.phrase_id
JOIN public.ear_training_stages s ON s.id = p.stage_id
JOIN (
  VALUES
    ('dev-chord-voicing-bpm100-test', 'Dm7', 'ツーから始めるよ！'),
    ('dev-chord-voicing-bpm100-test', 'G7',  'ドミナントで攻める！'),
    ('dev-chord-voicing-bpm100-test', 'CM7', 'トニックに帰還する！'),
    ('dev-chord-voicing-bpm100-test', 'Em7', '裏のドミナントだ！'),
    ('dev-chord-voicing-bpm100-test', 'A7',  'ツーへ向かって押せ！'),
    ('demo-ios-chord-voicing-bpm100', 'Dm7', 'ツーから始めるよ！'),
    ('demo-ios-chord-voicing-bpm100', 'G7',  'ドミナントで攻める！'),
    ('demo-ios-chord-voicing-bpm100', 'CM7', 'トニックに帰還する！'),
    ('demo-ios-chord-voicing-bpm100', 'Em7', '裏のドミナントだ！'),
    ('demo-ios-chord-voicing-bpm100', 'A7',  'ツーへ向かって押せ！')
) AS m(slug, chord_name, text)
  ON m.slug = s.slug AND m.chord_name = c.chord_name
ON CONFLICT (phrase_chord_id) DO UPDATE SET
  text = EXCLUDED.text,
  updated_at = now();
