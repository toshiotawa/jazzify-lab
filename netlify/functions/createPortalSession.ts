import type { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { resolveSiteUrl } from './utils/resolveSiteUrl';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY が設定されていません');
}

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

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export const handler: Handler = async (event, _context) => {
  // CORS headers
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
    const siteUrl = resolveSiteUrl(event.headers);
    if (!siteUrl) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Site URL is not configured. Please set SITE_URL or DEPLOY_URL.',
        }),
      };
    }

    // Authorization headerからJWTトークンを取得
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header required' }),
      };
    }

    // JWTトークンを使用してユーザーを認証
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // ユーザープロフィールを取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, country')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch user profile' }),
      };
    }

    const normalizedCountry = profile?.country ? String(profile.country).trim().toUpperCase() : null;
    if (
      normalizedCountry &&
      normalizedCountry !== 'JP' &&
      normalizedCountry !== 'JPN' &&
      normalizedCountry !== 'JAPAN'
    ) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Stripe customer portal is available only for Japan users' }),
      };
    }

    if (!profile.stripe_customer_id) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Stripe customer not found' }),
      };
    }

    // Customer Portal Sessionを作成
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl}/#account`,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        url: portalSession.url,
      }),
    };
  } catch (error) {
    console.error('Error creating portal session:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message,
      }),
    };
  }
};
