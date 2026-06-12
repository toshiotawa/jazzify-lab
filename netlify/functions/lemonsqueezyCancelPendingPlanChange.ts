import { noTrialVariantForPlanCode } from './lib/lemonPlanCatalog';
import { assertSubscriptionActionAllowed } from './lib/lemonSubscriptionGuard';
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
}

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

    if (!subscriptionRow.pending_plan_code) {
      return {
        statusCode: 409,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'No pending plan change to cancel' }),
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
        body: JSON.stringify({ error: guard.reason ?? 'Plan change cancellation not allowed' }),
      };
    }

    const variantId = noTrialVariantForPlanCode(subscriptionRow.plan_code);
    const patchResult = await patchLemonSubscriptionVariant(
      subscriptionRow.provider_subscription_id,
      variantId,
    );

    if (!patchResult.ok) {
      return {
        statusCode: 502,
        headers: billingCorsHeaders,
        body: JSON.stringify({
          error: 'Failed to cancel pending plan change on Lemon Squeezy',
          details: patchResult.details,
        }),
      };
    }

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        pending_plan_code: null,
        pending_plan_effective_at: null,
      })
      .eq('user_id', userId);

    if (updateError) {
      return {
        statusCode: 500,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Failed to clear pending plan change' }),
      };
    }

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
