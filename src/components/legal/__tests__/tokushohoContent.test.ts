import { describe, expect, it } from 'vitest';
import { getTokushohoPageCopy } from '@/components/legal/tokushohoContent';

describe('tokushohoContent', () => {
  it('英語 Web 版の Legal Notice を返す', () => {
    const copy = getTokushohoPageCopy({ variant: 'web', locale: 'en' });
    expect(copy.pageTitle).toContain('Legal Notice');
    expect(copy.seo.title).toContain('Legal Notice');
    expect(copy.entries.some((entry) => entry.label === 'Seller')).toBe(true);
  });

  it('日本語 Web 版の表記に Stripe と Lemon Squeezy を併記する', () => {
    const copy = getTokushohoPageCopy({ variant: 'web', locale: 'ja' });
    const paymentEntry = copy.entries.find((entry) => entry.label === '支払方法');
    expect(copy.subtitle).toContain('Stripe');
    expect(copy.subtitle).toContain('Lemon Squeezy');
    expect(paymentEntry?.value).toContain('Stripe');
    expect(paymentEntry?.value).toContain('Lemon Squeezy');
  });

  it('日本語 iOS 版の表記を返す', () => {
    const copy = getTokushohoPageCopy({ variant: 'ios', locale: 'ja' });
    expect(copy.pageTitle).toContain('iOS');
    expect(copy.entries.some((entry) => entry.label === '販売方法')).toBe(true);
  });
});
