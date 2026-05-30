-- Enable production keyboard hints for all existing chord_osmd stages.
BEGIN;

UPDATE public.ear_training_stages
SET show_keyboard_hints_in_battle = true
WHERE mode = 'chord_osmd'
  AND show_keyboard_hints_in_battle = false;

COMMIT;
