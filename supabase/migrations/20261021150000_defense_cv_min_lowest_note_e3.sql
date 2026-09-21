-- II-V-I Drop2 の最低音は C7/FM7 の E3。
-- voicing_min_lowest_note=F3 だと進行全体が 1 オクターブ上がり、トレーニングと音域がずれる。
UPDATE public.defense_stages
SET voicing_min_lowest_note = 'E3'
WHERE slug LIKE 'defense-dev-cv-%'
  AND voicing_min_lowest_note = 'F3';
