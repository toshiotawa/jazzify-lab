import type { Handler } from '@netlify/functions';

import type Stripe from 'stripe';

import { resolveSiteUrl } from './utils/resolveSiteUrl';

import { readGeoCountryFromHeaders } from './lib/lemonCheckoutDefaults';

import {
  authenticateRequest,
  billingCorsHeaders,
  getStripeClient,
  isActiveEntitlementState,
  isJapanStripeEligible,
  resolveStripePriceByLookupKey,
  stripeLookupKeyForPlan,
  stripePlanCodeForLookupKey,
  userHasCurrentCoaching,
  userHasPaidPremiumForCoaching,
  type StripePlanTarget,
  type StripeProductKind,
} from './lib/stripeBilling';

type CheckoutRequestBody = {
  product?: unknown;
  plan?: unknown;
};

const parseCheckoutBody = (rawBody: string | null): CheckoutRequestBody | null => {
  if (!rawBody) return {};
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    return typeof parsed === 'object' && parsed !== null ? (parsed as CheckoutRequestBody) : null;
  } catch {
    return null;
  }
};

const isStripeProductKind = (value: unknown): value is StripeProductKind =>
  value === 'premium' || value === 'coaching';

const isStripePlanTarget = (value: unknown): value is StripePlanTarget =>
  value === 'monthly' || value === 'yearly';

export const handler: Handler = async (event, _context) => {
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

    const body = parseCheckoutBody(event.body);
    if (!body) {
      return {
        statusCode: 400,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Invalid JSON body' }),
      };
    }

    if (body.product !== undefined && !isStripeProductKind(body.product)) {
      return {
        statusCode: 400,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Invalid product' }),
      };
    }

    if (body.plan !== undefined && !isStripePlanTarget(body.plan)) {
      return {
        statusCode: 400,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Invalid plan' }),
      };
    }

    const productKind: StripeProductKind = isStripeProductKind(body.product)
      ? body.product
      : 'premium';
    const planTarget: StripePlanTarget = isStripePlanTarget(body.plan) ? body.plan : 'monthly';

    if (productKind === 'coaching' && planTarget === 'yearly') {
      return {
        statusCode: 400,

        headers: billingCorsHeaders,

        body: JSON.stringify({ error: 'Coaching is monthly only' }),
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

      .select(
        'stripe_customer_id, email, country, rank, lemon_trial_used, stripe_trial_start, billing_currency, preferred_locale',
      )

      .eq('id', userId)

      .single();

    if (profileError) {
      return {
        statusCode: 500,

        headers: billingCorsHeaders,

        body: JSON.stringify({ error: 'Failed to fetch user profile' }),
      };
    }

    if (productKind === 'premium' && process.env.STRIPE_ENABLE_PREMIUM_CHECKOUT === 'false') {
      return {
        statusCode: 503,
        headers: billingCorsHeaders,
        body: JSON.stringify({
          error: 'Stripe checkout is temporarily disabled. Please use the standard checkout.',
        }),
      };
    }

    const geoCountry = readGeoCountryFromHeaders(event.headers);
    if (!isJapanStripeEligible({ ...profile, geoCountry })) {
      return {
        statusCode: 400,
        headers: billingCorsHeaders,
        body: JSON.stringify({
          error:
            'Stripe checkout is available only for Japan users. Please use the global checkout.',
        }),
      };
    }

    const { data: subscriptionRow } = await supabase

      .from('subscriptions')

      .select('provider, entitlement_state, status, trial_used, pending_cancel_status')

      .eq('user_id', userId)

      .maybeSingle();

    if (
      productKind === 'premium' &&
      subscriptionRow &&
      isActiveEntitlementState(subscriptionRow.entitlement_state)
    ) {
      return {
        statusCode: 409,

        headers: billingCorsHeaders,

        body: JSON.stringify({ error: 'Premium subscription is already active' }),
      };
    }

    if (productKind === 'premium' && profile.rank && profile.rank !== 'free') {
      return {
        statusCode: 409,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Premium subscription is already active' }),
      };
    }

    if (productKind === 'coaching') {
      const eligible = await userHasPaidPremiumForCoaching(supabase, userId);

      if (!eligible) {
        return {
          statusCode: 403,

          headers: billingCorsHeaders,

          body: JSON.stringify({ error: 'Coaching requires an active paid Premium subscription' }),
        };
      }

      if (await userHasCurrentCoaching(supabase, userId)) {
        return {
          statusCode: 409,

          headers: billingCorsHeaders,

          body: JSON.stringify({ error: 'Coaching subscription is already active' }),
        };
      }
    }

    const stripe = getStripeClient();

    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email ?? undefined,

        metadata: {
          supabase_user_id: userId,
        },
      });

      customerId = customer.id;

      const { error: customerUpdateError } = await supabase

        .from('profiles')

        .update({ stripe_customer_id: customerId })

        .eq('id', userId);

      if (customerUpdateError) {
        return {
          statusCode: 500,
          headers: billingCorsHeaders,
          body: JSON.stringify({ error: 'Failed to save Stripe customer' }),
        };
      }
    }

    const lookupKey = stripeLookupKeyForPlan(productKind, planTarget);

    const price = await resolveStripePriceByLookupKey(stripe, lookupKey);

    const planCode = stripePlanCodeForLookupKey(lookupKey);

    const trialAlreadyUsed =
      subscriptionRow?.trial_used === true ||
      profile.lemon_trial_used === true ||
      profile.stripe_trial_start != null;

    const nowIso = new Date().toISOString();
    const { data: openIntent } = await supabase
      .from('checkout_intents')
      .select('id, provider_checkout_session_id, price_lookup_key')
      .eq('user_id', userId)
      .eq('provider', 'stripe')
      .eq('product_kind', productKind)
      .eq('status', 'checkout_created')
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (openIntent?.provider_checkout_session_id && openIntent.price_lookup_key === lookupKey) {
      const existingSession = await stripe.checkout.sessions.retrieve(
        openIntent.provider_checkout_session_id,
      );
      if (existingSession.status === 'open' && existingSession.url) {
        return {
          statusCode: 200,
          headers: billingCorsHeaders,
          body: JSON.stringify({
            sessionId: existingSession.id,
            url: existingSession.url,
          }),
        };
      }
    }

    const { data: checkoutIntent, error: intentError } = await supabase

      .from('checkout_intents')

      .insert({
        user_id: userId,

        provider: 'stripe',

        product_kind: productKind,

        plan_code: planCode,

        price_lookup_key: lookupKey,

        provider_customer_id: customerId,

        livemode: price.livemode,
      })

      .select('id')

      .single();

    if (intentError || !checkoutIntent) {
      return {
        statusCode: 500,

        headers: billingCorsHeaders,

        body: JSON.stringify({ error: 'Failed to create checkout intent' }),
      };
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,

      mode: 'subscription',

      line_items: [
        {
          price: price.id,

          quantity: 1,
        },
      ],

      success_url: `${siteUrl}/main#account?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${siteUrl}/main#account`,

      automatic_tax: { enabled: true },

      customer_update: {
        address: 'auto',
      },

      client_reference_id: userId,

      metadata: {
        checkout_intent_id: checkoutIntent.id,

        user_id: userId,

        product_kind: productKind,

        price_lookup_key: lookupKey,
      },

      subscription_data: {
        metadata: {
          checkout_intent_id: checkoutIntent.id,

          user_id: userId,

          product_kind: productKind,

          price_lookup_key: lookupKey,
        },

        description:
          productKind === 'coaching'
            ? 'Jazzify coaching add-on subscription'
            : 'Jazzify Premium subscription',

        ...(productKind === 'premium' && !trialAlreadyUsed ? { trial_period_days: 7 } : {}),
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    const { error: checkoutIntentUpdateError } = await supabase

      .from('checkout_intents')

      .update({
        provider_checkout_session_id: session.id,

        status: 'checkout_created',
      })

      .eq('id', checkoutIntent.id);

    if (checkoutIntentUpdateError) {
      return {
        statusCode: 500,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Failed to update checkout intent' }),
      };
    }

    return {
      statusCode: 200,

      headers: billingCorsHeaders,

      body: JSON.stringify({
        sessionId: session.id,

        url: session.url,
      }),
    };
  } catch {
    return {
      statusCode: 500,

      headers: billingCorsHeaders,

      body: JSON.stringify({
        error: 'Internal server error',
      }),
    };
  }
};
