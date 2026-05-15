-- chord_osmd 開発テスト: MusicXML を CDN キャッシュバスター用の -v2 ファイル名へ切り替え。
-- 依存: 20260516180000_developer_course_chord_osmd_test_lesson.sql
-- リポジトリ: public/fantasy-bgm/ear-training-dev-chord-osmd-120-phrase-0[12]-v2.musicxml
-- R2: scripts/upload-dev-chord-osmd-120-assets-to-r2.mjs で v2 をアップロード後に適用。

BEGIN;

UPDATE public.ear_training_phrases
SET music_xml_url = 'https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-phrase-01-v2.musicxml',
    updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1');

UPDATE public.ear_training_phrases
SET music_xml_url = 'https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-phrase-02-v2.musicxml',
    updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2');

COMMIT;
