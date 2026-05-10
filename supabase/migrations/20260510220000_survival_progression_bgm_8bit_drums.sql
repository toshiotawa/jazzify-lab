-- progression 本編BGM を R2 上の 8-bit drums トラックへ差し替え
-- 公開ファイル: public/Game Music, Drum Only ,jazz Hiphop,8-bit (Drums).mp3 → fantasy-bgm/74099219-644e-46c1-b509-bedf9adadf10.mp3

UPDATE public.survival_bgm_settings
SET
  bgm_url = 'https://jazzify-cdn.com/fantasy-bgm/74099219-644e-46c1-b509-bedf9adadf10.mp3',
  updated_at = now()
WHERE stage_type = 'progression';
