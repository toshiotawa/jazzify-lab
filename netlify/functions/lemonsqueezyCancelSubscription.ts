import { assertSubscriptionActionAllowed } from './lib/lemonSubscriptionGuard';
import {
  authenticateRequest,
  billingCorsHeaders,
  cancelLemonSubscription,
  fetchLemonSubscription,
  getUserLemonSubscription,
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
      'cancel',
    );
    if (!guard.allowed) {
      return {
        statusCode: 403,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: guard.reason ?? 'Cancellation not allowed' }),
      };
    }

    const cancelResult = await cancelLemonSubscription(subscriptionRow.provider_subscription_id);
    if (!cancelResult.ok) {
      return {
        statusCode: 502,
        headers: billingCorsHeaders,
        body: JSON.stringify({
          error: 'Failed to cancel subscription on Lemon Squeezy',
          details: cancelResult.details,
        }),
      };
    }

    const subscriptionUpdates: Record<string, unknown> = {
      status: 'canceled',
      entitlement_state: 'cancelled_but_active_until_end',
      updated_at: new Date().toISOString(),
    };
    if (cancelResult.endsAt) {
      subscriptionUpdates.current_period_ends_at = cancelResult.endsAt;
    }

    if (subscriptionRow.pending_status !== null) {
      Object.assign(subscriptionUpdates, {
        pending_plan_code: null,
        pending_plan_effective_at: null,
        pending_provider_variant_id: null,
        pending_from_provider_variant_id: null,
        pending_effective_at_snapshot: null,
        pending_status: null,
        pending_locked_at: null,
        pending_failed_reason: null,
        pending_attempts: 0,
        last_pending_plan_cancelled_at: new Date().toISOString(),
      });
    }

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(subscriptionUpdates)
      .eq('user_id', userId);

    if (updateError) {
      return {
        statusCode: 500,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Failed to update subscription state' }),
      };
    }

    if (subscriptionRow.pending_status !== null) {
      await supabase.from('subscription_events').insert({
        user_id: userId,
        provider: 'lemon',
        event_type: 'pending_plan_cancelled',
        provider_event_id: subscriptionRow.provider_subscription_id,
        payload: {
          reason: 'subscription_cancelled',
          cancelled_pending_plan_code: subscriptionRow.pending_plan_code,
        },
      });
    }

    await supabase.from('profiles').update({
      lemon_subscription_status: 'cancelled',
    }).eq('id', userId);

    return {
      statusCode: 200,
      headers: billingCorsHeaders,
      body: JSON.stringify({ ok: true, ends_at: cancelResult.endsAt }),
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
