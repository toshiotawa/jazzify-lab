import { describe, expect, it } from 'vitest';
import { getTokushohoPageCopy } from '@/components/legal/tokushohoContent';

describe('tokushohoContent', () => {
  it('英語 Web 版の Legal Notice を返す', () => {
    const copy = getTokushohoPageCopy({ variant: 'web', locale: 'en' });
    expect(copy.pageTitle).toContain('Legal Notice');
    expect(copy.seo.title).toContain('Legal Notice');
    expect(copy.entries.some((entry) => entry.label === 'Seller')).toBe(true);
  });

  it('日本語 iOS 版の表記を返す', () => {
    const copy = getTokushohoPageCopy({ variant: 'ios', locale: 'ja' });
    expect(copy.pageTitle).toContain('iOS');
    expect(copy.entries.some((entry) => entry.label === '販売方法')).toBe(true);
  });
});
