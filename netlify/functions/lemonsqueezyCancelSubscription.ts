import {
  assertSubscriptionActionAllowed,
  isPendingCancelScheduled,
} from './lib/lemonSubscriptionGuard';
import {
  authenticateRequest,
  billingCorsHeaders,
  fetchLemonSubscription,
  getUserLemonSubscription,
} from './lib/lemonNetlifyCommon';

interface NetlifyEvent {
  httpMethod: string;
  headers: Record<string, string | undefined>;
}

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

    if (isPendingCancelScheduled(subscriptionRow.pending_cancel_status)) {
      return {
        statusCode: 409,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Cancellation already scheduled', scheduled: true }),
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
      Date.now(),
      { pendingCancelScheduled: false },
    );
    if (!guard.allowed) {
      return {
        statusCode: 403,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: guard.reason ?? 'Cancellation not allowed' }),
      };
    }

    const effectiveAt = resolveEffectiveAt(
      attrs.renews_at ?? null,
      attrs.ends_at ?? null,
      subscriptionRow.current_period_ends_at,
    );
    if (!effectiveAt) {
      return {
        statusCode: 409,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Cannot determine subscription period end' }),
      };
    }

    const subscriptionUpdates: Record<string, unknown> = {
      pending_cancel_effective_at: effectiveAt,
      pending_cancel_effective_at_snapshot: effectiveAt,
      pending_cancel_status: 'scheduled',
      pending_cancel_locked_at: null,
      pending_cancel_failed_reason: null,
      pending_cancel_attempts: 0,
      updated_at: new Date().toISOString(),
    };

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
        body: JSON.stringify({ error: 'Failed to record scheduled cancellation' }),
      };
    }

    if (subscriptionRow.pending_status !== null) {
      await supabase.from('subscription_events').insert({
        user_id: userId,
        provider: 'lemon',
        event_type: 'pending_plan_cancelled',
        provider_event_id: subscriptionRow.provider_subscription_id,
        payload: {
          reason: 'subscription_cancel_scheduled',
          cancelled_pending_plan_code: subscriptionRow.pending_plan_code,
        },
      });
    }

    await supabase.from('subscription_events').insert({
      user_id: userId,
      provider: 'lemon',
      event_type: 'pending_cancel_scheduled',
      provider_event_id: subscriptionRow.provider_subscription_id,
      payload: {
        pending_cancel_effective_at: effectiveAt,
      },
    });

    return {
      statusCode: 200,
      headers: billingCorsHeaders,
      body: JSON.stringify({ ok: true, scheduled: true, effective_at: effectiveAt }),
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
