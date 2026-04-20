-- サバイバルBGMを全難易度で統一URLに変更
-- 奇数WAVE・偶数WAVEともに同じBGMを使用する

UPDATE survival_difficulty_settings
SET
  bgm_odd_wave_url = 'https://jazzify-cdn.com/fantasy-bgm/c0371aef-0afb-482c-91b6-c2cbf73b588e.mp3',
  bgm_even_wave_url = 'https://jazzify-cdn.com/fantasy-bgm/c0371aef-0afb-482c-91b6-c2cbf73b588e.mp3',
  updated_at = now();
