-- Bluesy Licks: 本番モードの鍵盤ハイライトを OFF（練習モードは従来どおり ON）
UPDATE public.ear_training_stages
SET show_keyboard_hints_in_battle = false,
    updated_at = now()
WHERE slug LIKE 'bl-stage-%'
  AND mode = 'chord_osmd';
