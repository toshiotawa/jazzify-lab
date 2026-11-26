import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',

  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',

  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

type BillingCapabilities = {
  can_change_plan: boolean;

  can_resume: boolean;

  can_manage_payment: boolean;

  can_cancel_pending_plan_change: boolean;
};

type CoachingBillingStatus = {
  provider: string;

  status: string;

  entitlement_state: string;

  current_period_ends_at: string | null;

  pending_cancel_effective_at: string | null;

  next_billing_amount_jpy: number | null;

  billing_currency: 'JPY' | 'USD';
} | null;

function isPendingCancelScheduled(status: string | null | undefined): boolean {
  return status === 'scheduled' || status === 'failed';
}

function deriveBillingCapabilities(
  provider: string,

  entitlementState: string,

  status: string,

  pendingPlanCode: string | null = null,

  pendingCancelScheduled: boolean = false,
): BillingCapabilities {
  if (provider !== 'lemon' && provider !== 'stripe') {
    return {
      can_change_plan: false,

      can_resume: false,

      can_manage_payment: false,

      can_cancel_pending_plan_change: false,
    };
  }

  const isActiveEntitlement = entitlementState === 'active';

  const isCancelledGrace = entitlementState === 'cancelled_but_active_until_end';

  const isPastDue = entitlementState === 'payment_issue_with_access' || status === 'past_due';

  const hasPendingPlanChange = pendingPlanCode !== null;

  return {
    can_change_plan: isActiveEntitlement && !hasPendingPlanChange && !pendingCancelScheduled,

    can_resume: pendingCancelScheduled || isCancelledGrace,

    can_manage_payment: isActiveEntitlement || isCancelledGrace || isPastDue,

    can_cancel_pending_plan_change:
      isActiveEntitlement && hasPendingPlanChange && !pendingCancelScheduled,
  };
}

function billingAmountUsdForPlanCode(planCode: string): number | null {
  if (planCode === 'core_monthly') return 24.99;

  if (planCode === 'core_yearly') return 199;

  return null;
}

function billingAmountJpyForPlanCode(planCode: string): number | null {
  if (planCode === 'core_monthly') return 3980;

  if (planCode === 'core_yearly') return 34800;

  return null;
}

function nextBillingAmountJpy(planCode: string, pendingPlanCode: string | null): number | null {
  const effectivePlanCode = pendingPlanCode ?? planCode;

  return billingAmountJpyForPlanCode(effectivePlanCode);
}

function nextBillingAmountUsd(planCode: string, pendingPlanCode: string | null): number | null {
  const effectivePlanCode = pendingPlanCode ?? planCode;

  return billingAmountUsdForPlanCode(effectivePlanCode);
}

function isPaidPremiumForCoaching(
  status: string,
  entitlementState: string,
  pendingCancelScheduled: boolean,
): boolean {
  return status === 'active' && entitlementState === 'active' && !pendingCancelScheduled;
}

function buildCoachingBillingStatus(row: Record<string, unknown> | null): CoachingBillingStatus {
  if (!row) return null;

  const entitlementState =
    typeof row.entitlement_state === 'string' ? row.entitlement_state : 'expired';

  const hideNextBilling =
    entitlementState === 'expired' ||
    row.pending_cancel_effective_at != null ||
    entitlementState === 'cancelled_but_active_until_end';

  const currency = row.billing_currency === 'USD' ? 'USD' : 'JPY';

  return {
    provider: typeof row.provider === 'string' ? row.provider : 'none',

    status: typeof row.status === 'string' ? row.status : 'expired',

    entitlement_state: entitlementState,

    current_period_ends_at:
      entitlementState === 'expired'
        ? null
        : typeof row.current_period_ends_at === 'string'
          ? row.current_period_ends_at
          : null,

    pending_cancel_effective_at:
      typeof row.pending_cancel_effective_at === 'string' ? row.pending_cancel_effective_at : null,

    next_billing_amount_jpy: hideNextBilling || currency !== 'JPY' ? null : 9800,

    billing_currency: currency,
  };
}

async function hasLemonBillingHistory(
  supabase: ReturnType<typeof createClient>,

  userId: string,
): Promise<boolean> {
  const { data: invoiceRow } = await supabase

    .from('billing_invoices')

    .select('id')

    .eq('user_id', userId)

    .eq('provider', 'lemon')

    .limit(1)

    .maybeSingle();

  if (invoiceRow) {
    return true;
  }

  const { data: profile } = await supabase

    .from('profiles')

    .select('lemon_customer_id')

    .eq('id', userId)

    .maybeSingle();

  return profile?.lemon_customer_id != null && profile.lemon_customer_id !== '';
}

function buildBillingResponse(
  provider: string,

  status: string,

  entitlementState: string,

  planCode: string,

  trialUsed: boolean,

  trialUsedAt: string | null,

  currentPeriodEndsAt: string | null,

  pendingPlanCode: string | null = null,

  pendingPlanEffectiveAt: string | null = null,

  pendingCancelEffectiveAt: string | null = null,

  pendingCancelScheduled: boolean = false,

  hasLemonBillingHistoryFlag: boolean = false,

  billingCurrency: 'JPY' | 'USD' = 'JPY',

  coachingSubscription: CoachingBillingStatus = null,
) {
  const caps = deriveBillingCapabilities(
    provider,

    entitlementState,

    status,

    pendingPlanCode,

    pendingCancelScheduled,
  );

  const hideNextBilling =
    entitlementState === 'expired' ||
    pendingCancelScheduled ||
    entitlementState === 'cancelled_but_active_until_end';

  return {
    provider,

    status,

    entitlement_state: entitlementState,

    plan_code: planCode,

    trial_used: trialUsed,

    trial_used_at: trialUsedAt,

    current_period_ends_at: entitlementState === 'expired' ? null : currentPeriodEndsAt,

    pending_plan_code: pendingPlanCode,

    pending_plan_effective_at: pendingPlanEffectiveAt,

    pending_cancel_effective_at: pendingCancelEffectiveAt,

    next_billing_amount_jpy:
      hideNextBilling || billingCurrency === 'USD'
        ? null
        : nextBillingAmountJpy(planCode, pendingPlanCode),

    next_billing_amount_usd:
      hideNextBilling || billingCurrency === 'JPY'
        ? null
        : nextBillingAmountUsd(planCode, pendingPlanCode),

    billing_currency: billingCurrency,

    can_change_plan: caps.can_change_plan,

    can_resume: caps.can_resume,

    can_manage_payment: caps.can_manage_payment,

    can_cancel_pending_plan_change: caps.can_cancel_pending_plan_change,

    has_lemon_billing_history: hasLemonBillingHistoryFlag,

    coaching_subscription: coachingSubscription,

    can_start_coaching:
      billingCurrency === 'JPY' &&
      coachingSubscription === null &&
      isPaidPremiumForCoaching(status, entitlementState, pendingCancelScheduled),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,

        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',

      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const token = authHeader.replace('Bearer ', '');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,

        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: subscription, error: subError } = await supabase

      .from('subscriptions')

      .select('*')

      .eq('user_id', user.id)

      .maybeSingle();

    if (subError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch subscription' }), {
        status: 500,

        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lemonBillingHistory = await hasLemonBillingHistory(supabase, user.id);

    const { data: coachingRow } = await supabase

      .from('coaching_subscriptions')

      .select(
        'provider, status, entitlement_state, current_period_ends_at, pending_cancel_effective_at, billing_currency',
      )

      .eq('user_id', user.id)

      .in('entitlement_state', [
        'active',

        'payment_issue_with_access',

        'payment_issue_no_access',

        'cancelled_but_active_until_end',
      ])

      .order('created_at', { ascending: false })

      .limit(1)

      .maybeSingle();

    const coachingSubscription = buildCoachingBillingStatus(coachingRow ?? null);

    const { data: profileRow } = await supabase

      .from('profiles')

      .select('billing_currency, preferred_locale')

      .eq('id', user.id)

      .maybeSingle();

    const billingCurrency: 'JPY' | 'USD' =
      profileRow?.billing_currency === 'USD'
        ? 'USD'
        : profileRow?.billing_currency === 'JPY'
          ? 'JPY'
          : profileRow?.preferred_locale === 'en'
            ? 'USD'
            : 'JPY';

    if (!subscription) {
      const { data: profile } = await supabase

        .from('profiles')

        .select('rank, lemon_subscription_status, lemon_trial_used, lemon_trial_used_at')

        .eq('id', user.id)

        .single();

      const st = profile?.lemon_subscription_status;

      if (st === 'past_due') {
        return new Response(
          JSON.stringify(
            buildBillingResponse(
              'lemon',

              'past_due',

              'payment_issue_with_access',

              'unknown',

              profile?.lemon_trial_used ?? false,

              profile?.lemon_trial_used_at ?? null,

              null,

              null,

              null,

              null,

              false,

              lemonBillingHistory,

              billingCurrency,

              coachingSubscription,
            ),
          ),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      const isLemonActive = st === 'active' || st === 'on_trial';

      return new Response(
        JSON.stringify(
          buildBillingResponse(
            isLemonActive ? 'lemon' : 'none',

            isLemonActive ? (st === 'on_trial' ? 'trial' : 'active') : 'expired',

            isLemonActive ? 'active' : 'expired',

            'unknown',

            profile?.lemon_trial_used ?? false,

            profile?.lemon_trial_used_at ?? null,

            null,

            null,

            null,

            null,

            false,

            lemonBillingHistory,

            billingCurrency,

            coachingSubscription,
          ),
        ),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const pendingCancelScheduled = isPendingCancelScheduled(
      subscription.pending_cancel_status ?? null,
    );

    const subscriptionBillingCurrency: 'JPY' | 'USD' =
      subscription.billing_currency === 'USD'
        ? 'USD'
        : subscription.billing_currency === 'JPY'
          ? 'JPY'
          : billingCurrency;

    return new Response(
      JSON.stringify(
        buildBillingResponse(
          subscription.provider,

          subscription.status,

          subscription.entitlement_state,

          subscription.plan_code,

          subscription.trial_used,

          subscription.trial_used_at ?? null,

          subscription.current_period_ends_at,

          subscription.pending_plan_code ?? null,

          subscription.pending_plan_effective_at ?? null,

          pendingCancelScheduled ? (subscription.pending_cancel_effective_at ?? null) : null,

          pendingCancelScheduled,

          lemonBillingHistory,

          subscriptionBillingCurrency,

          coachingSubscription,
        ),
      ),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,

      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
