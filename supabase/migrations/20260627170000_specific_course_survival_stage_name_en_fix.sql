-- 目的別コース（両手ヴォイシング）の lesson サバイバルステージ name_en に残っていた日本語を英訳
-- 長い語句から順に REPLACE（部分一致の誤置換を防ぐ）

UPDATE public.survival_stages
SET name_en = REPLACE(name_en, 'マイナーセブンスフラットファイブス', 'Half-diminished sevenths')
WHERE map_category = 'lesson' AND name_en LIKE '%マイナーセブンスフラットファイブス%';

UPDATE public.survival_stages
SET name_en = REPLACE(name_en, 'マイナーメジャーセブンス', 'Minor major sevenths')
WHERE map_category = 'lesson' AND name_en LIKE '%マイナーメジャーセブンス%';

UPDATE public.survival_stages
SET name_en = REPLACE(name_en, 'リディアンドミナントセブンス', 'Lydian dominant sevenths')
WHERE map_category = 'lesson' AND name_en LIKE '%リディアンドミナントセブンス%';

UPDATE public.survival_stages
SET name_en = REPLACE(name_en, 'マイナーセブンス', 'Minor sevenths')
WHERE map_category = 'lesson' AND name_en LIKE '%マイナーセブンス%';

UPDATE public.survival_stages
SET name_en = REPLACE(name_en, 'セブンスオルタード', 'Altered sevenths')
WHERE map_category = 'lesson' AND name_en LIKE '%セブンスオルタード%';

UPDATE public.survival_stages
SET name_en = REPLACE(name_en, 'メジャーセブンス', 'Major sevenths')
WHERE map_category = 'lesson' AND name_en LIKE '%メジャーセブンス%';

UPDATE public.survival_stages
SET name_en = REPLACE(name_en, 'マイナー II-Valt-I', 'Minor II-Valt-I')
WHERE map_category = 'lesson' AND name_en LIKE '%マイナー II-Valt-I%';

UPDATE public.survival_stages
SET name_en = REPLACE(name_en, 'マイナー II-V-I', 'Minor II-V-I')
WHERE map_category = 'lesson' AND name_en LIKE '%マイナー II-V-I%';

UPDATE public.survival_stages
SET name_en = REPLACE(name_en, 'メジャー II-V-I', 'Major II-V-I')
WHERE map_category = 'lesson' AND name_en LIKE '%メジャー II-V-I%';

UPDATE public.survival_stages
SET name_en = REPLACE(name_en, ': まとめ', ': All keys')
WHERE map_category = 'lesson' AND name_en LIKE '%: まとめ%';
