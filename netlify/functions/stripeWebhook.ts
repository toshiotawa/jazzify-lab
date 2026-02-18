import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is required.');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

const supabaseUrl =
  process.env.SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  process.env.SUPABASE_SERVICE_ROLE_URL;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL (or VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_URL) is required.');
}

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

type MembershipRank = 'free' | 'standard' | 'standard_global' | 'premium' | 'platinum' | 'black';

const STRIPE_PRICE_TO_RANK: Record<string, MembershipRank> = {
  [process.env.STRIPE_STANDARD_MONTHLY_PRICE_ID ?? '']: 'standard',
  [process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID ?? '']: 'premium',
  [process.env.STRIPE_PLATINUM_MONTHLY_PRICE_ID ?? '']: 'platinum',
  [process.env.STRIPE_BLACK_MONTHLY_PRICE_ID ?? '']: 'black',
};

type CustomerProfileRow = {
  id: string;
  stripe_trial_start: string | null;
  stripe_trial_end: string | null;
};

const getProfileByCustomerId = async (customerId: string): Promise<CustomerProfileRow | null> => {
  const { data, error } = await supabase
    .from<CustomerProfileRow>('profiles')
    .select('id, stripe_trial_start, stripe_trial_end')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error || !data) {
    console.error('Failed to find user for customer:', customerId, error);
    return null;
  }

  return data;
};

const SUPPORTIVE_NAME_PATTERNS: Array<{ pattern: RegExp; rank: MembershipRank }> = [
  { pattern: /standard|スタンダード|ベーシック/i, rank: 'standard' },
  { pattern: /premium|プレミアム/i, rank: 'premium' },
  { pattern: /platinum|プラチナ/i, rank: 'platinum' },
  { pattern: /black|ブラック/i, rank: 'black' },
];

const getPlanFromStripeMetadata = (product: Stripe.Product | null): MembershipRank | null => {
  if (!product) {
    return null;
  }

  const metadataRank = product.metadata?.membership_rank;
  if (metadataRank && ['free', 'standard', 'standard_global', 'premium', 'platinum', 'black'].includes(metadataRank)) {
    return metadataRank as MembershipRank;
  }

  const name = product.name || '';
  for (const { pattern, rank } of SUPPORTIVE_NAME_PATTERNS) {
    if (pattern.test(name)) {
      return rank;
    }
  }

  return null;
};

const resolveMembershipRank = async (priceId: string): Promise<MembershipRank> => {
  const normalizedPriceId = priceId.trim();

  const rankFromEnv = STRIPE_PRICE_TO_RANK[normalizedPriceId];
  if (rankFromEnv && rankFromEnv !== 'free') {
    return rankFromEnv;
  }

  try {
    const price = await stripe.prices.retrieve(normalizedPriceId);
    const productId = price.product;
    if (typeof productId === 'string') {
      const product = await stripe.products.retrieve(productId);
      const inferredRank = getPlanFromStripeMetadata(product);
      if (inferredRank) {
        return inferredRank;
      }
    }
  } catch (error) {
    console.error('Failed to resolve rank from price/product metadata:', error);
  }

  return 'free';
};

const toIsoStringOrNull = (unixSeconds: number | null | undefined): string | null => {
  if (typeof unixSeconds !== 'number') {
    return null;
  }

  return new Date(unixSeconds * 1000).toISOString();
};

const parseIsoToMs = (value: string | null | undefined): number | null => {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return timestamp;
};

// サブスクリプション情報を更新
const updateUserSubscription = async (
  subscription: Stripe.Subscription,
  existingProfile?: CustomerProfileRow | null
) => {
  const profile =
    existingProfile ?? (await getProfileByCustomerId(subscription.customer as string));
  if (!profile) {
    return;
  }

  try {
    const priceId = subscription.items.data[0]?.price.id;
    const newRank = priceId ? await resolveMembershipRank(priceId) : 'free';

    const willCancel = subscription.cancel_at_period_end;
    const cancelDate = toIsoStringOrNull(subscription.cancel_at);

    let downgradeInfo: { downgrade_to: MembershipRank | null; downgrade_date: string | null } = {
      downgrade_to: null,
      downgrade_date: null,
    };

    if (subscription.schedule) {
      try {
        const scheduleId =
          typeof subscription.schedule === 'string'
            ? subscription.schedule
            : subscription.schedule.id;
        if (scheduleId) {
          const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
          const nextPhase = schedule.phases[1];

          if (nextPhase) {
            const nextPriceId = nextPhase.items[0]?.price;
            if (nextPriceId) {
              const nextPrice = await stripe.prices.retrieve(nextPriceId as string);
              const nextProduct = await stripe.products.retrieve(nextPrice.product as string);
              downgradeInfo = {
                downgrade_to: getPlanFromStripeMetadata(nextProduct),
                downgrade_date: toIsoStringOrNull(nextPhase.start_date),
              };
            }
          }
        }
      } catch (scheduleError) {
        console.error('Error fetching subscription schedule:', scheduleError);
      }
    }

    const trialStartIso =
      toIsoStringOrNull(subscription.trial_start) ?? profile.stripe_trial_start ?? null;
    const trialEndIso =
      toIsoStringOrNull(subscription.trial_end) ?? profile.stripe_trial_end ?? null;

    const { error } = await supabase
      .from('profiles')
      .update({
        rank: newRank,
        will_cancel: willCancel,
        cancel_date: cancelDate,
        downgrade_to: downgradeInfo.downgrade_to,
        downgrade_date: downgradeInfo.downgrade_date,
        stripe_trial_start: trialStartIso,
        stripe_trial_end: trialEndIso,
      })
      .eq('id', profile.id);

    if (error) {
      console.error('Error updating user subscription:', error);
    } else {
      console.log(`Updated user ${profile.id} subscription to ${newRank}`);
    }
  } catch (error) {
    console.error('Error in updateUserSubscription:', error);
  }
};

const PLATINUM_OR_BLACK: ReadonlySet<MembershipRank> = new Set(['platinum', 'black']);

const addBlockUnlockCreditsIfEligible = async (
  subscription: Stripe.Subscription,
  billingReason: string | null
) => {
  const profile = await getProfileByCustomerId(subscription.customer as string);
  if (!profile) return;

  const priceId = subscription.items.data[0]?.price.id;
  const rank = priceId ? await resolveMembershipRank(priceId) : 'free';

  if (!PLATINUM_OR_BLACK.has(rank)) return;

  const isNewOrRenewal =
    billingReason === 'subscription_create' ||
    billingReason === 'subscription_cycle';

  if (!isNewOrRenewal) return;

  const { error } = await supabase.rpc('add_block_unlock_credits', {
    p_user_id: profile.id,
    p_credits: 10,
  });

  if (error) {
    console.error('Error adding block unlock credits:', error);
  } else {
    console.log(`Added 10 block unlock credits for user ${profile.id} (reason: ${billingReason})`);
  }
};

const cancelInvoiceDuringTrial = async (
  invoiceRef: string | Stripe.Invoice | null | undefined,
  preservedTrialEndMs: number
) => {
  if (!invoiceRef || preservedTrialEndMs <= Date.now()) {
    return;
  }

  let invoice: Stripe.Invoice | null = null;

  if (typeof invoiceRef === 'string') {
    try {
      invoice = await stripe.invoices.retrieve(invoiceRef);
    } catch (error) {
      console.error('Failed to retrieve invoice for trial preservation:', error);
      return;
    }
  } else {
    invoice = invoiceRef ?? null;
  }

  if (!invoice) {
    return;
  }

  if (invoice.amount_due <= 0) {
    return;
  }

  try {
    if (invoice.status === 'draft') {
      await stripe.invoices.delete(invoice.id);
      console.log(`Deleted draft invoice ${invoice.id} during trial preservation`);
      return;
    }

    if (invoice.status === 'open') {
      await stripe.invoices.voidInvoice(invoice.id);
      console.log(`Voided open invoice ${invoice.id} during trial preservation`);
      return;
    }

    if (invoice.status === 'uncollectible') {
      await stripe.invoices.markUncollectible(invoice.id);
      console.log(`Marked invoice ${invoice.id} as uncollectible during trial preservation`);
      return;
    }

    if (invoice.status === 'paid') {
      const paymentIntentId =
        typeof invoice.payment_intent === 'string'
          ? invoice.payment_intent
          : invoice.payment_intent?.id ?? null;

      if (paymentIntentId) {
        const refundAmount = invoice.amount_paid && invoice.amount_paid > 0 ? invoice.amount_paid : null;
        await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: refundAmount ?? undefined,
        });
        console.log(`Refund initiated for invoice ${invoice.id} due to trial preservation`);
      } else {
        console.warn(`Invoice ${invoice.id} was paid but no payment intent found for refund.`);
      }
    }
  } catch (invoiceError) {
    console.error('Failed to cancel or refund invoice during trial preservation:', invoiceError);
  }
};

const restoreTrialIfNecessary = async (
  subscription: Stripe.Subscription,
  previousAttributes?: Partial<Stripe.Subscription> | null
): Promise<{ subscription: Stripe.Subscription; profile: CustomerProfileRow | null }> => {
  const profile = await getProfileByCustomerId(subscription.customer as string);
  if (!profile) {
    return { subscription, profile: null };
  }

  const nowMs = Date.now();
  const currentTrialEndMs =
    typeof subscription.trial_end === 'number' ? subscription.trial_end * 1000 : null;

  if (currentTrialEndMs && currentTrialEndMs > nowMs) {
    return { subscription, profile };
  }

  const storedTrialEndMs = parseIsoToMs(profile.stripe_trial_end);
  const previousTrialEndMs =
    previousAttributes && typeof previousAttributes.trial_end === 'number'
      ? previousAttributes.trial_end * 1000
      : null;
  const metadataTrialEndMs = parseIsoToMs(subscription.metadata?.original_trial_end ?? null);
  const previousMetadataTrialEndMs =
    previousAttributes &&
    previousAttributes.metadata &&
    typeof previousAttributes.metadata === 'object' &&
    previousAttributes.metadata !== null
      ? parseIsoToMs(
          (previousAttributes.metadata as Record<string, string | null | undefined>).original_trial_end
        )
      : null;

  const preservedCandidates = [
    storedTrialEndMs,
    previousTrialEndMs,
    metadataTrialEndMs,
    previousMetadataTrialEndMs,
  ].filter(
    (value): value is number => typeof value === 'number' && !Number.isNaN(value) && value > nowMs
  );

  if (preservedCandidates.length === 0) {
    return { subscription, profile };
  }

  const preservedTrialEndMs = Math.max(...preservedCandidates);
  const preservedTrialEndIso = new Date(preservedTrialEndMs).toISOString();
  const currentTrialMatches =
    currentTrialEndMs !== null && Math.abs(currentTrialEndMs - preservedTrialEndMs) <= 1000;
  const metadataMatches = metadataTrialEndMs
    ? Math.abs(metadataTrialEndMs - preservedTrialEndMs) <= 1000
    : subscription.metadata?.original_trial_end === preservedTrialEndIso;

  if (currentTrialMatches && metadataMatches) {
    return { subscription, profile };
  }

  const updateParams: Stripe.SubscriptionUpdateParams = {
    metadata: {
      ...(subscription.metadata ?? {}),
      original_trial_end: preservedTrialEndIso,
    },
    proration_behavior: 'none',
    payment_behavior: 'allow_incomplete',
  };

  if (!currentTrialMatches) {
    updateParams.trial_end = Math.floor(preservedTrialEndMs / 1000);
  }

  try {
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, updateParams);

    await cancelInvoiceDuringTrial(updatedSubscription.latest_invoice, preservedTrialEndMs);

    return { subscription: updatedSubscription, profile };
  } catch (error) {
    console.error('Failed to restore trial period during subscription update:', error);
    return { subscription, profile };
  }
};

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

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

  // 署名ヘッダー（大小混在に対応）
  const signature =
    event.headers['stripe-signature'] ||
    event.headers['Stripe-Signature'] ||
    event.headers['STRIPE-SIGNATURE'];

  let stripeEvent: Stripe.Event;

  try {
    // Webhookの署名検証（生ボディ必須）
    const rawBody: string | Buffer = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : event.body;

    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      signature as string,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid signature' }),
    };
  }

  try {
    // イベントタイプに応じて処理
    switch (stripeEvent.type) {
      case 'customer.subscription.created': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const { subscription: reconciledSubscription, profile } = await restoreTrialIfNecessary(
          subscription,
          null
        );
        await updateUserSubscription(reconciledSubscription, profile);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const previousAttributes = (stripeEvent.data.previous_attributes ??
          null) as Partial<Stripe.Subscription> | null;
        const { subscription: reconciledSubscription, profile } = await restoreTrialIfNecessary(
          subscription,
          previousAttributes
        );
        await updateUserSubscription(reconciledSubscription, profile);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const profile = await getProfileByCustomerId(subscription.customer as string);

        if (profile) {
          const preservedTrialEndMs = parseIsoToMs(profile.stripe_trial_end);
          const shouldClearTrial = !preservedTrialEndMs || preservedTrialEndMs <= Date.now();
          const updatePayload = {
            rank: 'free' as MembershipRank,
            will_cancel: false,
            cancel_date: null,
            downgrade_to: null as MembershipRank | null,
            downgrade_date: null as string | null,
            stripe_trial_start: shouldClearTrial ? null : profile.stripe_trial_start,
            stripe_trial_end: shouldClearTrial ? null : profile.stripe_trial_end,
          };
          const { error } = await supabase
            .from('profiles')
            .update(updatePayload)
            .eq('id', profile.id);

          if (error) {
            console.error('Error resetting user to free plan:', error);
          } else {
            console.log(`Reset user ${profile.id} to free plan`);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await updateUserSubscription(subscription);
          await addBlockUnlockCreditsIfEligible(subscription, invoice.billing_reason ?? null);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        console.log(`Payment failed for invoice: ${invoice.id}`);
        // 必要に応じて支払い失敗時の処理を追加
        break;
      }

      case 'checkout.session.completed': {
        // チェックアウト完了時、サブスクリプションを即座に反映
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        if (session.subscription && typeof session.subscription === 'string') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await updateUserSubscription(subscription);
        }
        break;
      }

      case 'customer.subscription.trial_will_end': {
        // トライアル終了3日前の通知（必要に応じて顧客に通知など）
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        console.log(`Trial will end soon for subscription: ${subscription.id}`);
        // 必要に応じて顧客への通知処理を追加
        break;
      }

      case 'invoice.created': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id ?? null;

        if (
          customerId &&
          billingReasonAllowsTrialCancellation(invoice.billing_reason ?? null)
        ) {
          const profile = await getProfileByCustomerId(customerId);
          const preservedTrialEndMs = parseIsoToMs(profile?.stripe_trial_end ?? null);
          if (preservedTrialEndMs && preservedTrialEndMs > Date.now()) {
            await cancelInvoiceDuringTrial(invoice, preservedTrialEndMs);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
    };
  }
};