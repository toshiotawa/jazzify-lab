export type MarketingEmailKey = 'day0' | 'day1' | 'day2' | 'day3' | 'trial_start';
export type MarketingEmailLocale = 'ja' | 'en';

export const MARKETING_EMAIL_PATHS = {
  mainLessons: '/main/lessons',
  account: '/main/account',
  iosMidi: '/help/ios-midi',
  midiKeyboard: '/help/midi-keyboard-choice',
  pdf: '/sozai/bluesy-licks/bluesy-licks-1-5.pdf',
  tokushoho: '/legal/tokushoho',
} as const;

export const MARKETING_LICK_AUDIO_PATHS = [
  {
    label: 'Lick 1',
    slow: '/sozai/bluesy-licks/bluesy-licks-01-120_slow_loop4_ci.mp3',
    normal: '/sozai/bluesy-licks/bluesy-licks-01-240_loop4_ci.mp3',
  },
  {
    label: 'Lick 2',
    slow: '/sozai/bluesy-licks/bluesy-licks-02-80_slow_loop4_ci.mp3',
    normal: '/sozai/bluesy-licks/bluesy-licks-02-160_loop4_ci.mp3',
  },
  {
    label: 'Lick 3',
    slow: '/sozai/bluesy-licks/bluesy-licks-03-80_slow_loop4_ci.mp3',
    normal: '/sozai/bluesy-licks/bluesy-licks-03-160_loop4_ci.mp3',
  },
  {
    label: 'Lick 4',
    slow: '/sozai/bluesy-licks/bluesy-licks-04-100_slow_loop4_ci.mp3',
    normal: '/sozai/bluesy-licks/bluesy-licks-04-200_loop4_ci.mp3',
  },
  {
    label: 'Lick 5',
    slow: '/sozai/bluesy-licks/bluesy-licks-05-120_slow_loop4_ci.mp3',
    normal: '/sozai/bluesy-licks/bluesy-licks-05-240_loop4_ci.mp3',
  },
] as const;

export const getMarketingSiteOrigin = (locale: MarketingEmailLocale): string =>
  locale === 'en' ? 'https://en.jazzify.jp' : 'https://jazzify.jp';

/**
 * メルマガ内リンク用の UTM 付き URL。
 * utm_campaign = email_key（day0〜day3 / trial_start）、utm_content = CTA 識別子。
 */
export const buildMarketingTrackedUrl = (
  locale: MarketingEmailLocale,
  emailKey: MarketingEmailKey,
  content: string,
  path: string,
): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(normalizedPath, getMarketingSiteOrigin(locale));
  url.searchParams.set('utm_source', 'email');
  url.searchParams.set('utm_medium', 'drip');
  url.searchParams.set('utm_campaign', emailKey);
  url.searchParams.set('utm_content', content);
  return url.toString();
};

export const buildLickAudioContentKey = (lickIndex: number, tempo: 'slow' | 'normal'): string =>
  `lick${lickIndex + 1}_${tempo}`;
