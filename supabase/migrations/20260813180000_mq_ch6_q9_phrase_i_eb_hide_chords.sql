-- クエスト9 サバイバル・フレーズ: コードネーム非表示、フレーズ I 末尾に Eb4 を追加

UPDATE public.survival_stages
SET
  chord_display_name = '',
  chord_display_name_en = '',
  hide_chord_names_in_battle = true,
  updated_at = now()
WHERE map_category = 'phrases'
  AND stage_number BETWEEN 501 AND 505;

UPDATE public.survival_phrase_chords c
SET chord_name = ''
FROM public.survival_phrases p
WHERE p.id = c.phrase_id
  AND p.map_category = 'phrases'
  AND p.stage_number BETWEEN 501 AND 505;

INSERT INTO public.survival_phrase_chord_notes (
  chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index
)
SELECT c.id, 9, 63, 3, 'Eb4', 1, 9
FROM public.survival_phrase_chords c
JOIN public.survival_phrases p ON p.id = c.phrase_id
WHERE p.map_category = 'phrases'
  AND p.stage_number = 501
  AND NOT EXISTS (
    SELECT 1
    FROM public.survival_phrase_chord_notes n
    WHERE n.chord_id = c.id
      AND n.order_index = 9
  );
