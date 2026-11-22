-- Call-and-response: configurable laps (NULL = 1) for kill-count clear target; legacy clients ignore this column.
BEGIN;

ALTER TABLE public.defense_stages
  ADD COLUMN IF NOT EXISTS call_response_laps smallint DEFAULT NULL;

ALTER TABLE public.defense_stages
  DROP CONSTRAINT IF EXISTS defense_stages_call_response_laps_check;

ALTER TABLE public.defense_stages
  ADD CONSTRAINT defense_stages_call_response_laps_check CHECK (
    call_response_laps IS NULL OR call_response_laps >= 1
  );

COMMENT ON COLUMN public.defense_stages.call_response_laps IS
  'Minimum full call/response laps for kill-count clear (effective laps also enforces min 50 notes); NULL = 1.';

UPDATE public.defense_stages
SET call_response_laps = 1, updated_at = now()
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'defense-stage-1-1-call-response'
);

COMMIT;