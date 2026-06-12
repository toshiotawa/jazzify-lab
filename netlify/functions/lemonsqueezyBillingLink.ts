import {
  assertSubscriptionActionAllowed,
  type SubscriptionAction,
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
  body: string | null;
}

type BillingLinkPurpose = 'payment_method' | 'billing_history' | 'cancel';

const parsePurpose = (body: string | null): BillingLinkPurpose | null => {
  if (!body) return null;
  try {
    const parsed = JSON.parse(body) as { purpose?: unknown };
    const purpose = parsed.purpose;
    if (purpose === 'payment_method' || purpose === 'billing_history' || purpose === 'cancel') {
      return purpose;
    }
    return null;
  } catch {
    return null;
  }
};

const purposeToAction = (purpose: BillingLinkPurpose): SubscriptionAction => {
  if (purpose === 'payment_method') return 'manage_payment';
  if (purpose === 'cancel') return 'cancel';
  return 'billing_history';
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
    const purpose = parsePurpose(event.body);
    if (!purpose) {
      return {
        statusCode: 400,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Invalid purpose. Use payment_method, billing_history, or cancel.' }),
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
      purposeToAction(purpose),
    );
    if (!guard.allowed) {
      return {
        statusCode: 403,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: guard.reason ?? 'Action not allowed' }),
      };
    }

    const urls = attrs.urls ?? {};
    const url =
      purpose === 'payment_method'
        ? urls.update_payment_method ?? null
        : urls.customer_portal ?? urls.portal ?? null;

    if (!url) {
      return {
        statusCode: 404,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Billing URL not available' }),
      };
    }

    return {
      statusCode: 200,
      headers: billingCorsHeaders,
      body: JSON.stringify({ url, purpose }),
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
