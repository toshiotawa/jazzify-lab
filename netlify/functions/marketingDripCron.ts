/**
 * ステップメルマガの定期送信（Netlify Scheduled Function、netlify.toml で毎時実行）。
 *
 * 設計:
 * - 対象はリリース以降にオプトインした新規ユーザーのみ（day0〜day3）と、
 *   リリース以降に登録しトライアルを開始したユーザー（trial_start。オプトイン不問の利用案内）。
 * - 抽出はオプトイン後7日間のウィンドウで有界（ドリップは3日で完了するため十分な余裕）。
 * - marketing_email_sends を先にclaimする冪等設計（claimAndSendMarketingEmail）。
 * - 1実行につきユーザーあたり1通のみ（順序保証: day0 → day1 → day2 → day3）。
 * - トライアル開始済み（subscriptions.trial_used）のユーザーには day3 のトライアルCTAを出さない。
 * - 途中で配信停止した人は marketing_email_opt_in = false になるため抽出から自然に外れる。
 */

import { getSupabaseServiceClient } from './lib/lemonNetlifyCommon';
import {
  claimAndSendMarketingEmail,
  MARKETING_EMAIL_RELEASE_CUTOFF,
  resolveMarketingLocale,
  resolveMarketingPlatform,
} from './lib/marketingEmailDelivery';
import type { MarketingEmailKey } from './lib/marketingEmails';

const DAY_MS = 24 * 60 * 60 * 1000;
const DRIP_WINDOW_MS = 7 * DAY_MS;
const BATCH_LIMIT = 1000;

const DRIP_SEQUENCE: ReadonlyArray<{ key: MarketingEmailKey; afterDays: number }> = [
  { key: 'day0', afterDays: 0 },
  { key: 'day1', afterDays: 1 },
  { key: 'day2', afterDays: 2 },
  { key: 'day3', afterDays: 3 },
];

interface DripProfileRow {
  id: string;
  email: string;
  preferred_locale: string | null;
  country: string | null;
  signup_platform: string | null;
  marketing_email_opt_in_at: string;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

export const handler = async () => {
  const supabase = getSupabaseServiceClient();
  const nowMs = Date.now();
  const results: Record<string, string> = {};

  // --- day0〜day3: オプトイン済み新規ユーザー（オプトイン後7日間のみスキャン） ---
  const windowStart = new Date(nowMs - DRIP_WINDOW_MS).toISOString();
  const dripCutoff =
    windowStart > MARKETING_EMAIL_RELEASE_CUTOFF ? windowStart : MARKETING_EMAIL_RELEASE_CUTOFF;
  const { data: optedIn, error: optedInError } = await supabase
    .from('profiles')
    .select('id, email, preferred_locale, country, signup_platform, marketing_email_opt_in_at')
    .eq('marketing_email_opt_in', true)
    .gte('marketing_email_opt_in_at', dripCutoff)
    .limit(BATCH_LIMIT);
  if (optedInError) {
    return { statusCode: 500, body: JSON.stringify({ error: optedInError.message }) };
  }

  const dripProfiles = (optedIn ?? []).filter(
    (row): row is DripProfileRow =>
      isNonEmptyString(row.id) &&
      isNonEmptyString(row.email) &&
      isNonEmptyString(row.marketing_email_opt_in_at),
  );

  // --- trial_start: トライアル開始済みユーザー ---
  // Lemonは trial_used_at を持つが Apple(iOS) は trial_used のみのため、
  // trial_used_at がリリース以降 or NULL を候補にし、後段で profiles.created_at >= リリース で絞る。
  const { data: trialRows, error: trialRowsError } = await supabase
    .from('subscriptions')
    .select('user_id, trial_used_at')
    .eq('trial_used', true)
    .or(`trial_used_at.is.null,trial_used_at.gte.${MARKETING_EMAIL_RELEASE_CUTOFF}`)
    .limit(BATCH_LIMIT);
  if (trialRowsError) {
    return { statusCode: 500, body: JSON.stringify({ error: trialRowsError.message }) };
  }
  const trialUserIds = (trialRows ?? [])
    .map((row) => row.user_id)
    .filter(isNonEmptyString);

  const allUserIds = Array.from(new Set([...dripProfiles.map((p) => p.id), ...trialUserIds]));
  if (allUserIds.length === 0) {
    return { statusCode: 200, body: JSON.stringify({ processed: 0 }) };
  }

  const { data: sends, error: sendsError } = await supabase
    .from('marketing_email_sends')
    .select('user_id, email_key')
    .in('user_id', allUserIds);
  if (sendsError) {
    return { statusCode: 500, body: JSON.stringify({ error: sendsError.message }) };
  }
  const sentKeys = new Map<string, Set<string>>();
  for (const row of sends ?? []) {
    const set = sentKeys.get(row.user_id) ?? new Set<string>();
    set.add(row.email_key);
    sentKeys.set(row.user_id, set);
  }
  const trialStarted = new Set(trialUserIds);

  // day0〜day3: 未送信の最も早いdueメールを1通だけ送る
  for (const profile of dripProfiles) {
    const optInAt = Date.parse(profile.marketing_email_opt_in_at);
    if (Number.isNaN(optInAt)) continue;
    const elapsedDays = (nowMs - optInAt) / DAY_MS;
    const sent = sentKeys.get(profile.id);

    for (const step of DRIP_SEQUENCE) {
      if (elapsedDays < step.afterDays) break;
      if (sent?.has(step.key)) continue;
      const result = await claimAndSendMarketingEmail(supabase, step.key, {
        userId: profile.id,
        email: profile.email,
        locale: resolveMarketingLocale(profile.preferred_locale, profile.country),
        includeTrialCta: step.key === 'day3' && !trialStarted.has(profile.id),
        platform: resolveMarketingPlatform(profile.signup_platform),
      });
      results[`${profile.id}:${step.key}`] = result;
      break;
    }
  }

  // trial_start: リリース以降に登録したユーザーで未送信なら送る
  const trialPendingIds = trialUserIds.filter((id) => !sentKeys.get(id)?.has('trial_start'));
  if (trialPendingIds.length > 0) {
    const { data: trialProfiles, error: trialProfilesError } = await supabase
      .from('profiles')
      .select('id, email, preferred_locale, country, signup_platform')
      .in('id', trialPendingIds)
      .gte('created_at', MARKETING_EMAIL_RELEASE_CUTOFF);
    if (trialProfilesError) {
      return { statusCode: 500, body: JSON.stringify({ error: trialProfilesError.message }) };
    }
    for (const profile of trialProfiles ?? []) {
      if (!isNonEmptyString(profile.id) || !isNonEmptyString(profile.email)) continue;
      const result = await claimAndSendMarketingEmail(supabase, 'trial_start', {
        userId: profile.id,
        email: profile.email,
        locale: resolveMarketingLocale(profile.preferred_locale, profile.country),
        includeTrialCta: false,
        platform: resolveMarketingPlatform(profile.signup_platform),
      });
      results[`${profile.id}:trial_start`] = result;
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ processed: Object.keys(results).length, results }),
  };
};
