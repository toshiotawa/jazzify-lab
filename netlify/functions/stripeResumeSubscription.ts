import type { Handler } from '@netlify/functions';
import {
  authenticateRequest,
  billingCorsHeaders,
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

    const stripe = getStripeClient();
    const current = await retrieveExpandedStripeSubscription(stripe, row.provider_subscription_id);
    if (current.status !== 'active' && current.status !== 'trialing') {
      return {
        statusCode: 409,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Resume is not available for this Stripe subscription' }),
      };
    }
    if (!current.cancel_at_period_end) {
      return {
        statusCode: 409,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Subscription is not scheduled to cancel' }),
      };
    }

    const updated = await stripe.subscriptions.update(current.id, {
      cancel_at_period_end: false,
      expand: ['items.data.price.product', 'schedule', 'schedule.phases.items.price'],
    });
    await mirrorStripeSubscription(supabase, updated);
    await supabase.from('subscription_events').insert({
      user_id: userId,
      provider: 'stripe',
      event_type: 'pending_cancel_cleared',
      provider_event_id: null,
      payload: {
        provider_subscription_id: updated.id,
        reason: 'user_resume_before_period_end',
      },
      processing_status: 'processed',
      processed_at: new Date().toISOString(),
      livemode: updated.livemode,
    });

    return {
      statusCode: 200,
      headers: billingCorsHeaders,
      body: JSON.stringify({ ok: true, cleared_scheduled_cancel: true }),
    };
  } catch {
    return {
      statusCode: 500,
      headers: billingCorsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
