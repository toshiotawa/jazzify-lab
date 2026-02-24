-- 再バランス微調整: 敵スポーン数を引き上げて爽快感を復元
-- veryeasy: 4→7, easy: 4→6, normal: 4→6, hard: 5→7, extreme: 6→8

UPDATE survival_difficulty_settings SET enemy_spawn_count = 7 WHERE difficulty = 'veryeasy';
UPDATE survival_difficulty_settings SET enemy_spawn_count = 6 WHERE difficulty = 'easy';
UPDATE survival_difficulty_settings SET enemy_spawn_count = 6 WHERE difficulty = 'normal';
UPDATE survival_difficulty_settings SET enemy_spawn_count = 7 WHERE difficulty = 'hard';
UPDATE survival_difficulty_settings SET enemy_spawn_count = 8 WHERE difficulty = 'extreme';
