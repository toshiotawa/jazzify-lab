import type { Handler } from '@netlify/functions';
import {
  authenticateRequest,
  billingCorsHeaders,
  extractActiveScheduleId,
  getStripeClient,
  getUserStripeSubscription,
  mirrorStripeSubscription,
  retrieveExpandedStripeSubscription,
} from './lib/stripeBilling';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: billingCorsHeaders };
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
    const row = await getUserStripeSubscription(supabase, userId);
    if (!row?.provider_subscription_id) {
      return {
        statusCode: 404,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Stripe subscription not found' }),
      };
    }
    if (row.pending_status == null) {
      return {
        statusCode: 409,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'No scheduled plan change' }),
      };
    }

    const stripe = getStripeClient();
    const current = await retrieveExpandedStripeSubscription(stripe, row.provider_subscription_id);
    const activeScheduleId = extractActiveScheduleId(current);
    if (!activeScheduleId) {
      await mirrorStripeSubscription(supabase, current, { stripe });
      return {
        statusCode: 409,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Stripe schedule not found' }),
      };
    }

    await stripe.subscriptionSchedules.release(activeScheduleId);
    const refreshed = await retrieveExpandedStripeSubscription(stripe, current.id);
    await mirrorStripeSubscription(supabase, refreshed, { stripe });
    await supabase.from('subscription_events').insert({
      user_id: userId,
      provider: 'stripe',
      event_type: 'pending_plan_cancelled',
      provider_event_id: null,
      payload: {
        provider_subscription_id: current.id,
        cancelled_pending_plan_code: row.pending_plan_code,
      },
      processing_status: 'processed',
      processed_at: new Date().toISOString(),
      livemode: refreshed.livemode,
    });

    return { statusCode: 200, headers: billingCorsHeaders, body: JSON.stringify({ ok: true }) };
  } catch {
    return {
      statusCode: 500,
      headers: billingCorsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};