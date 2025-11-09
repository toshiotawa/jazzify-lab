import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

type SubscriptionProvider = 'stripe' | 'lemonsqueezy' | 'none';

interface SubscriptionStatusPayload {
  provider: SubscriptionProvider;
  renewalDateIso: string | null;
  trialEndDateIso: string | null;
}

interface LemonSubscriptionResponse {
  data?: {
    attributes?: {
      renews_at?: string | null;
      trial_ends_at?: string | null;
    };
  };
}

interface SubscriptionProfileRow {
  stripe_customer_id: string | null;
  stripe_trial_end: string | null;
  lemon_subscription_id: string | null;
  lemon_subscription_status: string | null;
}

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const supabaseUrl =
  process.env.SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  process.env.SUPABASE_SERVICE_ROLE_URL;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL か VITE_SUPABASE_URL が設定されていません');
}

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY が設定されていません');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? null;
const stripe =
  stripeSecretKey !== null
    ? new Stripe(stripeSecretKey, {
        apiVersion: '2025-09-30.clover',
      })
    : null;

const lemonApiKey = process.env.LEMONSQUEEZY_API_KEY ?? null;

const toIsoString = (value: number | string | null | undefined): string | null => {
  if (typeof value === 'number') {
    return new Date(value * 1000).toISOString();
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return null;
};

const getBearerToken = (authorizationHeader: string | undefined): string | null => {
  if (!authorizationHeader) {
    return null;
  }
  const trimmed = authorizationHeader.trim();
  if (!trimmed) {
    return null;
  }
  if (/^Bearer\s+/i.test(trimmed)) {
    return trimmed.replace(/^Bearer\s+/i, '');
  }
  return trimmed;
};

export const handler: Handler = async event => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const token = getBearerToken(
      (event.headers.authorization as string | undefined) ??
        (event.headers.Authorization as string | undefined)
    );
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header required' }),
      };
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from<SubscriptionProfileRow>('profiles')
      .select(
        'stripe_customer_id, stripe_trial_end, lemon_subscription_id, lemon_subscription_status'
      )
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Profile not found' }),
      };
    }

    const responsePayload: SubscriptionStatusPayload = {
      provider: 'none',
      renewalDateIso: null,
      trialEndDateIso: profile.stripe_trial_end ? toIsoString(profile.stripe_trial_end) : null,
    };

    if (profile.stripe_customer_id) {
      if (!stripe) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Stripe is not configured' }),
        };
      }

      const subscriptions = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: 'all',
        limit: 5,
      });

      const subscription =
        subscriptions.data.find(item =>
          ['trialing', 'active', 'past_due', 'unpaid'].includes(item.status)
        ) ?? subscriptions.data[0] ?? null;

      responsePayload.provider = 'stripe';

      if (subscription) {
        responsePayload.renewalDateIso = toIsoString(subscription.current_period_end);
        responsePayload.trialEndDateIso =
          toIsoString(subscription.trial_end) ?? responsePayload.trialEndDateIso;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(responsePayload),
      };
    }

    if (
      profile.lemon_subscription_id &&
      profile.lemon_subscription_status &&
      profile.lemon_subscription_status !== 'expired'
    ) {
      if (!lemonApiKey) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Lemon Squeezy is not configured' }),
        };
      }

      const response = await fetch(
        `https://api.lemonsqueezy.com/v1/subscriptions/${profile.lemon_subscription_id}`,
        {
          headers: {
            Authorization: `Bearer ${lemonApiKey}`,
            Accept: 'application/vnd.api+json',
          },
        }
      );

      if (!response.ok) {
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({ error: 'Failed to fetch Lemon Squeezy subscription' }),
        };
      }

      const payload = (await response.json()) as LemonSubscriptionResponse;
      const attributes = payload.data?.attributes;

      responsePayload.provider = 'lemonsqueezy';
      responsePayload.renewalDateIso = toIsoString(attributes?.renews_at);
      responsePayload.trialEndDateIso =
        toIsoString(attributes?.trial_ends_at) ?? responsePayload.trialEndDateIso;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(responsePayload),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responsePayload),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('getSubscriptionStatus error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: message }),
    };
  }
};

