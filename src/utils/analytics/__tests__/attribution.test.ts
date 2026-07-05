import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  captureFirstTouch,
  getStoredFirstTouch,
  parseFirstTouchFromLocation,
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
  });

  describe('getStoredFirstTouch', () => {
    it('returns null for invalid stored JSON', () => {
      window.localStorage.setItem(FIRST_TOUCH_STORAGE_KEY, '{invalid');
      expect(getStoredFirstTouch()).toBeNull();
    });
  });
});
