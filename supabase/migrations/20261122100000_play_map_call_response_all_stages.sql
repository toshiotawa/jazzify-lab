-- Phrase Defense stages 1-2 through 2-1: enable call-and-response stage for iOS 1.5.2+ and Web
-- while preserving legacy defense_stage_id / difficulty_level for iOS < 1.5.2.
BEGIN;

UPDATE public.play_map_nodes AS n
SET
  call_response_defense_stage_id = uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'defense-stage-1-1-call-response'
  ),
  call_response_difficulty_level = v.cr_difficulty_level,
  updated_at = now()
FROM (
  VALUES
    ('pd-node-adv-1', 6),
    ('pd-node-adv-2', 7),
    ('pd-node-adv-3', 8),
    ('pd-node-adv-4', 9),
    ('pd-node-adv-2-1', 10)
) AS v(node_key, cr_difficulty_level)
WHERE n.id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000002'::uuid,
  v.node_key
);

COMMIT;