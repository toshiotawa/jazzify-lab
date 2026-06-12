import { noTrialVariantForPlanCode } from './lib/lemonPlanCatalog';
import {
  assertSubscriptionActionAllowed,
  targetPlanCodeForChange,
} from './lib/lemonSubscriptionGuard';
import {
  authenticateRequest,
  billingCorsHeaders,
  fetchLemonSubscription,
  getUserLemonSubscription,
  patchLemonSubscriptionVariant,
} from './lib/lemonNetlifyCommon';

interface NetlifyEvent {
  httpMethod: string;
  headers: Record<string, string | undefined>;
  body: string | null;
}

const parseTarget = (body: string | null): 'monthly' | 'yearly' | null => {
  if (!body) return null;
  try {
    const parsed = JSON.parse(body) as { target?: unknown };
    if (parsed.target === 'monthly' || parsed.target === 'yearly') {
      return parsed.target;
    }
    return null;
  } catch {
    return null;
  }
};

const resolveEffectiveAt = (
  renewsAt: string | null,
  endsAt: string | null,
  fallback: string | null,
): string | null => renewsAt ?? endsAt ?? fallback;

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
    const target = parseTarget(event.body);
    if (!target) {
      return {
        statusCode: 400,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Invalid target. Use monthly or yearly.' }),
      };
    }

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

    const nextPlanCode = targetPlanCodeForChange(subscriptionRow.plan_code, target);
    if (nextPlanCode === subscriptionRow.plan_code) {
      return {
        statusCode: 409,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Already on the requested plan' }),
      };
    }
    if (subscriptionRow.pending_plan_code === nextPlanCode) {
      return {
        statusCode: 409,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Plan change already scheduled', scheduled: true }),
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
      'change_plan',
    );
    if (!guard.allowed) {
      return {
        statusCode: 403,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: guard.reason ?? 'Plan change not allowed' }),
      };
    }

    const variantId = noTrialVariantForPlanCode(nextPlanCode);
    const patchResult = await patchLemonSubscriptionVariant(
      subscriptionRow.provider_subscription_id,
      variantId,
    );

    if (!patchResult.ok) {
      return {
        statusCode: 502,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Failed to change plan on Lemon Squeezy', details: patchResult.details }),
      };
    }

    const pendingEffectiveAt = resolveEffectiveAt(
      patchResult.renewsAt,
      patchResult.endsAt,
      subscriptionRow.current_period_ends_at,
    );

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        pending_plan_code: nextPlanCode,
        pending_plan_effective_at: pendingEffectiveAt,
      })
      .eq('user_id', userId);

    if (updateError) {
      return {
        statusCode: 500,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Failed to record scheduled plan change' }),
      };
    }

    return {
      statusCode: 200,
      headers: billingCorsHeaders,
      body: JSON.stringify({ ok: true, scheduled: true }),
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
