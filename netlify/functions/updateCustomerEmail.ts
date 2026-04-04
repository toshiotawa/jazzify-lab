import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** `lemonsqueezyResolveLink` と同じくストア内メールで顧客 ID を解決 */
async function resolveLemonCustomerIdByEmail(email: string): Promise<string | null> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!apiKey || !storeId) return null;

  const url = new URL('https://api.lemonsqueezy.com/v1/customers');
  url.searchParams.set('filter[store_id]', storeId);
  url.searchParams.set('filter[email]', email);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/vnd.api+json',
    },
  });
  if (!res.ok) return null;
  const json = await res.json();
  const first = json?.data?.[0];
  return first?.id != null ? String(first.id) : null;
}

/** https://docs.lemonsqueezy.com/api/customers/update-customer */
async function patchLemonCustomerEmail(customerId: string, newEmail: string): Promise<void> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    throw new Error('LEMONSQUEEZY_API_KEY is not configured');
  }

  const res = await fetch(`https://api.lemonsqueezy.com/v1/customers/${encodeURIComponent(customerId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    },
    body: JSON.stringify({
      data: {
        type: 'customers',
        id: customerId,
        attributes: {
          email: newEmail,
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Lemon Squeezy PATCH customer failed (${res.status}): ${body}`);
  }
}

export const handler = async (event, _context) => {
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

  try {
    // Authorization ヘッダーからJWTトークンを取得
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Missing authorization token' }),
      };
    }

    const token = authHeader.substring(7);
    
    // Supabaseでトークンを検証
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    // リクエストボディから新しいメールアドレスを取得
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    const { email: newEmail } = body;

    if (!newEmail || typeof newEmail !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email is required' }),
      };
    }

    // メールアドレスの形式をチェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail) || newEmail.length > 254) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid email format' }),
      };
    }

    // ユーザーのプロフィールから課金プロバイダー ID を取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, lemon_customer_id, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User profile not found' }),
      };
    }

    // 冪等性チェック：既に同じメールアドレスの場合
    if (profile.email === newEmail) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true,
          message: 'Email is already up to date',
          updated_stripe: false,
          updated_lemon: false,
        }),
      };
    }

    // Stripe Customer IDが存在する場合のみStripeを更新
    if (profile.stripe_customer_id) {
      try {
        await stripe.customers.update(profile.stripe_customer_id, {
          email: newEmail
        });
        
        console.log(`Updated Stripe customer ${profile.stripe_customer_id} email to ${newEmail}`);
      } catch (stripeError) {
        console.error('Error updating Stripe customer email:', stripeError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to update customer email in billing system',
            details: stripeError.message 
          }),
        };
      }
    }

    // Lemon Squeezy: 顧客メールを同期（ID 優先、なければ変更前メールで検索）
    let lemonCustomerId =
      profile.lemon_customer_id != null && String(profile.lemon_customer_id).trim() !== ''
        ? String(profile.lemon_customer_id).trim()
        : null;
    let updatedLemon = false;

    if (!lemonCustomerId && profile.email) {
      lemonCustomerId = await resolveLemonCustomerIdByEmail(profile.email);
    }

    if (lemonCustomerId) {
      if (!process.env.LEMONSQUEEZY_API_KEY) {
        console.warn(
          'Lemon customer id present but LEMONSQUEEZY_API_KEY not set; skipping Lemon email sync',
        );
      } else {
        try {
          await patchLemonCustomerEmail(lemonCustomerId, newEmail);
          updatedLemon = true;
          console.log(`Updated Lemon Squeezy customer ${lemonCustomerId} email to ${newEmail}`);
        } catch (lemonError) {
          console.error('Error updating Lemon Squeezy customer email:', lemonError);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              error: 'Failed to update customer email in Lemon Squeezy',
              details: lemonError instanceof Error ? lemonError.message : String(lemonError),
            }),
          };
        }
      }
    }

    // Supabaseのprofilesテーブルのemail（および新規に解決した lemon_customer_id）を更新
    const profilePatch: { email: string; lemon_customer_id?: string } = { email: newEmail };
    if (lemonCustomerId && !profile.lemon_customer_id) {
      profilePatch.lemon_customer_id = lemonCustomerId;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(profilePatch)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile email:', updateError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to update profile email',
          details: updateError.message 
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'Email updated successfully',
        updated_stripe: !!profile.stripe_customer_id,
        updated_lemon: updatedLemon,
      }),
    };

  } catch (error) {
    console.error('Error in updateCustomerEmail:', error);
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