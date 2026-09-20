-- Now's The Time shared-progression test: switch phrase after one completion (2 bars)
BEGIN;

UPDATE public.defense_stages
SET required_completion_count = 1
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'defense-basic-nows-the-time-test'
);

COMMIT;
