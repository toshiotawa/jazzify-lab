-- record_user_milestone の (uuid, text) 2引数版を DROP し PostgREST オーバーロード衝突を解消。
-- 3引数版 (uuid, text, text DEFAULT NULL) のみ残す。

DROP FUNCTION IF EXISTS public.record_user_milestone(uuid, text);

-- trial_start_at: subscriptions.trial_used = true かつ trial_used_at がある行を backfill
INSERT INTO public.user_milestones (user_id, trial_start_at)
SELECT s.user_id, s.trial_used_at
FROM public.subscriptions s
LEFT JOIN public.user_milestones um ON um.user_id = s.user_id
WHERE s.trial_used = true
  AND s.trial_used_at IS NOT NULL
  AND um.user_id IS NULL;

UPDATE public.user_milestones um
SET trial_start_at = s.trial_used_at,
    updated_at = now()
FROM public.subscriptions s
WHERE s.user_id = um.user_id
  AND s.trial_used = true
  AND s.trial_used_at IS NOT NULL
  AND um.trial_start_at IS NULL;

-- paid_at: billing_invoices の最初の支払い日時を backfill
INSERT INTO public.user_milestones (user_id, paid_at)
SELECT bi.user_id, MIN(COALESCE(bi.paid_at, bi.provider_created_at))
FROM public.billing_invoices bi
LEFT JOIN public.user_milestones um ON um.user_id = bi.user_id
WHERE um.user_id IS NULL
GROUP BY bi.user_id;

UPDATE public.user_milestones um
SET paid_at = sub.first_paid_at,
    updated_at = now()
FROM (
  SELECT
    user_id,
    MIN(COALESCE(paid_at, provider_created_at)) AS first_paid_at
  FROM public.billing_invoices
  GROUP BY user_id
) sub
WHERE sub.user_id = um.user_id
  AND um.paid_at IS NULL;
