-- 複合フレーズ・ペアアドリブチュートリアル: requiredLoops 化、ペアタイミング修正
BEGIN;

-- シーン: requiredMeasures / requiredCompletedPhrases → requiredLoops
UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(
    script,
    '{scenes}',
    (
      SELECT jsonb_agg(
        CASE
          WHEN elem->>'type' = 'phrase_pair_adlib' THEN
            (elem - 'requiredMeasures') || jsonb_build_object('requiredLoops', 2)
          WHEN elem->>'type' = 'composite' THEN
            (elem - 'requiredCompletedPhrases') || jsonb_build_object('requiredLoops', 2)
          ELSE elem
        END
        ORDER BY ord
      )
      FROM jsonb_array_elements(script->'scenes') WITH ORDINALITY AS t(elem, ord)
    ),
    true
  ),
  updated_at = now()
WHERE id IN (
  'developer-full-v1',
  'developer-tutorial-pair-adlib-v1',
  'developer-tutorial-composite-v1'
);

-- ペアアドリブ content: bpm100・4小節 → loop 9.6秒、ステップタイミング整合
UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(
    script,
    '{content,tutorial-pair-adlib,phrase_pair_adlib}',
    jsonb_build_object(
      'bgm_url', 'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
      'key_fifths', 0,
      'loop_duration_sec', 9.6,
      'steps', jsonb_build_array(
        jsonb_build_object(
          'order_index', 0,
          'chord_name', 'Dm7',
          'pattern_group_key', 'cm7',
          'measure_number', 1,
          'start_time_sec', 0,
          'end_time_sec', 2.4,
          'quote', jsonb_build_object('ja', '1 小節目', 'en', 'Measure 1')
        ),
        jsonb_build_object(
          'order_index', 1,
          'chord_name', 'G7',
          'pattern_group_key', 'cm7',
          'measure_number', 2,
          'start_time_sec', 2.4,
          'end_time_sec', 4.8
        ),
        jsonb_build_object(
          'order_index', 2,
          'chord_name', 'CM7',
          'pattern_group_key', 'cm7',
          'measure_number', 3,
          'start_time_sec', 4.8,
          'end_time_sec', 7.2,
          'input_disabled', true,
          'quote', jsonb_build_object('ja', '3 小節目：聴くだけ', 'en', 'Measure 3: listen')
        ),
        jsonb_build_object(
          'order_index', 3,
          'chord_name', 'CM7',
          'pattern_group_key', 'cm7',
          'measure_number', 4,
          'start_time_sec', 7.2,
          'end_time_sec', 9.6
        )
      ),
      'patterns', jsonb_build_array(
        jsonb_build_object(
          'group_key', 'cm7',
          'label', 'A',
          'pcs', jsonb_build_array(0, 2),
          'family_id', 'CM7-A',
          'carry_tail_length', 0,
          'priority', 0,
          'voicing', jsonb_build_array('C4', 'D4'),
          'voicing_staves', jsonb_build_array(1, 1)
        ),
        jsonb_build_object(
          'group_key', 'cm7',
          'label', 'B',
          'pcs', jsonb_build_array(4, 7),
          'family_id', 'CM7-B',
          'carry_tail_length', 0,
          'priority', 0,
          'voicing', jsonb_build_array('E4', 'G4'),
          'voicing_staves', jsonb_build_array(1, 1)
        )
      )
    ),
    true
  ),
  updated_at = now()
WHERE id IN ('developer-full-v1', 'developer-tutorial-pair-adlib-v1')
  AND script->'content' ? 'tutorial-pair-adlib';

COMMIT;
