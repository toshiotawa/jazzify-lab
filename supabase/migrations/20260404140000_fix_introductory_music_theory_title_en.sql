-- Introductory Music Theory（音楽理論初級）: lessons.title_en に残っていた日本語括弧注釈を英語に置換
-- 本番は MCP で適用済みの場合、このマイグレーションは冪等（同じ置換の繰り返しで変化なし）

DO $migration$
DECLARE
  v_course uuid := 'e0c6ecbc-3cdc-57be-b929-496e8cd67e36';
BEGIN
  IF EXISTS (SELECT 1 FROM public.courses WHERE id = v_course) THEN
    UPDATE public.lessons
    SET title_en = REPLACE(REPLACE(REPLACE(REPLACE(title_en,
      '(黒鍵)', '(black keys)'),
      '(全ルート)', '(all roots)'),
      '(黒鍵混合)', '(black keys, mixed)'),
      '(12調すべて)', '(all 12 keys)')
    WHERE course_id = v_course
      AND title_en IS NOT NULL;
  END IF;
END
$migration$;
