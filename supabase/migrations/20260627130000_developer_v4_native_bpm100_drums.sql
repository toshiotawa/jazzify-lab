-- Survival Tutorial V4 developer-v4-native: 100BPM ドラム (Cblues) + demo シーン BPM 100
BEGIN;

UPDATE public.survival_tutorial_scripts
SET
  script = replace(
    replace(
      jsonb_set(script, '{scenes,1,bpm}', '100'::jsonb)::text,
      'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
      'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3'
    ),
    'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3',
    'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3'
  )::jsonb,
  updated_at = now()
WHERE id = 'developer-v4-native';

COMMIT;
