-- II-V-I BGM: 長期キャッシュ（R2 の Cache-Control）で古い MP3 が残る場合の回避。
-- URL にクエリを付与し、ブラウザ・BGMManager のバッファキー・CDN キャッシュを分離する。
-- 今後ファイルを差し替えたら ?v= の値を更新するか、再度パージする。
UPDATE public.fantasy_stages
SET
  bgm_url = regexp_replace(bgm_url, '\?[^#]*$', '') || '?v=ci20260326',
  mp3_url = regexp_replace(mp3_url, '\?[^#]*$', '') || '?v=ci20260326'
WHERE bgm_url LIKE '%/fantasy-bgm/ii-v-i-%';
