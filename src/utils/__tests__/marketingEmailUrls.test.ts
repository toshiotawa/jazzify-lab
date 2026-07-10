import { describe, expect, it } from 'vitest';
import {
  buildLickAudioContentKey,
  buildMarketingTrackedUrl,
  getMarketingSiteOrigin,
  MARKETING_EMAIL_PATHS,
} from '../../../netlify/functions/lib/marketingEmailUrls';

describe('marketingEmailUrls', () => {
  it('uses jazzify.jp for ja and en.jazzify.jp for en', () => {
    expect(getMarketingSiteOrigin('ja')).toBe('https://jazzify.jp');
    expect(getMarketingSiteOrigin('en')).toBe('https://en.jazzify.jp');
  });

  it('appends drip UTM params for ja lessons CTA', () => {
    const url = buildMarketingTrackedUrl('ja', 'day1', 'cta_lessons', MARKETING_EMAIL_PATHS.mainLessons);
    expect(url).toBe(
      'https://jazzify.jp/main/lessons?utm_source=email&utm_medium=drip&utm_campaign=day1&utm_content=cta_lessons',
    );
  });

  it('appends drip UTM params on en subdomain', () => {
    const url = buildMarketingTrackedUrl('en', 'day0', 'cta_pdf_download', MARKETING_EMAIL_PATHS.pdf);
    expect(url).toBe(
      'https://en.jazzify.jp/sozai/bluesy-licks/bluesy-licks-1-5.pdf?utm_source=email&utm_medium=drip&utm_campaign=day0&utm_content=cta_pdf_download',
    );
  });

  it('builds lick audio content keys', () => {
    expect(buildLickAudioContentKey(0, 'slow')).toBe('lick1_slow');
    expect(buildLickAudioContentKey(4, 'normal')).toBe('lick5_normal');
  });
});
