-- Call-and-response 1:3 (1-bar call + 3-bar response), new audio URLs; iOS < 1.5.2 unchanged.
BEGIN;

ALTER TABLE public.defense_stages
  ADD COLUMN IF NOT EXISTS call_response_response_bars smallint DEFAULT NULL;

COMMENT ON COLUMN public.defense_stages.call_response_response_bars IS
  'Response (play) bar count per call/response cycle; NULL = same as call_response_bars (legacy 1:1).';

ALTER TABLE public.defense_stages
  DROP CONSTRAINT IF EXISTS defense_stages_call_response_check;

ALTER TABLE public.defense_stages
  ADD CONSTRAINT defense_stages_call_response_check CHECK (
    (
      call_response_bars IS NULL
      AND (audio_loop_bars IS NULL OR audio_loop_bars > 0)
      AND call_response_response_bars IS NULL
    )
    OR (
      call_response_bars IS NOT NULL
      AND call_response_bars >= 1
      AND audio_loop_bars IS NOT NULL
      AND audio_loop_bars > 0
      AND call_response_response_bars IS NULL
      AND audio_loop_bars >= call_response_bars * 2
      AND (audio_loop_bars % (call_response_bars * 2)) = 0
    )
    OR (
      call_response_bars IS NOT NULL
      AND call_response_bars >= 1
      AND audio_loop_bars IS NOT NULL
      AND audio_loop_bars > 0
      AND call_response_response_bars IS NOT NULL
      AND call_response_response_bars >= 1
      AND audio_loop_bars >= call_response_bars + call_response_response_bars
      AND (audio_loop_bars % (call_response_bars + call_response_response_bars)) = 0
    )
  );

UPDATE public.defense_stages
SET
  audio_loop_bars = 4,
  call_response_bars = 1,
  call_response_response_bars = 3,
  required_completion_count = 3,
  survive_seconds = 600,
  updated_at = now()
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'defense-stage-1-1-call-response'
);

UPDATE public.defense_phrases
SET audio_url = 'https://jazzify-cdn.com/sozai/defense-call-response/defense-stage-1-1-cr-phrase-1-1c3r-bpm120.mp3',
    updated_at = now()
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'defense-stage-1-1-cr-phrase-0'
);

UPDATE public.defense_phrases
SET audio_url = 'https://jazzify-cdn.com/sozai/defense-call-response/defense-stage-1-1-cr-phrase-2-1c3r-bpm120.mp3',
    updated_at = now()
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'defense-stage-1-1-cr-phrase-1'
);

UPDATE public.defense_phrases
SET audio_url = 'https://jazzify-cdn.com/sozai/defense-call-response/defense-stage-1-1-cr-phrase-3-1c3r-bpm120.mp3',
    updated_at = now()
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'defense-stage-1-1-cr-phrase-2'
);

UPDATE public.defense_phrases
SET audio_url = 'https://jazzify-cdn.com/sozai/defense-call-response/defense-stage-1-1-cr-phrase-4-1c3r-bpm120.mp3',
    updated_at = now()
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'defense-stage-1-1-cr-phrase-3'
);

-- call_response_difficulty_level for iOS 1.5.2+ / Web (legacy defense_stage_id / difficulty_level untouched)
UPDATE public.play_map_nodes AS n
SET
  call_response_difficulty_level = v.cr_difficulty_level,
  updated_at = now()
FROM (
  VALUES
    ('pd-node-adv-0', 4),
    ('pd-node-adv-1', 5),
    ('pd-node-adv-2', 6),
    ('pd-node-adv-3', 7),
    ('pd-node-adv-4', 8),
    ('pd-node-adv-2-1', 9)
) AS v(node_key, cr_difficulty_level)
WHERE n.id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000002'::uuid,
  v.node_key
);

COMMIT;