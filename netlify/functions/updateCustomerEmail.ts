import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // ユーザーのプロフィールからStripe Customer IDを取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
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
          updated_stripe: false
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

    // Supabaseのprofilesテーブルのemailも更新
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ email: newEmail })
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
        message: 'Email updated successfully in both systems',
        updated_stripe: !!profile.stripe_customer_id
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