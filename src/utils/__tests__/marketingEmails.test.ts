import { describe, expect, it } from 'vitest';
import {
  buildMarketingEmail,
  type MarketingEmailKey,
} from '../../../netlify/functions/lib/marketingEmails';

const UNSUBSCRIBE_URL = 'https://jazzify.jp/.netlify/functions/marketingUnsubscribe?uid=u1&token=t1';
/** 本文中では & が HTML エスケープされるため、エスケープに依存しない部分で照合する */
const UNSUBSCRIBE_MARKER = 'marketingUnsubscribe?uid=u1';

const ALL_KEYS: readonly MarketingEmailKey[] = [
  'day0',
  'day1',
  'day2',
  'day3',
  'day7',
  'day14',
  'day21',
  'day30',
  'trial_start',
  'paywall_nudge',
  'dormant_14d',
  'never_played_5d',
];

const build = (
  key: MarketingEmailKey,
  overrides?: Partial<{
    locale: 'ja' | 'en';
    includeTrialCta: boolean;
    platform: 'web' | 'ios';
  }>,
) =>
  buildMarketingEmail(key, {
    locale: overrides?.locale ?? 'ja',
    unsubscribeUrl: UNSUBSCRIBE_URL,
    includeTrialCta: overrides?.includeTrialCta ?? false,
    platform: overrides?.platform ?? 'web',
  });

describe('buildMarketingEmail', () => {
  it.each(ALL_KEYS)('builds a complete %s email in both locales', (key) => {
    for (const locale of ['ja', 'en'] as const) {
      const { subject, html } = build(key, { locale });
      expect(subject.length).toBeGreaterThan(0);
      expect(html).toContain(UNSUBSCRIBE_MARKER);
      expect(html).toContain(`<html lang="${locale}">`);
    }
  });

  it('gives every email a distinct subject per locale', () => {
    const subjects = ALL_KEYS.map((key) => build(key).subject);
    expect(new Set(subjects).size).toBe(ALL_KEYS.length);
  });

  it('routes questions to the contact form instead of email replies', () => {
    for (const key of ['day7', 'day30', 'trial_start', 'paywall_nudge'] as const) {
      expect(build(key).html).toContain('https://jazzify.jp/contact?');
    }
  });

  it('tags links with the email key so drip clicks are attributable', () => {
    expect(build('paywall_nudge').html).toContain('utm_campaign=paywall_nudge');
    expect(build('dormant_14d').html).toContain('utm_campaign=dormant_14d');
  });

  it('omits the web checkout link on iOS because Apple requires IAP', () => {
    const ios = build('paywall_nudge', { includeTrialCta: true, platform: 'ios' }).html;
    const web = build('paywall_nudge', { includeTrialCta: true, platform: 'web' }).html;
    expect(ios).toContain('設定 → サブスクリプション');
    expect(ios).not.toContain('utm_content=cta_trial');
    expect(web).toContain('utm_content=cta_trial');
  });

  it('drops the trial CTA once the user already started a trial', () => {
    const withCta = build('day21', { includeTrialCta: true }).html;
    const withoutCta = build('day21', { includeTrialCta: false }).html;
    expect(withCta).toContain('utm_content=cta_trial');
    expect(withoutCta).not.toContain('utm_content=cta_trial');
  });

  it('promotes the Japanese YouTube channel only to Japanese readers', () => {
    expect(build('day7', { locale: 'ja' }).html).toContain('youtube.com/@jazzswampradio');
    expect(build('day7', { locale: 'en' }).html).not.toContain('youtube.com');
  });

  it('points en readers at the en subdomain', () => {
    expect(build('day14', { locale: 'en' }).html).toContain('https://en.jazzify.jp/main/play/survival');
  });
});
