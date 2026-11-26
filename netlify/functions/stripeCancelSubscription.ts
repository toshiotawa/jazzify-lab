import type { Handler } from '@netlify/functions';
import {
  authenticateRequest,
  billingCorsHeaders,
  getStripeClient,
  getUserStripeCoachingSubscription,
  getUserStripeSubscription,
  mirrorStripeSubscription,
  parseStripeBillingProduct,
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
    const product = parseStripeBillingProduct(event.body);
    if (product === 'invalid') {
      return {
        statusCode: 400,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Invalid product' }),
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
    const row =
      product === 'coaching'
        ? await getUserStripeCoachingSubscription(supabase, userId)
        : await getUserStripeSubscription(supabase, userId);
    if (!row?.provider_subscription_id) {
      return {
        statusCode: 404,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Stripe subscription not found' }),
      };
    }
    if (row.entitlement_state !== 'active' || row.pending_cancel_status != null) {
      return {
        statusCode: 409,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Cancellation is not available in the current state' }),
      };
    }

    const stripe = getStripeClient();
    const current = await retrieveExpandedStripeSubscription(stripe, row.provider_subscription_id);
    if (current.status !== 'active' && current.status !== 'trialing') {
      return {
        statusCode: 409,
        headers: billingCorsHeaders,
        body: JSON.stringify({
          error: 'Cancellation is not available for this Stripe subscription',
        }),
      };
    }
    if (current.cancel_at_period_end) {
      return {
        statusCode: 409,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Cancellation already scheduled', scheduled: true }),
      };
    }

    const updated = await stripe.subscriptions.update(current.id, {
      cancel_at_period_end: true,
      expand: ['items.data.price.product', 'schedule', 'schedule.phases.items.price'],
    });
    await mirrorStripeSubscription(supabase, updated);
    await supabase.from('subscription_events').insert({
      user_id: userId,
      provider: 'stripe',
      event_type:
        product === 'coaching' ? 'coaching_pending_cancel_scheduled' : 'pending_cancel_scheduled',
      provider_event_id: null,
      payload: {
        provider_subscription_id: updated.id,
        product,
        pending_cancel_effective_at: new Date(updated.current_period_end * 1000).toISOString(),
      },
      processing_status: 'processed',
      processed_at: new Date().toISOString(),
      livemode: updated.livemode,
    });

    return {
      statusCode: 200,
      headers: billingCorsHeaders,
      body: JSON.stringify({
        ok: true,
        scheduled: true,
        effective_at: new Date(updated.current_period_end * 1000).toISOString(),
      }),
    };
  } catch {
    return {
      statusCode: 500,
      headers: billingCorsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};