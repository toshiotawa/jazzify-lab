import {
  assertSubscriptionActionAllowed,
  isPendingCancelScheduled,
} from './lib/lemonSubscriptionGuard';
import {
  buildLemonVariantIdLists,
  isTrialVariant,
  readLemonPlanCatalogFromProcessEnv,
} from './lib/lemonPlanCatalog';
import { rankForSubscription } from './lib/lemonSubscriptionMapping';
import { buildSubscriptionMirror } from './lib/lemonSubscriptionMirror';
import { planCodeForLemonVariant } from './lib/lemonVariantPlanCode';
import {
  authenticateRequest,
  billingCorsHeaders,
  ensureEnv,
  fetchLemonSubscription,
  getUserLemonSubscription,
  type LemonSubscriptionRetrieveResponse,
} from './lib/lemonNetlifyCommon';
import type { SupabaseClient } from '@supabase/supabase-js';

interface NetlifyEvent {
  httpMethod: string;
  headers: Record<string, string | undefined>;
}

const CLEAR_PENDING_CANCEL_FIELDS = {
  pending_cancel_effective_at: null,
  pending_cancel_effective_at_snapshot: null,
  pending_cancel_status: null,
  pending_cancel_locked_at: null,
  pending_cancel_failed_reason: null,
  pending_cancel_attempts: 0,
} as const;

const getVariantIdLists = () =>
  buildLemonVariantIdLists(readLemonPlanCatalogFromProcessEnv());

const mirrorResumedSubscription = async (
  supabase: SupabaseClient,
  userId: string,
  subscriptionId: string,
  patched: LemonSubscriptionRetrieveResponse,
): Promise<void> => {
  const attrs = patched.data.attributes;
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('plan_code, trial_used, provider_updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  const { yearlyVariantIds, monthlyVariantIds } = getVariantIdLists();
  const variantPlanCode = planCodeForLemonVariant(attrs.variant_id, yearlyVariantIds, monthlyVariantIds);
  const mirror = buildSubscriptionMirror(attrs, existing ? {
    plan_code: typeof existing.plan_code === 'string' ? existing.plan_code : null,
    trial_used: existing.trial_used === true,
    provider_updated_at:
      typeof existing.provider_updated_at === 'string' ? existing.provider_updated_at : null,
  } : null, {
    variantPlanCode,
    variantIsTrial: isTrialVariant(attrs.variant_id),
    nowMs: Date.now(),
  });

  if (mirror.kind !== 'apply') {
    return;
  }

  await supabase
    .from('subscriptions')
    .update({
      ...mirror.columns,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  const lemonStatus = String(attrs.status ?? '').toLowerCase();
  await supabase
    .from('profiles')
    .update({
      rank: rankForSubscription('lemon', mirror.columns.entitlement_state),
      lemon_subscription_id: subscriptionId,
      lemon_subscription_status:
        mirror.columns.entitlement_state === 'expired' ? 'expired' : (lemonStatus || null),
    })
    .eq('id', userId);
};

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: billingCorsHeaders };
  }
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: billingCorsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const authResult = await authenticateRequest(authHeader);
    if ('error' in authResult) {
      return {
        statusCode: authResult.statusCode,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: authResult.error }),
      };
    }

    const { supabase, userId } = authResult;
    const subscriptionRow = await getUserLemonSubscription(supabase, userId);
    if (!subscriptionRow?.provider_subscription_id) {
      return {
        statusCode: 404,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Lemon subscription not found' }),
      };
    }

    const pendingCancelScheduled = isPendingCancelScheduled(subscriptionRow.pending_cancel_status);

    if (pendingCancelScheduled) {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          ...CLEAR_PENDING_CANCEL_FIELDS,
          last_pending_cancel_cleared_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        return {
          statusCode: 500,
          headers: billingCorsHeaders,
          body: JSON.stringify({ error: 'Failed to clear scheduled cancellation' }),
        };
      }

      await supabase.from('subscription_events').insert({
        user_id: userId,
        provider: 'lemon',
        event_type: 'pending_cancel_cleared',
        provider_event_id: subscriptionRow.provider_subscription_id,
        payload: { reason: 'user_resume_before_apply' },
      });

      return {
        statusCode: 200,
        headers: billingCorsHeaders,
        body: JSON.stringify({ ok: true, cleared_scheduled_cancel: true }),
      };
    }

    const lemonSub = await fetchLemonSubscription(subscriptionRow.provider_subscription_id);
    if (!lemonSub) {
      return {
        statusCode: 502,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Failed to fetch subscription from Lemon Squeezy' }),
      };
    }

    const attrs = lemonSub.data.attributes;
    const guard = assertSubscriptionActionAllowed(
      {
        status: String(attrs.status ?? ''),
        cancelled: attrs.cancelled === true,
        ends_at: attrs.ends_at ?? null,
      },
      subscriptionRow.entitlement_state,
      'resume',
    );
    if (!guard.allowed) {
      return {
        statusCode: 403,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: guard.reason ?? 'Resume not allowed' }),
      };
    }

    const apiKey = ensureEnv('LEMONSQUEEZY_API_KEY');
    const subscriptionId = subscriptionRow.provider_subscription_id;

    const res = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'subscriptions',
          id: subscriptionId,
          attributes: {
            cancelled: false,
          },
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return {
        statusCode: 502,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Failed to resume subscription on Lemon Squeezy', details: errBody }),
      };
    }

    const patched = (await res.json()) as LemonSubscriptionRetrieveResponse;
    await mirrorResumedSubscription(supabase, userId, subscriptionId, patched);

    return {
      statusCode: 200,
      headers: billingCorsHeaders,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      statusCode: 500,
      headers: billingCorsHeaders,
      body: JSON.stringify({ error: 'Internal server error', details: message }),
    };
  }
};
