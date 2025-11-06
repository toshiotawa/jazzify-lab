import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type MembershipRank = 'free' | 'standard' | 'standard_global' | 'premium' | 'platinum' | 'black';

const STRIPE_PRICE_TO_RANK: Record<string, MembershipRank> = {
  [process.env.STRIPE_STANDARD_MONTHLY_PRICE_ID ?? '']: 'standard',
  [process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID ?? '']: 'premium',
  [process.env.STRIPE_PLATINUM_MONTHLY_PRICE_ID ?? '']: 'platinum',
  [process.env.STRIPE_BLACK_MONTHLY_PRICE_ID ?? '']: 'black',
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

// ユーザーIDをStripe Customer IDから取得
const getUserIdFromCustomer = async (customerId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
    
  if (error || !data) {
    console.error('Failed to find user for customer:', customerId, error);
    return null;
  }
  
  return data.id;
};

// サブスクリプション情報を更新
const updateUserSubscription = async (subscription: Stripe.Subscription) => {
  const userId = await getUserIdFromCustomer(subscription.customer as string);
  if (!userId) return;

  try {
    // プラン情報を取得
      const priceId = subscription.items.data[0]?.price.id;
      const newRank = priceId ? await resolveMembershipRank(priceId) : 'free';
    
    // 解約予約の確認
    const willCancel = subscription.cancel_at_period_end;
    const cancelDate = subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null;
    
    // ダウングレード予約の確認（Subscription Scheduleがある場合）
    let downgradeInfo: { downgrade_to: string | null; downgrade_date: string | null } = {
      downgrade_to: null,
      downgrade_date: null
    };
    
    if (subscription.schedule) {
      try {
        const scheduleId = typeof subscription.schedule === 'string'
          ? subscription.schedule
          : subscription.schedule.id;
        if (scheduleId) {
          const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
        const nextPhase = schedule.phases[1]; // 現在=0, 次=1
        
        if (nextPhase) {
          const nextPriceId = nextPhase.items[0]?.price;
          if (nextPriceId) {
            const nextPrice = await stripe.prices.retrieve(nextPriceId as string);
            const nextProduct = await stripe.products.retrieve(nextPrice.product as string);
            downgradeInfo.downgrade_to = getPlanFromStripeProduct(nextProduct);
            downgradeInfo.downgrade_date = new Date(nextPhase.start_date * 1000).toISOString();
          }
        }
        }
      } catch (scheduleError) {
        console.error('Error fetching subscription schedule:', scheduleError);
      }
    }

    // データベースを更新
    const { error } = await supabase
      .from('profiles')
      .update({
        rank: newRank,
        will_cancel: willCancel,
        cancel_date: cancelDate,
        downgrade_to: downgradeInfo.downgrade_to,
        downgrade_date: downgradeInfo.downgrade_date,
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user subscription:', error);
    } else {
      console.log(`Updated user ${userId} subscription to ${newRank}`);
    }
  } catch (error) {
    console.error('Error in updateUserSubscription:', error);
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
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        await updateUserSubscription(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const userId = await getUserIdFromCustomer(subscription.customer as string);
        
        if (userId) {
          // サブスクリプション削除時はフリープランに戻す
          const { error } = await supabase
            .from('profiles')
            .update({
              rank: 'free',
              will_cancel: false,
              cancel_date: null,
              downgrade_to: null,
              downgrade_date: null,
            })
            .eq('id', userId);

          if (error) {
            console.error('Error resetting user to free plan:', error);
          } else {
            console.log(`Reset user ${userId} to free plan`);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          // 支払い成功時は現在のサブスクリプション情報を再取得して更新
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await updateUserSubscription(subscription);
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
        // インボイス作成時（トライアル終了時に初回インボイスが作成される）
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        if (invoice.subscription && invoice.billing_reason === 'subscription_create') {
          // トライアル終了時の初回インボイス作成を検知
          console.log(`Invoice created for subscription: ${invoice.subscription}`);
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