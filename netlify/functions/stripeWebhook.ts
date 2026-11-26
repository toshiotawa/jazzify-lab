import Stripe from 'stripe';

import {
  getStripeClient,
  getSupabaseServiceClient,
  mirrorStripeSubscription,
  resolveExpectedStripeLivemode,
  retrieveExpandedStripeSubscription,
} from './lib/stripeBilling';

interface NetlifyEvent {
  httpMethod: string;

  headers: Record<string, string | undefined>;

  body: string | null;

  isBase64Encoded?: boolean;
}

const headers = {
  'Access-Control-Allow-Origin': '*',

  'Access-Control-Allow-Headers': 'Content-Type, Authorization',

  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const getStripeSignature = (eventHeaders: Record<string, string | undefined>): string | undefined =>
  eventHeaders['stripe-signature'] ||
  eventHeaders['Stripe-Signature'] ||
  eventHeaders['STRIPE-SIGNATURE'];

const uniqueValues = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      values.filter((value): value is string => typeof value === 'string' && value.length > 0),
    ),
  );

const webhookSecretsForVerification = (): string[] => {
  const expectedLivemode = resolveExpectedStripeLivemode();

  return expectedLivemode
    ? uniqueValues([process.env.STRIPE_LIVE_WEBHOOK_SECRET, process.env.STRIPE_WEBHOOK_SECRET])
    : uniqueValues([process.env.STRIPE_TEST_WEBHOOK_SECRET, process.env.STRIPE_WEBHOOK_SECRET]);
};

const constructStripeWebhookEvent = (
  rawBody: string | Buffer,

  signature: string | undefined,
): Stripe.Event => {
  if (!signature) {
    throw new Error('Missing Stripe signature');
  }

  const secrets = webhookSecretsForVerification();

  if (secrets.length === 0) {
    throw new Error('Stripe webhook secret is not configured');
  }

  let lastError: unknown = null;

  for (const secret of secrets) {
    try {
      return getStripeClient().webhooks.constructEvent(rawBody, signature, secret);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Invalid Stripe signature');
};

const recordStripeEvent = async (
  stripeEvent: Stripe.Event,

  status: 'received' | 'processed' | 'ignored' | 'failed',

  payload: Record<string, unknown> = {},
): Promise<{ inserted: boolean }> => {
  const eventUserId = typeof payload.user_id === 'string' ? payload.user_id : null;

  const { error } = await getSupabaseServiceClient()
    .from('subscription_events')

    .insert({
      user_id: eventUserId,

      provider: 'stripe',

      event_type: stripeEvent.type,

      provider_event_id: stripeEvent.id,

      payload: {
        stripe_event_created: stripeEvent.created,

        ...payload,
      },

      livemode: stripeEvent.livemode,

      processing_status: status,

      processed_at: new Date().toISOString(),
    });

  if (!error) {
    return { inserted: true };
  }

  if (error.code === '23505') {
    return { inserted: false };
  }

  throw new Error(`Failed to record Stripe event: ${error.message}`);
};

const updateRecordedStripeEvent = async (
  stripeEvent: Stripe.Event,

  status: 'processed' | 'ignored' | 'failed',

  payload: Record<string, unknown>,

  processingError: string | null = null,
): Promise<void> => {
  await getSupabaseServiceClient()
    .from('subscription_events')

    .update({
      processing_status: status,

      payload: {
        stripe_event_created: stripeEvent.created,

        ...payload,
      },

      processing_error: processingError,

      processed_at: new Date().toISOString(),
    })

    .eq('provider', 'stripe')

    .eq('provider_event_id', stripeEvent.id);
};

const subscriptionIdFromInvoice = (invoice: Stripe.Invoice): string | null => {
  const subscription = invoice.subscription;

  if (typeof subscription === 'string') return subscription;

  return subscription?.id ?? null;
};

const subscriptionIdFromCheckoutSession = (session: Stripe.Checkout.Session): string | null => {
  const subscription = session.subscription;

  if (typeof subscription === 'string') return subscription;

  return subscription?.id ?? null;
};

const markCheckoutIntent = async (
  session: Stripe.Checkout.Session,

  status: 'completed' | 'failed',
): Promise<void> => {
  await getSupabaseServiceClient()
    .from('checkout_intents')

    .update({
      status,

      completed_at: status === 'completed' ? new Date().toISOString() : null,
    })

    .eq('provider', 'stripe')

    .eq('provider_checkout_session_id', session.id);
};

const mirrorSubscriptionById = async (
  stripe: Stripe,

  subscriptionId: string | null,
): Promise<Awaited<ReturnType<typeof mirrorStripeSubscription>> | null> => {
  if (!subscriptionId) return null;

  const subscription = await retrieveExpandedStripeSubscription(stripe, subscriptionId);

  return mirrorStripeSubscription(getSupabaseServiceClient(), subscription);
};

export const handler = async (event: NetlifyEvent) => {
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

  let stripeEvent: Stripe.Event;

  try {
    const rawBody: string | Buffer = event.isBase64Encoded
      ? Buffer.from(event.body ?? '', 'base64')
      : (event.body ?? '');

    stripeEvent = constructStripeWebhookEvent(rawBody, getStripeSignature(event.headers));
  } catch {
    return {
      statusCode: 400,

      headers,

      body: JSON.stringify({ error: 'Invalid signature' }),
    };
  }

  try {
    const expectedLivemode = resolveExpectedStripeLivemode();

    if (stripeEvent.livemode !== expectedLivemode) {
      await recordStripeEvent(stripeEvent, 'ignored', {
        reason: 'livemode_mismatch',

        expected_livemode: expectedLivemode,
      });

      return {
        statusCode: 400,

        headers,

        body: JSON.stringify({ error: 'Unexpected Stripe livemode' }),
      };
    }

    const inserted = await recordStripeEvent(stripeEvent, 'received');

    if (!inserted.inserted) {
      return {
        statusCode: 200,

        headers,

        body: JSON.stringify({ received: true, duplicate: true }),
      };
    }

    const stripe = getStripeClient();

    let result: Awaited<ReturnType<typeof mirrorStripeSubscription>> | null = null;

    switch (stripeEvent.type) {
      case 'checkout.session.async_payment_failed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;

        await markCheckoutIntent(session, 'failed');

        break;
      }

      case 'checkout.session.completed':

      case 'checkout.session.async_payment_succeeded': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;

        if (session.payment_status !== 'unpaid') {
          await markCheckoutIntent(session, 'completed');

          result = await mirrorSubscriptionById(stripe, subscriptionIdFromCheckoutSession(session));
        }

        break;
      }

      case 'customer.subscription.created':

      case 'customer.subscription.updated':

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;

        result = await mirrorSubscriptionById(stripe, subscription.id);

        break;
      }

      case 'invoice.paid':

      case 'invoice.payment_succeeded':

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;

        result = await mirrorSubscriptionById(stripe, subscriptionIdFromInvoice(invoice));

        break;
      }

      default:
        break;
    }

    await updateRecordedStripeEvent(
      stripeEvent,
      result?.kind === 'ignored' ? 'ignored' : 'processed',
      {
        mirror_kind: result?.kind ?? null,

        user_id: result?.userId ?? null,

        reason: result?.reason ?? null,
      },
    );

    return {
      statusCode: 200,

      headers,

      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    await updateRecordedStripeEvent(
      stripeEvent,

      'failed',

      {},

      error instanceof Error ? error.message : 'Unknown error',
    );

    return {
      statusCode: 500,

      headers,

      body: JSON.stringify({
        error: 'Internal server error',

        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
