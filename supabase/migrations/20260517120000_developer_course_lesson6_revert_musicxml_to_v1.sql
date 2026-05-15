-- 開発者コース・レッスン6 (`developer-course-l6-osmd-mismatch-ph1`) の MusicXML を、
-- CDN(R2) に欠落している v2 (`phrase-02-v2.musicxml`) から CDN 配信中の v1 (`phrase-02.musicxml`) へ戻す。
--
-- 経緯: 20260516190000_chord_osmd_musicxml_v2_cdn_urls.sql で開発テスト用フレーズの URL を v2 に切り替えたが、
-- `upload-dev-chord-osmd-120-assets-to-r2.mjs` での v2 アップロードが未実行のため、現状 v2 は HTTP 404。
-- 開発者コース・レッスン4/5 は別マイグレーションで既に v1 に再設定済みだが、L6 だけ v2 のままだった。
-- iOS/Web ともに該当フレーズで「MusicXML を読み込めませんでした / レンダーできません」が発生する。
-- v2 を CDN にアップする運用が回るまで暫定で v1 に戻す。

BEGIN;

UPDATE public.ear_training_phrases
SET music_xml_url = 'https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-phrase-02.musicxml',
    updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-l6-osmd-mismatch-ph1');

COMMIT;
