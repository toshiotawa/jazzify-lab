#!/usr/bin/env node
/**
 * Jazzify 週次スナップショット → growth/data/YYYY-Www.json
 *
 * 必要: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const isoWeek = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

/** 集計は PostgREST 経由。ページ上限に達したら黙って欠けるため件数を明示的に確認する。 */
const ROW_LIMIT = 10000;

const unwrap = (label, { data, error, count }) => {
  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }
  if (Array.isArray(data) && data.length >= ROW_LIMIT) {
    throw new Error(`${label}: 取得件数が上限 ${ROW_LIMIT} に達した。ページングを実装すること`);
  }
  return count ?? data;
};

async function fetchOverview() {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const profileTotal = unwrap(
    'profiles count',
    await supabase.from('profiles').select('*', { count: 'exact', head: true }),
  );

  const recentProfiles = unwrap(
    'recent profiles',
    await supabase
      .from('profiles')
      .select('id, signup_platform, marketing_email_opt_in, first_touch_captured_at, first_touch_utm_source, created_at')
      .gte('created_at', weekAgo)
      .limit(ROW_LIMIT),
  );

  const billingActive = unwrap(
    'active subscriptions',
    await supabase
      .from('billing_subscriptions')
      .select('id, status, plan_code, provider')
      .eq('status', 'active')
      .limit(ROW_LIMIT),
  );

  const milestones = unwrap(
    'user milestones',
    await supabase
      .from('user_milestones')
      .select('user_id, free_tier_wall_view_at, free_tier_wall_view_source, checkout_click_at, checkout_click_source, trial_start_at, paid_at')
      .limit(ROW_LIMIT),
  );

  const recentIds = new Set((recentProfiles ?? []).map((p) => p.id));
  const recentMilestones = (milestones ?? []).filter((m) => recentIds.has(m.user_id));

  const recentCount = recentProfiles?.length ?? 0;
  const captured = (recentProfiles ?? []).filter((p) => p.first_touch_captured_at).length;
  const optIn = (recentProfiles ?? []).filter((p) => p.marketing_email_opt_in === true).length;

  const funnel = {
    signups: recentCount,
    paywall_view: recentMilestones.filter((m) => m.free_tier_wall_view_at).length,
    checkout_click: recentMilestones.filter((m) => m.checkout_click_at).length,
    trial_start: recentMilestones.filter((m) => m.trial_start_at).length,
    paid: recentMilestones.filter((m) => m.paid_at).length,
  };

  const paywallBySource = {};
  for (const m of recentMilestones) {
    if (!m.free_tier_wall_view_at) continue;
    const src = m.free_tier_wall_view_source ?? '(unknown)';
    paywallBySource[src] = paywallBySource[src] ?? { view: 0, checkout: 0, trial: 0 };
    paywallBySource[src].view += 1;
    if (m.checkout_click_at) paywallBySource[src].checkout += 1;
    if (m.trial_start_at) paywallBySource[src].trial += 1;
  }

  const utmBreakdown = {};
  for (const p of recentProfiles ?? []) {
    const key = p.first_touch_utm_source ?? '(none)';
    utmBreakdown[key] = (utmBreakdown[key] ?? 0) + 1;
  }

  return {
    queried_at: new Date().toISOString(),
    period_days: 7,
    profiles_total: profileTotal ?? 0,
    billing_active: billingActive ?? [],
    recent: {
      signups: recentCount,
      attribution_capture_rate: recentCount ? Number((100 * captured / recentCount).toFixed(1)) : 0,
      marketing_opt_in_rate: recentCount ? Number((100 * optIn / recentCount).toFixed(1)) : 0,
      funnel,
      conversion_rates: {
        trial_start_pct: recentCount ? Number((100 * funnel.trial_start / recentCount).toFixed(2)) : 0,
        paywall_view_pct: recentCount ? Number((100 * funnel.paywall_view / recentCount).toFixed(1)) : 0,
        checkout_from_paywall_pct: funnel.paywall_view
          ? Number((100 * funnel.checkout_click / funnel.paywall_view).toFixed(1))
          : 0,
      },
      utm_breakdown: utmBreakdown,
      paywall_by_source: paywallBySource,
      platform: (recentProfiles ?? []).reduce((acc, p) => {
        const k = p.signup_platform ?? '(null)';
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      }, {}),
    },
  };
}

async function main() {
  const week = isoWeek();
  const snapshot = await fetchOverview();
  const outDir = path.join(__dirname, 'data');
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `${week}.json`);
  await writeFile(outPath, `${JSON.stringify({ week, ...snapshot }, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(JSON.stringify(snapshot.recent, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
