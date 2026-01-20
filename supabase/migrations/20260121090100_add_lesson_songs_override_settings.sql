-- lesson_songsテーブルに転調設定の上書きカラムを追加
-- ミッションやレッスンでtimingモードのステージを選択した場合に
-- 元のステージ設定を上書きして使用できるようにする

-- 上書き用のリピート転調設定（NULLの場合は元の設定を使用）
ALTER TABLE public.lesson_songs 
ADD COLUMN IF NOT EXISTS override_repeat_transposition_mode TEXT DEFAULT NULL 
CHECK (override_repeat_transposition_mode IS NULL OR 
       override_repeat_transposition_mode IN ('off', '+1', '+5', '-1', '-5', 'random'));

-- 上書き用の開始時キー設定（NULLの場合は元の設定を使用）
ALTER TABLE public.lesson_songs 
ADD COLUMN IF NOT EXISTS override_start_key INTEGER DEFAULT NULL 
CHECK (override_start_key IS NULL OR 
       (override_start_key >= -6 AND override_start_key <= 6));

-- カラムのコメント追加
COMMENT ON COLUMN public.lesson_songs.override_repeat_transposition_mode IS 
'リピート転調設定の上書き: NULLの場合は元のステージ設定を使用';

COMMENT ON COLUMN public.lesson_songs.override_start_key IS 
'開始時キーの上書き（-6〜+6）: NULLの場合は元のステージ設定を使用';
