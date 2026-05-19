-- onboarding-v1: main_bgm を progression BGM から CDN ドラムループへ（Web/iOS チュートリアル準拠）

UPDATE public.survival_tutorial_scripts
SET script = jsonb_set(
  script,
  '{audioTracks,main_bgm}',
  jsonb_build_object(
    'url', 'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    'defaultLoop', true,
    'defaultVolume', 0.45
  )
)
WHERE id = 'onboarding-v1'
  AND script->'audioTracks'->'main_bgm'->>'resolveFrom' = 'progression';
