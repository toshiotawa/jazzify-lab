-- ステップメルマガの送信ログ（冪等性担保。service role のみが読み書きする）
CREATE TABLE IF NOT EXISTS marketing_email_sends (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_key text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, email_key)
);

ALTER TABLE marketing_email_sends ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE marketing_email_sends IS 'ステップメルマガ送信ログ。email_key: day0/day1/day2/day3/trial_start';
