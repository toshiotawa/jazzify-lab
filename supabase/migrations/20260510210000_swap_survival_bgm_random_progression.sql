-- ランダム / プログレッション の本編BGM URL を入れ替え（コード側デフォルトと整合）

UPDATE public.survival_bgm_settings
SET
  bgm_url = CASE stage_type
    WHEN 'random' THEN 'https://jazzify-cdn.com/fantasy-bgm/116797c5-c714-4a4d-85c6-5212af860d0b.mp3'
    WHEN 'progression' THEN 'https://jazzify-cdn.com/fantasy-bgm/c0371aef-0afb-482c-91b6-c2cbf73b588e.mp3'
  END,
  updated_at = now()
WHERE stage_type IN ('random', 'progression');
