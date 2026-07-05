-- メール許諾（登録時のみ取得、送信機能は別途）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marketing_email_opt_in boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marketing_email_opt_in_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marketing_email_opt_in_source text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marketing_email_opt_in_text text;
