import type { Handler } from '@netlify/functions';
import { resolveSiteUrl } from './utils/resolveSiteUrl';
import { authenticateRequest, billingCorsHeaders, getStripeClient } from './lib/stripeBilling';

const portalConfigurationIdFromEnv = process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID;

const parsePaymentMethodPurpose = (body: string | null): boolean => {
  if (!body) return false;
  try {
    const parsed = JSON.parse(body) as { purpose?: unknown };
    return parsed.purpose === 'payment_method';
  } catch {
    return false;
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
    if (!parsePaymentMethodPurpose(event.body)) {
      return {
        statusCode: 400,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Invalid purpose. Use payment_method.' }),
      };
    }
    if (!portalConfigurationIdFromEnv) {
      return {
        statusCode: 500,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Stripe portal configuration is not configured' }),
      };
    }

    const siteUrl = resolveSiteUrl(event.headers);
    if (!siteUrl) {
      return {
        statusCode: 500,
        headers: billingCorsHeaders,
        body: JSON.stringify({
          error: 'Site URL is not configured. Please set SITE_URL or DEPLOY_URL.',
        }),
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
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();
    if (profileError || !profile?.stripe_customer_id) {
      return {
        statusCode: 404,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Stripe customer not found' }),
      };
    }

    const { data: premiumRow } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', 'stripe')
      .neq('entitlement_state', 'expired')
      .limit(1)
      .maybeSingle();
    const { data: coachingRow } = await supabase
      .from('coaching_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', 'stripe')
      .neq('entitlement_state', 'expired')
      .limit(1)
      .maybeSingle();
    if (!premiumRow && !coachingRow) {
      return {
        statusCode: 403,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'No active Stripe billing relationship found' }),
      };
    }

    const portalSession = await getStripeClient().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl}/main#account`,
      configuration: portalConfigurationIdFromEnv,
    });

    return {
      statusCode: 200,
      headers: billingCorsHeaders,
      body: JSON.stringify({ url: portalSession.url }),
    };
  } catch {
    return {
      statusCode: 500,
      headers: billingCorsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
