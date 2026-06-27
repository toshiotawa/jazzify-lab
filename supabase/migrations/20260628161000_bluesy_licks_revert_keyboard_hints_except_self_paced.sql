-- Bluesy Licks: 既存 Slow/等速は本番鍵盤ハイライト OFF（セルフペース課題のみ ON）
UPDATE public.ear_training_stages
SET show_keyboard_hints_in_battle = false,
    updated_at = now()
WHERE slug ~ '^bl-stage-[0-9]+-(slow|normal)$'
  AND mode = 'chord_osmd';
