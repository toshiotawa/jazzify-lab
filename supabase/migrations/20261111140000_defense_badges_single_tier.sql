-- Phrase Defense no longer has a Basic tier. Hide Basic badges (no holders)
-- and drop "Advanced" from the remaining clear-count names.

UPDATE public.badges
SET is_active = false
WHERE id IN (
  'defense_basic_clears_50',
  'defense_basic_clears_500',
  'defense_basic_clears_1000',
  'defense_basic_clears_10000',
  'defense_basic_all_2'
);

UPDATE public.badges
SET
  name = CASE id
    WHEN 'defense_advanced_clears_50' THEN '累計50回クリア'
    WHEN 'defense_advanced_clears_500' THEN '累計500回クリア'
    WHEN 'defense_advanced_clears_1000' THEN '累計1000回クリア'
    WHEN 'defense_advanced_clears_10000' THEN '累計10000回クリア'
    ELSE name
  END,
  name_en = CASE id
    WHEN 'defense_advanced_clears_50' THEN '50 Clears'
    WHEN 'defense_advanced_clears_500' THEN '500 Clears'
    WHEN 'defense_advanced_clears_1000' THEN '1,000 Clears'
    WHEN 'defense_advanced_clears_10000' THEN '10,000 Clears'
    ELSE name_en
  END,
  condition_text = CASE id
    WHEN 'defense_advanced_clears_50' THEN 'フレーズディフェンスを累計50回クリア'
    WHEN 'defense_advanced_clears_500' THEN 'フレーズディフェンスを累計500回クリア'
    WHEN 'defense_advanced_clears_1000' THEN 'フレーズディフェンスを累計1000回クリア'
    WHEN 'defense_advanced_clears_10000' THEN 'フレーズディフェンスを累計10000回クリア'
    ELSE condition_text
  END,
  condition_text_en = CASE id
    WHEN 'defense_advanced_clears_50' THEN 'Clear Phrase Defense 50 times (cumulative)'
    WHEN 'defense_advanced_clears_500' THEN 'Clear Phrase Defense 500 times (cumulative)'
    WHEN 'defense_advanced_clears_1000' THEN 'Clear Phrase Defense 1,000 times (cumulative)'
    WHEN 'defense_advanced_clears_10000' THEN 'Clear Phrase Defense 10,000 times (cumulative)'
    ELSE condition_text_en
  END
WHERE id IN (
  'defense_advanced_clears_50',
  'defense_advanced_clears_500',
  'defense_advanced_clears_1000',
  'defense_advanced_clears_10000'
);
