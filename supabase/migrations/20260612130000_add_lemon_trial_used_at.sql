-- trial_used_at: webhook で on_trial 開始時に記録（調査用タイムスタンプ）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lemon_trial_used_at timestamptz;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_used_at timestamptz;
