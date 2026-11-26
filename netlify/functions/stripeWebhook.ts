import Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
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

type StripeEventRecordResult = { action: 'process' } | { action: 'duplicate' } | { action: 'busy' };

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const getStripeSignature = (eventHeaders: Record<string, string | undefined>): string | undefined =>
  eventHeaders['stripe-signature'] ||
  eventHeaders['Stripe-Signature'] ||
  eventHeaders['STRIPE-SIGNATURE'];

const nonEmpty = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.length > 0;

const webhookSecretsForVerification = (): string[] => {
  const expectedLivemode = resolveExpectedStripeLivemode();
  const modeSecret = expectedLivemode
    ? process.env.STRIPE_LIVE_WEBHOOK_SECRET
    : process.env.STRIPE_TEST_WEBHOOK_SECRET;
  if (nonEmpty(modeSecret)) return [modeSecret];
  return nonEmpty(process.env.STRIPE_WEBHOOK_SECRET) ? [process.env.STRIPE_WEBHOOK_SECRET] : [];
};

const constructStripeWebhookEvent = (
  rawBody: string | Buffer,
  signature: string | undefined,
): Stripe.Event => {
  if (!signature) throw new Error('Missing Stripe signature');
  const secrets = webhookSecretsForVerification();
  if (secrets.length === 0) throw new Error('Stripe webhook secret is not configured');

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

export const claimStripeEventForProcessing = async (
  supabase: SupabaseClient,
  stripeEvent: Stripe.Event,
  nowMs = Date.now(),
): Promise<StripeEventRecordResult> => {
  const nowIso = new Date(nowMs).toISOString();
  const staleCutoffIso = new Date(nowMs - 5 * 60 * 1000).toISOString();
  const { error } = await supabase.from('subscription_events').insert({
    user_id: null,
    provider: 'stripe',
    event_type: stripeEvent.type,
    provider_event_id: stripeEvent.id,
    payload: { stripe_event_created: stripeEvent.created },
    livemode: stripeEvent.livemode,
    processing_status: 'received',
    processed_at: nowIso,
  });

  if (!error) return { action: 'process' };
  if (error.code !== '23505') throw new Error(`Failed to record Stripe event: ${error.message}`);

  const { data: existing, error: existingError } = await supabase
    .from('subscription_events')
    .select('processing_status, processed_at')
    .eq('provider', 'stripe')
    .eq('provider_event_id', stripeEvent.id)
    .maybeSingle();
  if (existingError || !existing) throw new Error('Failed to inspect duplicate Stripe event');

  if (existing.processing_status === 'processed' || existing.processing_status === 'ignored') {
    return { action: 'duplicate' };
  }

  const staleReceived =
    existing.processing_status === 'received' &&
    (!existing.processed_at || Date.parse(existing.processed_at) < nowMs - 5 * 60 * 1000);
  if (existing.processing_status === 'failed' || staleReceived) {
    let updateQuery = supabase
      .from('subscription_events')
      .update({
        processing_status: 'received',
        processing_error: null,
        processed_at: nowIso,
      })
      .eq('provider', 'stripe')
      .eq('provider_event_id', stripeEvent.id);

    if (existing.processing_status === 'failed') {
      updateQuery = updateQuery.eq('processing_status', 'failed');
    } else {
      updateQuery = updateQuery.eq('processing_status', 'received');
      updateQuery = existing.processed_at
        ? updateQuery.eq('processed_at', existing.processed_at).lt('processed_at', staleCutoffIso)
        : updateQuery.is('processed_at', null);
    }

    const { data: claimed, error: updateError } = await updateQuery.select('id').maybeSingle();
    if (updateError) throw new Error('Failed to claim Stripe event retry');
    if (!claimed) return { action: 'busy' };
    return { action: 'process' };
  }

  return { action: 'busy' };
};

const recordStripeEventForProcessing = async (
  stripeEvent: Stripe.Event,
): Promise<StripeEventRecordResult> =>
  claimStripeEventForProcessing(getSupabaseServiceClient(), stripeEvent);

export const updateRecordedStripeEvent = async (
  supabase: SupabaseClient,
  stripeEvent: Stripe.Event,
  status: 'processed' | 'ignored' | 'failed',
  payload: Record<string, unknown>,
  processingError: string | null = null,
): Promise<void> => {
  const updateFields: Record<string, unknown> = {
    processing_status: status,
    payload: {
      stripe_event_created: stripeEvent.created,
      ...payload,
    },
    processing_error: processingError,
    processed_at: new Date().toISOString(),
  };
  if (typeof payload.user_id === 'string') {
    updateFields.user_id = payload.user_id;
  }

  const { error } = await supabase
    .from('subscription_events')
    .update(updateFields)
    .eq('provider', 'stripe')
    .eq('provider_event_id', stripeEvent.id);
  if (error) throw new Error(`Failed to update Stripe event: ${error.message}`);
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

export const subscriptionIdFromSchedule = (
  schedule: Pick<Stripe.SubscriptionSchedule, 'subscription' | 'released_subscription'>,
): string | null => {
  const subscription = schedule.subscription;
  if (typeof subscription === 'string') return subscription;
  if (subscription?.id) return subscription.id;
  return schedule.released_subscription ?? null;
};

const markCheckoutIntent = async (
  session: Stripe.Checkout.Session,
  status: 'completed' | 'failed' | 'expired',
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
  return mirrorStripeSubscription(getSupabaseServiceClient(), subscription, { stripe });
};

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let stripeEvent: Stripe.Event;
  try {
    const rawBody: string | Buffer = event.isBase64Encoded
      ? Buffer.from(event.body ?? '', 'base64')
      : (event.body ?? '');
    stripeEvent = constructStripeWebhookEvent(rawBody, getStripeSignature(event.headers));
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid signature' }) };
  }

  try {
    const expectedLivemode = resolveExpectedStripeLivemode();
    if (stripeEvent.livemode !== expectedLivemode) {
      await recordStripeEventForProcessing(stripeEvent);
      await updateRecordedStripeEvent(getSupabaseServiceClient(), stripeEvent, 'ignored', {
        reason: 'livemode_mismatch',
        expected_livemode: expectedLivemode,
      });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Unexpected Stripe livemode' }),
      };
    }

    const record = await recordStripeEventForProcessing(stripeEvent);
    if (record.action === 'duplicate') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ received: true, duplicate: true }),
      };
    }
    if (record.action === 'busy') {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ error: 'Stripe event is already being processed' }),
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
      case 'checkout.session.expired': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        await markCheckoutIntent(session, 'expired');
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
      case 'subscription_schedule.updated':
      case 'subscription_schedule.released':
      case 'subscription_schedule.canceled':
      case 'subscription_schedule.completed': {
        const schedule = stripeEvent.data.object as Stripe.SubscriptionSchedule;
        result = await mirrorSubscriptionById(stripe, subscriptionIdFromSchedule(schedule));
        break;
      }
      default:
        break;
    }

    await updateRecordedStripeEvent(
      getSupabaseServiceClient(),
      stripeEvent,
      result?.kind === 'ignored' ? 'ignored' : 'processed',
      {
        mirror_kind: result?.kind ?? null,
        user_id: result?.userId ?? null,
        reason: result?.reason ?? null,
      },
    );

    return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
  } catch (error) {
    try {
      await updateRecordedStripeEvent(
        getSupabaseServiceClient(),
        stripeEvent,
        'failed',
        {},
        error instanceof Error ? error.message : 'Unknown error',
      );
    } catch {
      // Preserve Stripe retry behavior even if audit update fails.
    }
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
