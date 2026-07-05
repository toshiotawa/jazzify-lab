/**
 * 登録直後メール（day0・PDF配布）。
 * プロフィール作成完了後にクライアントからfire-and-forgetで呼ばれる。
 * 失敗しても marketingDripCron が1時間以内に day0 を拾うため、ここではベストエフォートでよい。
 */

import type { Handler } from '@netlify/functions';
import { authenticateRequest } from './lib/lemonNetlifyCommon';
import {
  claimAndSendMarketingEmail,
  resolveMarketingLocale,
  resolveMarketingPlatform,
} from './lib/marketingEmailDelivery';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const auth = await authenticateRequest(event.headers.authorization);
  if ('error' in auth) {
    return { statusCode: auth.statusCode, headers, body: JSON.stringify({ error: auth.error }) };
  }
  const { supabase, userId } = auth;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, preferred_locale, country, signup_platform, marketing_email_opt_in')
    .eq('id', userId)
    .maybeSingle();
  if (profileError || !profile) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch profile' }) };
  }
  if (!profile.marketing_email_opt_in || !profile.email) {
    return { statusCode: 200, headers, body: JSON.stringify({ result: 'skipped_not_opted_in' }) };
  }

  const result = await claimAndSendMarketingEmail(supabase, 'day0', {
    userId,
    email: profile.email,
    locale: resolveMarketingLocale(profile.preferred_locale, profile.country),
    includeTrialCta: false,
    platform: resolveMarketingPlatform(profile.signup_platform),
  });

  return { statusCode: 200, headers, body: JSON.stringify({ result }) };
};
