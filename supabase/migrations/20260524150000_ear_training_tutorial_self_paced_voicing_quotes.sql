-- セルフペースチュートリアル: ヴォイシング単位の quote セリフ + timedLines 廃止
UPDATE public.ear_training_tutorial_scripts
SET script = jsonb_set(
  jsonb_set(
    script,
    '{content,self-paced-ii-vi,phrases,0,chords}',
    '[
      {"order_index":0,"chord_name":"Dm7","measure_number":1,"beat_offset":1,"duration_beats":4,"start_time_sec":0,"end_time_sec":2,"voicing":["D3","F3","A3","C4"],"voicing_staves":[2,2,2,1],"quote":{"ja":"Dm7（II）。このヴォイシングをドラムに合わせて。","en":"Dm7 (II). Play this voicing with the drums."}},
      {"order_index":1,"chord_name":"G7","measure_number":2,"beat_offset":1,"duration_beats":4,"start_time_sec":2,"end_time_sec":4,"voicing":["G3","B3","D4","F4"],"voicing_staves":[2,2,1,1],"quote":{"ja":"G7（V）。次はこちらです。","en":"G7 (V). Next chord."}},
      {"order_index":2,"chord_name":"CM7","measure_number":3,"beat_offset":1,"duration_beats":4,"start_time_sec":4,"end_time_sec":8,"voicing":["C3","E3","G3","B3"],"voicing_staves":[2,2,2,2],"quote":{"ja":"CM7（I）。聴き分けて演奏しよう。","en":"CM7 (I). Hear the voicing and play."}}
    ]'::jsonb
  ),
  '{scenes}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'type' = 'chord_voicing_self_paced' THEN
          jsonb_set(
            elem,
            '{dialogue}',
            (elem->'dialogue') - 'timedLines'
          )
        ELSE elem
      END
      ORDER BY ord
    )
    FROM jsonb_array_elements(script->'scenes') WITH ORDINALITY AS t(elem, ord)
  )
)
WHERE id = 'developer-full-v1';
