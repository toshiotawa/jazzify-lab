-- toshiotawa@me.com / saitama1990@gmail.com を Free に戻す（IAP・Lemon なし）
-- 検証・重複解消用: 同一 Apple originalTransactionId が複数ユーザーに紐づいていたため両方リセット

DELETE FROM public.subscription_events
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('toshiotawa@me.com', 'saitama1990@gmail.com')
);

DELETE FROM public.subscriptions
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('toshiotawa@me.com', 'saitama1990@gmail.com')
);

UPDATE public.profiles
SET
  rank = 'free'::public.membership_rank,
  lemon_customer_id = NULL,
  lemon_subscription_id = NULL,
  lemon_subscription_status = NULL,
  lemon_trial_used = false,
  will_cancel = false,
  cancel_date = NULL,
  downgrade_to = NULL,
  downgrade_date = NULL
WHERE id IN (
  SELECT id FROM auth.users WHERE email IN ('toshiotawa@me.com', 'saitama1990@gmail.com')
);
