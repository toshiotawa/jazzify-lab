import type { Handler } from '@netlify/functions';
import {
  authenticateRequest,
  billingCorsHeaders,
  getStripeClient,
  getUserStripeSubscription,
  mirrorStripeSubscription,
  resolveStripePriceByLookupKey,
  retrieveExpandedStripeSubscription,
  stripeLookupKeyForPlan,
  stripePlanCodeForLookupKey,
  stripePlanTargetForPlanCode,
  type StripePlanTarget,
} from './lib/stripeBilling';

type ChangePlanBody = { target?: unknown };

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
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: billingCorsHeaders };
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
    if (
      row.entitlement_state !== 'active' ||
      row.pending_cancel_status != null ||
      row.pending_status != null
    ) {
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
    if (
      (current.status !== 'active' && current.status !== 'trialing') ||
      current.cancel_at_period_end
    ) {
      return {
        statusCode: 409,
        headers: billingCorsHeaders,
        body: JSON.stringify({
          error: 'Plan change is not available for this Stripe subscription',
        }),
      };
    }
    if (current.schedule) {
      return {
        statusCode: 409,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Plan change already scheduled', scheduled: true }),
      };
    }

    const currentItem = current.items.data[0] ?? null;
    const currentPriceId = currentItem?.price.id ?? null;
    if (!currentItem || !currentPriceId) {
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
    const schedule = await stripe.subscriptionSchedules.create({ from_subscription: current.id });
    const phaseStart = schedule.current_phase?.start_date ?? current.current_period_start;
    const quantity = currentItem.quantity ?? 1;
    const trialEnd =
      typeof current.trial_end === 'number' && current.trial_end > Math.floor(Date.now() / 1000)
        ? current.trial_end
        : undefined;

    try {
      await stripe.subscriptionSchedules.update(schedule.id, {
        end_behavior: 'release',
        phases: [
          {
            start_date: phaseStart,
            end_date: current.current_period_end,
            items: [{ price: currentPriceId, quantity }],
            proration_behavior: 'none',
            ...(trialEnd ? { trial_end: trialEnd } : {}),
          },
          {
            start_date: current.current_period_end,
            items: [{ price: price.id, quantity }],
            proration_behavior: 'none',
          },
        ],
      });
    } catch (error) {
      await stripe.subscriptionSchedules.release(schedule.id).catch(() => undefined);
      throw error;
    }

    const refreshed = await retrieveExpandedStripeSubscription(stripe, current.id);
    await mirrorStripeSubscription(supabase, refreshed);
    await supabase.from('subscription_events').insert({
      user_id: userId,
      provider: 'stripe',
      event_type: 'pending_plan_scheduled',
      provider_event_id: null,
      payload: {
        provider_subscription_id: current.id,
        pending_plan_code: stripePlanCodeForLookupKey(price.lookup_key ?? null),
        pending_price_lookup_key: price.lookup_key,
        pending_plan_effective_at: new Date(current.current_period_end * 1000).toISOString(),
      },
      processing_status: 'processed',
      processed_at: new Date().toISOString(),
      livemode: refreshed.livemode,
    });

    return {
      statusCode: 200,
      headers: billingCorsHeaders,
      body: JSON.stringify({ ok: true, scheduled: true }),
    };
  } catch {
    return {
      statusCode: 500,
      headers: billingCorsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
