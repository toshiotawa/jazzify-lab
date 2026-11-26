import type { Handler } from '@netlify/functions';

import {
  authenticateRequest,
  billingCorsHeaders,
  getStripeClient,
  getUserStripeSubscription,
  isActiveEntitlementState,
  mirrorStripeSubscription,
  resolveStripePriceByLookupKey,
  retrieveExpandedStripeSubscription,
  stripeLookupKeyForPlan,
  stripePlanTargetForPlanCode,
  type StripePlanTarget,
} from './lib/stripeBilling';

type ChangePlanBody = {
  target?: unknown;
};

const parseTarget = (body: string | null): StripePlanTarget | null => {
  if (!body) return null;

  try {
    const parsed = JSON.parse(body) as ChangePlanBody;

    return parsed.target === 'monthly' || parsed.target === 'yearly' ? parsed.target : null;
  } catch {
    return null;
  }
};

export const handler: Handler = async (event) => {
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

    const row = await getUserStripeSubscription(supabase, userId);

    if (!row?.provider_subscription_id) {
      return {
        statusCode: 404,

        headers: billingCorsHeaders,

        body: JSON.stringify({ error: 'Stripe subscription not found' }),
      };
    }

    if (!isActiveEntitlementState(row.entitlement_state) || row.pending_cancel_status != null) {
      return {
        statusCode: 409,

        headers: billingCorsHeaders,

        body: JSON.stringify({ error: 'Plan change is not available in the current state' }),
      };
    }

    if (stripePlanTargetForPlanCode(row.plan_code) === target) {
      return {
        statusCode: 409,

        headers: billingCorsHeaders,

        body: JSON.stringify({ error: 'Already on the requested plan' }),
      };
    }

    const stripe = getStripeClient();

    const current = await retrieveExpandedStripeSubscription(stripe, row.provider_subscription_id);

    const subscriptionItemId = current.items.data[0]?.id ?? null;

    if (!subscriptionItemId) {
      return {
        statusCode: 409,

        headers: billingCorsHeaders,

        body: JSON.stringify({ error: 'Subscription item not found' }),
      };
    }

    const price = await resolveStripePriceByLookupKey(
      stripe,
      stripeLookupKeyForPlan('premium', target),
    );

    const updated = await stripe.subscriptions.update(current.id, {
      cancel_at_period_end: false,

      proration_behavior: 'none',

      items: [{ id: subscriptionItemId, price: price.id }],

      expand: ['items.data.price.product'],
    });

    await mirrorStripeSubscription(supabase, updated);

    await supabase.from('subscription_events').insert({
      user_id: userId,

      provider: 'stripe',

      event_type: 'plan_changed',

      provider_event_id: null,

      payload: {
        provider_subscription_id: updated.id,

        target,

        price_lookup_key: price.lookup_key,
      },

      processing_status: 'processed',

      processed_at: new Date().toISOString(),

      livemode: updated.livemode,
    });

    return {
      statusCode: 200,

      headers: billingCorsHeaders,

      body: JSON.stringify({ ok: true }),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return {
      statusCode: 500,

      headers: billingCorsHeaders,

      body: JSON.stringify({ error: 'Internal server error', details: message }),
    };
  }
};
