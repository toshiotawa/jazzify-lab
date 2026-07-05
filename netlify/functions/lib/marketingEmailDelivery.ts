/**
 * ステップメルマガの送信共通ロジック。
 * - 対象はリリース日時以降にオプトインした新規ユーザーのみ（MARKETING_EMAIL_RELEASE_CUTOFF）。
 * - 送信ログ（marketing_email_sends）を先にclaimしてから送ることで重複送信を防ぐ。
 * - 配信停止リンクは userId の HMAC トークンで署名する。
 */

import { createHmac, timingSafeEqual } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import {
  buildMarketingEmail,
  MARKETING_EMAIL_FROM,
  type MarketingEmailKey,
  type MarketingEmailLocale,
  type MarketingEmailPlatform,
} from './marketingEmails';

export const MARKETING_EMAIL_RELEASE_CUTOFF = '2026-07-05T00:00:00Z';

const SITE_BASE_URL = 'https://jazzify.jp';
const REPLY_TO = 'toshiotawa@me.com';

const getSecret = (): string | null => process.env.MARKETING_EMAIL_SECRET ?? null;

export const buildUnsubscribeToken = (userId: string): string | null => {
  const secret = getSecret();
  if (!secret) return null;
  return createHmac('sha256', secret).update(userId).digest('hex');
};

export const verifyUnsubscribeToken = (userId: string, token: string): boolean => {
  const expected = buildUnsubscribeToken(userId);
  if (!expected) return false;
  const expectedBuf = Buffer.from(expected, 'utf8');
  const actualBuf = Buffer.from(token, 'utf8');
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
};

export const buildUnsubscribeUrl = (userId: string): string | null => {
  const token = buildUnsubscribeToken(userId);
  if (!token) return null;
  return `${SITE_BASE_URL}/.netlify/functions/marketingUnsubscribe?uid=${encodeURIComponent(userId)}&token=${token}`;
};

export const resolveMarketingLocale = (
  preferredLocale: string | null,
  country: string | null,
): MarketingEmailLocale => {
  if (preferredLocale === 'en') return 'en';
  if (preferredLocale === 'ja') return 'ja';
  if (country && country.toUpperCase() !== 'JP') return 'en';
  return 'ja';
};

/** signup_platform（'web'|'ios'|null）からメール文面用プラットフォームを解決。不明時はweb扱い */
export const resolveMarketingPlatform = (signupPlatform: string | null): MarketingEmailPlatform =>
  signupPlatform === 'ios' ? 'ios' : 'web';

export interface MarketingEmailRecipient {
  userId: string;
  email: string;
  locale: MarketingEmailLocale;
  includeTrialCta: boolean;
  platform: MarketingEmailPlatform;
}

export type MarketingSendResult = 'sent' | 'already_sent' | 'send_failed' | 'not_configured';

/**
 * 送信ログをclaim（insert）してからResendで送る。
 * insertが重複エラーなら送信済みとしてスキップ。送信失敗時はclaimを削除して次回リトライ可能にする。
 */
export const claimAndSendMarketingEmail = async (
  supabase: SupabaseClient,
  key: MarketingEmailKey,
  recipient: MarketingEmailRecipient,
): Promise<MarketingSendResult> => {
  const resendApiKey = process.env.RESEND_API_KEY;
  const unsubscribeUrl = buildUnsubscribeUrl(recipient.userId);
  if (!resendApiKey || !unsubscribeUrl) {
    console.log('marketing email not configured (RESEND_API_KEY / MARKETING_EMAIL_SECRET), skipping');
    return 'not_configured';
  }

  const { error: claimError } = await supabase
    .from('marketing_email_sends')
    .insert({ user_id: recipient.userId, email_key: key });
  if (claimError) {
    if (claimError.code === '23505') return 'already_sent';
    console.error('marketing email claim failed:', claimError.message);
    return 'send_failed';
  }

  try {
    const content = buildMarketingEmail(key, {
      locale: recipient.locale,
      unsubscribeUrl,
      includeTrialCta: recipient.includeTrialCta,
      platform: recipient.platform,
    });
    const resend = new Resend(resendApiKey);
    const { error: sendError } = await resend.emails.send({
      from: MARKETING_EMAIL_FROM,
      to: recipient.email,
      replyTo: REPLY_TO,
      subject: content.subject,
      html: content.html,
    });
    if (sendError) {
      throw new Error(sendError.message);
    }
    return 'sent';
  } catch (error) {
    console.error(`marketing email send failed (${key}):`, error);
    await supabase
      .from('marketing_email_sends')
      .delete()
      .eq('user_id', recipient.userId)
      .eq('email_key', key);
    return 'send_failed';
  }
};
