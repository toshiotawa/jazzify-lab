-- クエスト9 サバイバル・フレーズ: 譜表をト音記号（staff=1）に揃える
-- 原譜 mq-b5-6-9.musicxml は G clef。生成時に staff=2（ヘ音）を入れていた。
UPDATE public.survival_phrase_chord_notes n
SET staff = 1
FROM public.survival_phrase_chords c
JOIN public.survival_phrases p ON p.id = c.phrase_id
WHERE n.chord_id = c.id
  AND p.map_category = 'phrases'
  AND p.stage_number BETWEEN 501 AND 505
  AND n.staff IS DISTINCT FROM 1;
