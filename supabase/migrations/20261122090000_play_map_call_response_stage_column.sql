-- Stage 1-1: legacy defense_stage_id for iOS < 1.5.2; call_response_* for iOS 1.5.2+ and Web.
BEGIN;

ALTER TABLE public.play_map_nodes
  ADD COLUMN IF NOT EXISTS call_response_defense_stage_id uuid REFERENCES public.defense_stages(id),
  ADD COLUMN IF NOT EXISTS call_response_difficulty_level smallint;

ALTER TABLE public.play_map_nodes
  DROP CONSTRAINT IF EXISTS play_map_nodes_call_response_difficulty_level_check;

ALTER TABLE public.play_map_nodes
  ADD CONSTRAINT play_map_nodes_call_response_difficulty_level_check CHECK (
    call_response_difficulty_level IS NULL
    OR (call_response_difficulty_level >= 1 AND call_response_difficulty_level <= 15)
  );

COMMENT ON COLUMN public.play_map_nodes.call_response_defense_stage_id IS
  'Optional call-and-response stage for clients that support defense C&R (iOS 1.5.2+, Web).';
COMMENT ON COLUMN public.play_map_nodes.call_response_difficulty_level IS
  'Optional combat preset when call_response_defense_stage_id is used.';

UPDATE public.play_map_nodes
SET
  defense_stage_id = uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'defense-dev-survival-phrases-1-4'
  ),
  difficulty_level = 7,
  call_response_defense_stage_id = uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'defense-stage-1-1-call-response'
  ),
  call_response_difficulty_level = 5,
  updated_at = now()
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000002'::uuid,
  'pd-node-adv-0'
);

COMMIT;