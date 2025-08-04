-- カウントインを0に統一
UPDATE stages 
SET count_in_measures = 0
WHERE count_in_measures IS NOT NULL AND count_in_measures > 0;

-- count_in_measuresカラムのデフォルト値を0に変更
ALTER TABLE stages
ALTER COLUMN count_in_measures SET DEFAULT 0;