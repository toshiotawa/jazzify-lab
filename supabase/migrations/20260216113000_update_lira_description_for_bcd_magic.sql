-- リラの説明文を最新仕様（B/C/D魔法、初期RELOAD+5）に更新

BEGIN;

UPDATE public.survival_characters
SET
  description = '魔法特化。初期リロード5秒短縮。B/C/D列で魔法を発動。サンダー・ヒール所持。Lv10毎に魔法ATK+1',
  description_en = 'Magic specialist. Initial reload -5s. Casts magic on B/C/D slots. Starts with Thunder and Heal. Magic ATK +1 every 10 levels',
  updated_at = now()
WHERE name = 'リラ' OR name_en = 'Lira';

COMMIT;
