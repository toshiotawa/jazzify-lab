import type { Handler } from '@netlify/functions';

import type Stripe from 'stripe';

import { resolveSiteUrl } from './utils/resolveSiteUrl';

import {
  authenticateRequest,
  billingCorsHeaders,
  getStripeClient,
  isActiveEntitlementState,
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

const isStripeProductKind = (value: unknown): value is StripeProductKind =>
  value === 'premium' || value === 'coaching';

const isStripePlanTarget = (value: unknown): value is StripePlanTarget =>
  value === 'monthly' || value === 'yearly';

const normalizeCountry = (value: string | null | undefined): string | null =>
  value ? value.trim().toUpperCase() : null;

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

    const body = JSON.parse(event.body ?? '{}') as CheckoutRequestBody;

    const productKind = isStripeProductKind(body.product) ? body.product : 'premium';

    const planTarget = isStripePlanTarget(body.plan) ? body.plan : 'monthly';

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

      .select('stripe_customer_id, email, country, lemon_trial_used, stripe_trial_start')

      .eq('id', userId)

      .single();

    if (profileError) {
      return {
        statusCode: 500,

        headers: billingCorsHeaders,

        body: JSON.stringify({ error: 'Failed to fetch user profile' }),
      };
    }

    const normalizedCountry = normalizeCountry(profile?.country ?? null);

    if (
      normalizedCountry &&
      normalizedCountry !== 'JP' &&
      normalizedCountry !== 'JPN' &&
      normalizedCountry !== 'JAPAN'
    ) {
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
        email: profile.email,

        metadata: {
          supabase_user_id: userId,
        },
      });

      customerId = customer.id;

      await supabase

        .from('profiles')

        .update({ stripe_customer_id: customerId })

        .eq('id', userId);
    }

    const lookupKey = stripeLookupKeyForPlan(productKind, planTarget);

    const price = await resolveStripePriceByLookupKey(stripe, lookupKey);

    const planCode = stripePlanCodeForLookupKey(lookupKey);

    const trialAlreadyUsed =
      subscriptionRow?.trial_used === true ||
      profile.lemon_trial_used === true ||
      profile.stripe_trial_start != null;

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

    await supabase

      .from('checkout_intents')

      .update({
        provider_checkout_session_id: session.id,

        status: 'checkout_created',
      })

      .eq('id', checkoutIntent.id);

    return {
      statusCode: 200,

      headers: billingCorsHeaders,

      body: JSON.stringify({
        sessionId: session.id,

        url: session.url,
      }),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return {
      statusCode: 500,

      headers: billingCorsHeaders,

      body: JSON.stringify({
        error: 'Internal server error',

        details: message,
      }),
    };
  }
};
