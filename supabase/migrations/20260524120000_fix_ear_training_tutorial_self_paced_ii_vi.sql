-- 耳コピチュートリアル self-paced-ii-vi: loop_measures とコードタイミングを整合（CM7 が G7/Dm7 小節に巻き込まれる不具合）

UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(
    jsonb_set(
      script,
      '{content,self-paced-ii-vi,stage,loop_measures}',
      '4'::jsonb,
      true
    ),
    '{content,self-paced-ii-vi,phrases}',
    jsonb_build_array(
      jsonb_build_object(
        'order_index', 0,
        'title', 'II-V-I',
        'loop_duration_sec', 8,
        'chords', jsonb_build_array(
          jsonb_build_object(
            'order_index', 0,
            'chord_name', 'Dm7',
            'measure_number', 1,
            'beat_offset', 1,
            'duration_beats', 4,
            'start_time_sec', 0,
            'end_time_sec', 2,
            'voicing', jsonb_build_array('D3', 'F3', 'A3', 'C4'),
            'voicing_staves', jsonb_build_array(2, 2, 2, 1)
          ),
          jsonb_build_object(
            'order_index', 1,
            'chord_name', 'G7',
            'measure_number', 2,
            'beat_offset', 1,
            'duration_beats', 4,
            'start_time_sec', 2,
            'end_time_sec', 4,
            'voicing', jsonb_build_array('G3', 'B3', 'D4', 'F4'),
            'voicing_staves', jsonb_build_array(2, 2, 1, 1)
          ),
          jsonb_build_object(
            'order_index', 2,
            'chord_name', 'CM7',
            'measure_number', 3,
            'beat_offset', 1,
            'duration_beats', 4,
            'start_time_sec', 4,
            'end_time_sec', 8,
            'voicing', jsonb_build_array('C3', 'E3', 'G3', 'B3'),
            'voicing_staves', jsonb_build_array(2, 2, 2, 2)
          )
        )
      )
    ),
    true
  ),
  updated_at = now()
WHERE id = 'developer-full-v1';
