/**
 * ステップメルマガの定期送信（Netlify Scheduled Function、netlify.toml で毎時実行）。
 *
 * 設計:
 * - 対象は marketing_email_opt_in=true のユーザーのみ（設計上オプトイン必須）。
 *   Web/iOS 登録のデフォルト ON + Dashboard の MarketingOptInBanner で母数を確保する。
 * - 定期便（day0〜day30）はオプトイン日を起点、行動トリガー便（paywall_nudge /
 *   never_played_5d / dormant_14d）は該当イベントの発生時刻を起点にする。
 * - 付随クエリはすべてオプトイン済みユーザーのIDで絞るため、走査量は BATCH_LIMIT 人ぶんに収まる。
 * - marketing_email_sends を先にclaimする冪等設計（claimAndSendMarketingEmail）。
 *   主キーが (user_id, email_key) なので、どのメールも1ユーザーにつき生涯1通。
 * - 1実行につきユーザーあたり1通のみ。優先度は
 *   trial_start > paywall_nudge > 定期便 > never_played_5d > dormant_14d。
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
const HOUR_MS = 60 * 60 * 1000;
/** 定期便の最終ステップ（day30）を取りこぼさないための走査ウィンドウ */
const DRIP_WINDOW_MS = 35 * DAY_MS;
/**
 * ステップの予定日から大きく遅れた場合は内容が状況に合わなくなるため送らずに飛ばす。
 * これがないと、ステップを増やしたときに既存ユーザーへ過去分がまとめて配信されてしまう。
 * day0 は特典PDFの引き渡しなので対象外。
 */
const STEP_GRACE_DAYS = 3;
/** 同じ人に短時間で複数通が届かないようにする最小間隔（trial_start は即時性を優先して対象外） */
const MIN_SEND_INTERVAL_HOURS = 20;
/** ペイウォール到達の当日中〜翌朝に届く粒度。毎時実行なので時間単位で判定する */
const PAYWALL_NUDGE_AFTER_HOURS = 12;
const NEVER_PLAYED_AFTER_DAYS = 5;
const DORMANT_AFTER_DAYS = 14;
const BATCH_LIMIT = 1000;
/**
 * 休眠判定で引く進捗行の上限。updated_at 降順で引くため、超過時に取りこぼすのは古い行だけで、
 * その場合そのユーザーは判定対象外（送信スキップ）になる。誤送信側には倒れない。
 */
const PROGRESS_ROW_LIMIT = 5000;

const DRIP_SEQUENCE: ReadonlyArray<{ key: MarketingEmailKey; afterDays: number }> = [
  { key: 'day0', afterDays: 0 },
  { key: 'day1', afterDays: 1 },
  { key: 'day2', afterDays: 2 },
  { key: 'day3', afterDays: 3 },
  { key: 'day7', afterDays: 7 },
  { key: 'day14', afterDays: 14 },
  { key: 'day21', afterDays: 21 },
  { key: 'day30', afterDays: 30 },
];

interface OptedInProfileRow {
  id: string;
  email: string;
  preferred_locale: string | null;
  country: string | null;
  signup_platform: string | null;
  marketing_email_opt_in_at: string | null;
  created_at: string;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const parseTime = (value: string | null): number | null => {
  if (!isNonEmptyString(value)) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const fetchActiveSubscriptionUserIds = async (
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  userIds: readonly string[],
): Promise<Set<string>> => {
  if (userIds.length === 0) {
    return new Set();
  }
  const { data, error } = await supabase
    .from('subscriptions')
    .select('user_id')
    .in('user_id', [...userIds])
    .in('entitlement_state', ['active', 'cancelled_but_active_until_end']);
  if (error) {
    return new Set();
  }
  return new Set((data ?? []).map((row) => row.user_id).filter(isNonEmptyString));
};

interface MilestoneSnapshot {
  firstPlayAt: number | null;
  paywallViewAt: number | null;
}

const fetchMilestones = async (
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  userIds: readonly string[],
): Promise<Map<string, MilestoneSnapshot>> => {
  const result = new Map<string, MilestoneSnapshot>();
  if (userIds.length === 0) {
    return result;
  }
  const { data, error } = await supabase
    .from('user_milestones')
    .select('user_id, first_play_at, free_tier_wall_view_at')
    .in('user_id', [...userIds]);
  if (error) {
    return result;
  }
  for (const row of data ?? []) {
    if (!isNonEmptyString(row.user_id)) {
      continue;
    }
    result.set(row.user_id, {
      firstPlayAt: parseTime(row.first_play_at),
      paywallViewAt: parseTime(row.free_tier_wall_view_at),
    });
  }
  return result;
};

/**
 * 進捗テーブルは1ユーザーあたり複数行あるため、休眠判定の候補者だけに絞ってから引く。
 * 全オプトインユーザーぶんを引くと行数上限に当たって最終更新を取り違える可能性がある。
 */
const fetchLastActivityAt = async (
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  userIds: readonly string[],
): Promise<Map<string, number>> => {
  const result = new Map<string, number>();
  if (userIds.length === 0) {
    return result;
  }
  const { data, error } = await supabase
    .from('user_lesson_progress')
    .select('user_id, updated_at')
    .in('user_id', [...userIds])
    .order('updated_at', { ascending: false })
    .limit(PROGRESS_ROW_LIMIT);
  if (error) {
    return result;
  }
  for (const row of data ?? []) {
    if (!isNonEmptyString(row.user_id)) {
      continue;
    }
    const updatedAt = parseTime(row.updated_at);
    if (updatedAt === null) {
      continue;
    }
    const current = result.get(row.user_id);
    if (current === undefined || updatedAt > current) {
      result.set(row.user_id, updatedAt);
    }
  }
  return result;
};

export const handler = async () => {
  const supabase = getSupabaseServiceClient();
  const nowMs = Date.now();
  const results: Record<string, string> = {};
  /** 1実行でユーザーあたり1通に制限するためのガード */
  const sentThisRun = new Set<string>();

  const { data: optedIn, error: optedInError } = await supabase
    .from('profiles')
    .select(
      'id, email, preferred_locale, country, signup_platform, marketing_email_opt_in_at, created_at',
    )
    .eq('marketing_email_opt_in', true)
    .gte('marketing_email_opt_in_at', MARKETING_EMAIL_RELEASE_CUTOFF)
    .limit(BATCH_LIMIT);
  if (optedInError) {
    return { statusCode: 500, body: JSON.stringify({ error: optedInError.message }) };
  }

  const profiles = (optedIn ?? []).filter(
    (row): row is OptedInProfileRow =>
      isNonEmptyString(row.id) && isNonEmptyString(row.email) && isNonEmptyString(row.created_at),
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
  const trialUserIds = (trialRows ?? []).map((row) => row.user_id).filter(isNonEmptyString);
  const trialStarted = new Set(trialUserIds);

  const allUserIds = Array.from(new Set([...profiles.map((p) => p.id), ...trialUserIds]));

  const sentKeys = new Map<string, Set<string>>();
  const lastSentAt = new Map<string, number>();
  if (allUserIds.length > 0) {
    const { data: sends, error: sendsError } = await supabase
      .from('marketing_email_sends')
      .select('user_id, email_key, sent_at')
      .in('user_id', allUserIds);
    if (sendsError) {
      return { statusCode: 500, body: JSON.stringify({ error: sendsError.message }) };
    }
    for (const row of sends ?? []) {
      const set = sentKeys.get(row.user_id) ?? new Set<string>();
      set.add(row.email_key);
      sentKeys.set(row.user_id, set);

      const sentAt = parseTime(row.sent_at);
      const previous = lastSentAt.get(row.user_id);
      if (sentAt !== null && (previous === undefined || sentAt > previous)) {
        lastSentAt.set(row.user_id, sentAt);
      }
    }
  }

  const profileIds = profiles.map((profile) => profile.id);
  const paidUserIds = await fetchActiveSubscriptionUserIds(supabase, profileIds);
  const milestones = await fetchMilestones(supabase, profileIds);

  const send = async (key: MarketingEmailKey, profile: OptedInProfileRow): Promise<void> => {
    const result = await claimAndSendMarketingEmail(supabase, key, {
      userId: profile.id,
      email: profile.email,
      locale: resolveMarketingLocale(profile.preferred_locale, profile.country),
      includeTrialCta: !trialStarted.has(profile.id),
      platform: resolveMarketingPlatform(profile.signup_platform),
    });
    results[`${profile.id}:${key}`] = result;
    sentThisRun.add(profile.id);
  };

  const isPending = (profile: OptedInProfileRow, key: MarketingEmailKey): boolean => {
    if (sentThisRun.has(profile.id) || sentKeys.get(profile.id)?.has(key)) {
      return false;
    }
    const previousSentAt = lastSentAt.get(profile.id);
    return (
      previousSentAt === undefined ||
      nowMs - previousSentAt >= MIN_SEND_INTERVAL_HOURS * HOUR_MS
    );
  };

  // --- trial_start: リリース以降に登録したユーザーで未送信なら送る（オプトイン不要） ---
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
      sentThisRun.add(profile.id);
    }
  }

  // --- paywall_nudge: ペイウォール到達から一定時間・未課金 ---
  for (const profile of profiles) {
    if (!isPending(profile, 'paywall_nudge') || paidUserIds.has(profile.id)) {
      continue;
    }
    const paywallViewAt = milestones.get(profile.id)?.paywallViewAt ?? null;
    if (paywallViewAt === null || nowMs - paywallViewAt < PAYWALL_NUDGE_AFTER_HOURS * HOUR_MS) {
      continue;
    }
    await send('paywall_nudge', profile);
  }

  // --- day0〜day30: 未送信の最も早いdueメールを1通だけ送る ---
  for (const profile of profiles) {
    const optInAt = parseTime(profile.marketing_email_opt_in_at);
    if (optInAt === null || nowMs - optInAt > DRIP_WINDOW_MS) {
      continue;
    }
    const elapsedDays = (nowMs - optInAt) / DAY_MS;

    for (const step of DRIP_SEQUENCE) {
      if (elapsedDays < step.afterDays) break;
      if (!isPending(profile, step.key)) continue;
      if (step.afterDays > 0 && elapsedDays - step.afterDays > STEP_GRACE_DAYS) continue;
      await send(step.key, profile);
      break;
    }
  }

  // --- never_played_5d: 登録から一定日数たっても一度もプレイしていない ---
  for (const profile of profiles) {
    if (!isPending(profile, 'never_played_5d') || paidUserIds.has(profile.id)) {
      continue;
    }
    const createdAt = parseTime(profile.created_at);
    if (createdAt === null || nowMs - createdAt < NEVER_PLAYED_AFTER_DAYS * DAY_MS) {
      continue;
    }
    const firstPlayAt = milestones.get(profile.id)?.firstPlayAt ?? null;
    if (firstPlayAt !== null) {
      continue;
    }
    await send('never_played_5d', profile);
  }

  // --- dormant_14d: プレイ実績はあるが一定期間さわっていない・未課金 ---
  const dormantCandidates = profiles.filter(
    (profile) => isPending(profile, 'dormant_14d') && !paidUserIds.has(profile.id),
  );
  const lastActivityAt = await fetchLastActivityAt(
    supabase,
    dormantCandidates.map((profile) => profile.id),
  );
  for (const profile of dormantCandidates) {
    if (!isPending(profile, 'dormant_14d')) {
      continue;
    }
    const lastAt = lastActivityAt.get(profile.id);
    if (lastAt === undefined || nowMs - lastAt < DORMANT_AFTER_DAYS * DAY_MS) {
      continue;
    }
    await send('dormant_14d', profile);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ processed: Object.keys(results).length, results }),
  };
};
