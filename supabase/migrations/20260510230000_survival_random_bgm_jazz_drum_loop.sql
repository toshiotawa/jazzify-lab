-- random 本編BGM を R2 の Jazz Drum Loop Funk 8-bit drum-only へ差し替え

UPDATE public.survival_bgm_settings
SET
  bgm_url = 'https://jazzify-cdn.com/fantasy-bgm/727a4d3b-21b9-4889-933b-ba170c6037bc.mp3',
  updated_at = now()
WHERE stage_type = 'random';
