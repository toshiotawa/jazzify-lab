-- II-V-I レッスンコース全ステージ: 正解時にルート音を鳴らさない
UPDATE public.fantasy_stages
SET play_root_on_correct = false
WHERE name LIKE 'II-V-I%';
