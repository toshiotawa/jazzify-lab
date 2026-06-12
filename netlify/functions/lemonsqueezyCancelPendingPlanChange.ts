import {
  authenticateRequest,
  billingCorsHeaders,
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

    if (subscriptionRow.pending_status === null) {
      return {
        statusCode: 409,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'No pending plan change to cancel' }),
      };
    }
    if (subscriptionRow.pending_status === 'applying') {
      return {
        statusCode: 409,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Plan change is currently being applied' }),
      };
    }

    const cancelledPendingPlanCode = subscriptionRow.pending_plan_code;

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
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
      })
      .eq('user_id', userId);

    if (updateError) {
      return {
        statusCode: 500,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Failed to clear pending plan change' }),
      };
    }

    await supabase.from('subscription_events').insert({
      user_id: userId,
      provider: 'lemon',
      event_type: 'pending_plan_cancelled',
      provider_event_id: subscriptionRow.provider_subscription_id,
      payload: {
        reason: 'user_cancelled',
        cancelled_pending_plan_code: cancelledPendingPlanCode,
      },
    });

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
