-- Fix billing_invoices amounts stored in Lemon minor units (cents) before normalization at ingest.
UPDATE public.billing_invoices
SET
  total = CASE WHEN total IS NOT NULL THEN round(total / 100.0)::integer ELSE NULL END,
  subtotal = CASE WHEN subtotal IS NOT NULL THEN round(subtotal / 100.0)::integer ELSE NULL END,
  tax = CASE WHEN tax IS NOT NULL THEN round(tax / 100.0)::integer ELSE NULL END,
  refunded_amount = CASE WHEN refunded_amount IS NOT NULL THEN round(refunded_amount / 100.0)::integer ELSE NULL END,
  updated_at = now()
WHERE provider = 'lemon'
  AND total IS NOT NULL
  AND total >= 100000;
