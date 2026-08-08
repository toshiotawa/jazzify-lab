-- free_cleared_nudge を廃止し paywall_nudge に置き換えたことによる二重送信の抑止。
-- 旧メールで既に「第2チャプターへ進もう」という趣旨を受け取った人には新メールを送らない。
-- 送信済みログを先回りで入れることで、marketingDripCron 側の冪等判定にそのまま乗せる。
-- sent_at は旧メールの送信時刻を引き継ぐ（実際には送っていないため、最小送信間隔の判定を歪めない）。

INSERT INTO public.marketing_email_sends (user_id, email_key, sent_at)
SELECT user_id, 'paywall_nudge', sent_at
FROM public.marketing_email_sends
WHERE email_key = 'free_cleared_nudge'
ON CONFLICT (user_id, email_key) DO NOTHING;
