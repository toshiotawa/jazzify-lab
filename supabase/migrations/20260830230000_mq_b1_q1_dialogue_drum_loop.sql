-- MQ 1-1 (osmd-timing-adjustment-v1): 会話シーン BGM をフル曲 count-in からドラムループへ
-- OSMD 本編は content.phrases[].audio_url（count-in）を使うため影響しない
UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(
    script,
    '{audioTracks,drum_loop,url}',
    '"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"'::jsonb
  ),
  updated_at = now()
WHERE id = 'osmd-timing-adjustment-v1';
