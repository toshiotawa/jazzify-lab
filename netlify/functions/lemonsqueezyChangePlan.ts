import { noTrialVariantForPlanCode } from './lib/lemonPlanCatalog';
import {
  assertSubscriptionActionAllowed,
  targetPlanCodeForChange,
} from './lib/lemonSubscriptionGuard';
import {
  authenticateRequest,
  billingCorsHeaders,
  ensureEnv,
  fetchLemonSubscription,
  getUserLemonSubscription,
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
    const apiKey = ensureEnv('LEMONSQUEEZY_API_KEY');
    const subscriptionId = subscriptionRow.provider_subscription_id;

    const res = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'subscriptions',
          id: subscriptionId,
          attributes: {
            variant_id: Number(variantId),
            disable_prorations: true,
          },
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return {
        statusCode: 502,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Failed to change plan on Lemon Squeezy', details: errBody }),
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
