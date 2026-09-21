-- Phrase Defense: default survive 120s / HP 20 / always-on production hints.
-- Also backfill all existing defense_stages.
BEGIN;

ALTER TABLE public.defense_stages
  ALTER COLUMN survive_seconds SET DEFAULT 120,
  ALTER COLUMN player_hp SET DEFAULT 20,
  ALTER COLUMN production_staff_hint_mode SET DEFAULT 'always',
  ALTER COLUMN production_keyboard_hint_mode SET DEFAULT 'always';

UPDATE public.defense_stages
SET
  survive_seconds = 120,
  player_hp = 20,
  production_staff_hint_mode = 'always',
  production_keyboard_hint_mode = 'always';

COMMIT;
