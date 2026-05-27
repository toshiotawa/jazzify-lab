-- 本番モード: 譜面未正解ヒント(A) / 鍵盤HINTハイライト(B) をステージ・課題で個別設定
BEGIN;

ALTER TABLE public.survival_stages
  ADD COLUMN IF NOT EXISTS production_staff_hint_mode text NOT NULL DEFAULT 'fade_15s'
    CHECK (production_staff_hint_mode IN ('fade_15s', 'always', 'hidden_until_pressed')),
  ADD COLUMN IF NOT EXISTS production_keyboard_hint_mode text NOT NULL DEFAULT 'fade_15s'
    CHECK (production_keyboard_hint_mode IN ('fade_15s', 'always', 'hidden_until_pressed'));

COMMENT ON COLUMN public.survival_stages.production_staff_hint_mode IS
  '本番: 譜面の未正解音符ヒント。fade_15s=15秒で消える / always=常時 / hidden_until_pressed=正解音のみ表示';
COMMENT ON COLUMN public.survival_stages.production_keyboard_hint_mode IS
  '本番: 鍵盤 pending HINT ハイライト。fade_15s / always / hidden_until_pressed';

ALTER TABLE public.balloon_rush_stages
  ADD COLUMN IF NOT EXISTS production_staff_hint_mode text NOT NULL DEFAULT 'fade_15s'
    CHECK (production_staff_hint_mode IN ('fade_15s', 'always', 'hidden_until_pressed')),
  ADD COLUMN IF NOT EXISTS production_keyboard_hint_mode text NOT NULL DEFAULT 'fade_15s'
    CHECK (production_keyboard_hint_mode IN ('fade_15s', 'always', 'hidden_until_pressed'));

COMMENT ON COLUMN public.balloon_rush_stages.production_staff_hint_mode IS
  '本番: 譜面の未正解音符ヒント。fade_15s / always / hidden_until_pressed';
COMMENT ON COLUMN public.balloon_rush_stages.production_keyboard_hint_mode IS
  '本番: 鍵盤 pending HINT ハイライト。fade_15s / always / hidden_until_pressed';

ALTER TABLE public.lesson_songs
  ADD COLUMN IF NOT EXISTS override_production_staff_hint_mode text DEFAULT NULL
    CHECK (override_production_staff_hint_mode IS NULL
      OR override_production_staff_hint_mode IN ('fade_15s', 'always', 'hidden_until_pressed')),
  ADD COLUMN IF NOT EXISTS override_production_keyboard_hint_mode text DEFAULT NULL
    CHECK (override_production_keyboard_hint_mode IS NULL
      OR override_production_keyboard_hint_mode IN ('fade_15s', 'always', 'hidden_until_pressed'));

COMMENT ON COLUMN public.lesson_songs.override_production_staff_hint_mode IS
  '本番譜面ヒント上書き。NULL=ステージ既定';
COMMENT ON COLUMN public.lesson_songs.override_production_keyboard_hint_mode IS
  '本番鍵盤ヒント上書き。NULL=ステージ既定';

COMMIT;
