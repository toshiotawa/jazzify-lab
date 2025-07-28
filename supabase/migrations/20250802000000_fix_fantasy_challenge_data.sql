-- 既存の不正なファンタジーステージデータを修正
-- song_idにファンタジーステージのIDが入っているレコードを修正

-- まず、不正なデータを特定（song_idがsongsテーブルに存在しない）
WITH invalid_records AS (
  SELECT ct.challenge_id, ct.song_id
  FROM challenge_tracks ct
  LEFT JOIN songs s ON ct.song_id = s.id
  WHERE ct.song_id IS NOT NULL 
    AND s.id IS NULL
    AND ct.is_fantasy = false
)
-- 不正なレコードを削除（後で正しく再追加する必要がある）
DELETE FROM challenge_tracks
WHERE (challenge_id, song_id) IN (SELECT challenge_id, song_id FROM invalid_records);

-- lesson_songsテーブルでも同様の修正
WITH invalid_lesson_records AS (
  SELECT ls.lesson_id, ls.song_id
  FROM lesson_songs ls
  LEFT JOIN songs s ON ls.song_id = s.id
  WHERE ls.song_id IS NOT NULL 
    AND s.id IS NULL
    AND ls.is_fantasy = false
)
DELETE FROM lesson_songs
WHERE (lesson_id, song_id) IN (SELECT lesson_id, song_id FROM invalid_lesson_records);