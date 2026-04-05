-- lesson_songs.title_en for Bach Two-Part Inventions (from songs.title patterns)
-- Idempotent: only updates rows where title_en IS NULL

-- AB / BC / 通し first (unambiguous suffixes)
UPDATE lesson_songs ls SET title_en = regexp_replace(regexp_replace(s.title, 'Invention No\.([0-9]+)', 'Invention No. \1', 'g'), ' - AB 右手$', ' — Sections A–B (right hand)') FROM songs s WHERE ls.song_id = s.id AND ls.title_en IS NULL AND s.title LIKE '% - AB 右手';
UPDATE lesson_songs ls SET title_en = regexp_replace(regexp_replace(s.title, 'Invention No\.([0-9]+)', 'Invention No. \1', 'g'), ' - AB 左手$', ' — Sections A–B (left hand)') FROM songs s WHERE ls.song_id = s.id AND ls.title_en IS NULL AND s.title LIKE '% - AB 左手';
UPDATE lesson_songs ls SET title_en = regexp_replace(regexp_replace(s.title, 'Invention No\.([0-9]+)', 'Invention No. \1', 'g'), ' - AB 両手$', ' — Sections A–B (both hands)') FROM songs s WHERE ls.song_id = s.id AND ls.title_en IS NULL AND s.title LIKE '% - AB 両手';

UPDATE lesson_songs ls SET title_en = regexp_replace(regexp_replace(s.title, 'Invention No\.([0-9]+)', 'Invention No. \1', 'g'), ' - BC 右手$', ' — Sections B–C (right hand)') FROM songs s WHERE ls.song_id = s.id AND ls.title_en IS NULL AND s.title LIKE '% - BC 右手';
UPDATE lesson_songs ls SET title_en = regexp_replace(regexp_replace(s.title, 'Invention No\.([0-9]+)', 'Invention No. \1', 'g'), ' - BC 左手$', ' — Sections B–C (left hand)') FROM songs s WHERE ls.song_id = s.id AND ls.title_en IS NULL AND s.title LIKE '% - BC 左手';
UPDATE lesson_songs ls SET title_en = regexp_replace(regexp_replace(s.title, 'Invention No\.([0-9]+)', 'Invention No. \1', 'g'), ' - BC 両手$', ' — Sections B–C (both hands)') FROM songs s WHERE ls.song_id = s.id AND ls.title_en IS NULL AND s.title LIKE '% - BC 両手';

UPDATE lesson_songs ls SET title_en = regexp_replace(regexp_replace(s.title, 'Invention No\.([0-9]+)', 'Invention No. \1', 'g'), ' - 通し 右手$', ' — Full piece (right hand)') FROM songs s WHERE ls.song_id = s.id AND ls.title_en IS NULL AND s.title LIKE '% - 通し 右手';
UPDATE lesson_songs ls SET title_en = regexp_replace(regexp_replace(s.title, 'Invention No\.([0-9]+)', 'Invention No. \1', 'g'), ' - 通し 左手$', ' — Full piece (left hand)') FROM songs s WHERE ls.song_id = s.id AND ls.title_en IS NULL AND s.title LIKE '% - 通し 左手';
UPDATE lesson_songs ls SET title_en = regexp_replace(regexp_replace(s.title, 'Invention No\.([0-9]+)', 'Invention No. \1', 'g'), ' - 通し 両手$', ' — Full piece (both hands)') FROM songs s WHERE ls.song_id = s.id AND ls.title_en IS NULL AND s.title LIKE '% - 通し 両手';

-- A / B / C (single-letter sections)
UPDATE lesson_songs ls SET title_en = regexp_replace(regexp_replace(s.title, 'Invention No\.([0-9]+)', 'Invention No. \1', 'g'), ' - A 右手$', ' — Section A (right hand)') FROM songs s WHERE ls.song_id = s.id AND ls.title_en IS NULL AND s.title LIKE '% - A 右手';
UPDATE lesson_songs ls SET title_en = regexp_replace(regexp_replace(s.title, 'Invention No\.([0-9]+)', 'Invention No. \1', 'g'), ' - A 左手$', ' — Section A (left hand)') FROM songs s WHERE ls.song_id = s.id AND ls.title_en IS NULL AND s.title LIKE '% - A 左手';
UPDATE lesson_songs ls SET title_en = regexp_replace(regexp_replace(s.title, 'Invention No\.([0-9]+)', 'Invention No. \1', 'g'), ' - A 両手$', ' — Section A (both hands)') FROM songs s WHERE ls.song_id = s.id AND ls.title_en IS NULL AND s.title LIKE '% - A 両手' AND s.title NOT LIKE '% - AB %';

UPDATE lesson_songs ls SET title_en = regexp_replace(regexp_replace(s.title, 'Invention No\.([0-9]+)', 'Invention No. \1', 'g'), ' - B 右手$', ' — Section B (right hand)') FROM songs s WHERE ls.song_id = s.id AND ls.title_en IS NULL AND s.title LIKE '% - B 右手' AND s.title NOT LIKE '% - AB %' AND s.title NOT LIKE '% - BC %';
UPDATE lesson_songs ls SET title_en = regexp_replace(regexp_replace(s.title, 'Invention No\.([0-9]+)', 'Invention No. \1', 'g'), ' - B 左手$', ' — Section B (left hand)') FROM songs s WHERE ls.song_id = s.id AND ls.title_en IS NULL AND s.title LIKE '% - B 左手' AND s.title NOT LIKE '% - AB %' AND s.title NOT LIKE '% - BC %';
UPDATE lesson_songs ls SET title_en = regexp_replace(regexp_replace(s.title, 'Invention No\.([0-9]+)', 'Invention No. \1', 'g'), ' - B 両手$', ' — Section B (both hands)') FROM songs s WHERE ls.song_id = s.id AND ls.title_en IS NULL AND s.title LIKE '% - B 両手' AND s.title NOT LIKE '% - AB %' AND s.title NOT LIKE '% - BC %';

UPDATE lesson_songs ls SET title_en = regexp_replace(regexp_replace(s.title, 'Invention No\.([0-9]+)', 'Invention No. \1', 'g'), ' - C 右手$', ' — Section C (right hand)') FROM songs s WHERE ls.song_id = s.id AND ls.title_en IS NULL AND s.title LIKE '% - C 右手';
UPDATE lesson_songs ls SET title_en = regexp_replace(regexp_replace(s.title, 'Invention No\.([0-9]+)', 'Invention No. \1', 'g'), ' - C 左手$', ' — Section C (left hand)') FROM songs s WHERE ls.song_id = s.id AND ls.title_en IS NULL AND s.title LIKE '% - C 左手';
UPDATE lesson_songs ls SET title_en = regexp_replace(regexp_replace(s.title, 'Invention No\.([0-9]+)', 'Invention No. \1', 'g'), ' - C 両手$', ' — Section C (both hands)') FROM songs s WHERE ls.song_id = s.id AND ls.title_en IS NULL AND s.title LIKE '% - C 両手';
