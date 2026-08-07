import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  captureFirstTouch,
  enrichFirstTouch,
  getStoredFirstTouch,
  inferUtmFromReferrer,
  parseFirstTouchFromLocation,
  resolveFirstTouchForSignup,
} from '@/utils/analytics/attribution';

const FIRST_TOUCH_STORAGE_KEY = 'jazzify_first_touch';

describe('attribution', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    });
    window.localStorage.removeItem(FIRST_TOUCH_STORAGE_KEY);
  });

  describe('parseFirstTouchFromLocation', () => {
    it('parses UTM params and referrer from location', () => {
      const result = parseFirstTouchFromLocation(
        '?utm_source=x&utm_medium=social&utm_campaign=parry_01&utm_content=post1&utm_term=jazz',
        '/',
        'https://twitter.com/',
      );

      expect(result).toEqual({
        utm_source: 'x',
        utm_medium: 'social',
        utm_campaign: 'parry_01',
        utm_content: 'post1',
        utm_term: 'jazz',
        referrer: 'https://twitter.com/',
        landing_path: '/',
        captured_at: expect.any(String),
      });
    });

    it('returns null for empty UTM values and referrer', () => {
      const result = parseFirstTouchFromLocation('', '/signup', '');

      expect(result.utm_source).toBeNull();
      expect(result.utm_medium).toBeNull();
      expect(result.utm_campaign).toBeNull();
      expect(result.referrer).toBeNull();
      expect(result.landing_path).toBe('/signup');
    });

    it('infers UTM from referrer when params are missing', () => {
      const result = parseFirstTouchFromLocation('', '/signup', 'https://t.co/abc');

      expect(result.utm_source).toBe('x');
      expect(result.utm_medium).toBe('social');
    });
  });

  describe('inferUtmFromReferrer', () => {
    it('maps instagram referrer', () => {
      expect(inferUtmFromReferrer('https://l.instagram.com/')).toEqual({
        utm_source: 'instagram',
        utm_medium: 'social',
      });
    });
  });

  describe('enrichFirstTouch', () => {
    it('fills missing utm_source from referrer', () => {
      const enriched = enrichFirstTouch({
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        utm_content: null,
        utm_term: null,
        referrer: 'https://www.google.co.jp/search?q=jazzify',
        landing_path: '/',
        captured_at: '2026-08-07T00:00:00.000Z',
      });

      expect(enriched.utm_source).toBe('google');
      expect(enriched.utm_medium).toBe('organic');
    });
  });

  describe('captureFirstTouch', () => {
    it('stores first touch only once', () => {
      vi.stubGlobal('location', {
        search: '?utm_source=x',
        pathname: '/',
      });
      vi.stubGlobal('document', {
        referrer: 'https://twitter.com/',
      });

      captureFirstTouch();

      const first = getStoredFirstTouch();
      expect(first).not.toBeNull();
      expect(first?.landing_path).toBe('/');
      expect(first?.utm_source).toBe('x');

      window.localStorage.setItem(
        FIRST_TOUCH_STORAGE_KEY,
        JSON.stringify({
          ...first,
          utm_source: 'instagram',
        }),
      );

      captureFirstTouch();
      expect(getStoredFirstTouch()?.utm_source).toBe('instagram');
    });

    it('upgrades stored touch when incoming has UTM and stored does not', () => {
      window.localStorage.setItem(
        FIRST_TOUCH_STORAGE_KEY,
        JSON.stringify({
          utm_source: null,
          utm_medium: null,
          utm_campaign: null,
          utm_content: null,
          utm_term: null,
          referrer: null,
          landing_path: '/',
          captured_at: '2026-08-01T00:00:00.000Z',
        }),
      );

      vi.stubGlobal('location', {
        search: '?utm_source=x&utm_medium=social&utm_campaign=jazz_ad_lib',
        pathname: '/signup',
      });
      vi.stubGlobal('document', { referrer: '' });

      captureFirstTouch();
      expect(getStoredFirstTouch()?.utm_source).toBe('x');
      expect(getStoredFirstTouch()?.utm_campaign).toBe('jazz_ad_lib');
    });
  });

  describe('resolveFirstTouchForSignup', () => {
    it('merges current URL UTM when stored touch is empty', () => {
      vi.stubGlobal('location', {
        search: '?utm_source=en_blog&utm_medium=header',
        pathname: '/signup',
      });
      vi.stubGlobal('document', { referrer: '' });

      const resolved = resolveFirstTouchForSignup();
      expect(resolved?.utm_source).toBe('en_blog');
      expect(resolved?.utm_medium).toBe('header');
    });
  });

  describe('getStoredFirstTouch', () => {
    it('returns null for invalid stored JSON', () => {
      window.localStorage.setItem(FIRST_TOUCH_STORAGE_KEY, '{invalid');
      expect(getStoredFirstTouch()).toBeNull();
    });
  });
});
