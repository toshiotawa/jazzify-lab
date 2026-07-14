import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildAppStoreCampaignToken,
  buildAppStoreCampaignUrl,
  buildAppStoreCampaignUrlFromFirstTouch,
} from '@/utils/analytics/appStoreCampaignUrl';

const BASE = 'https://apps.apple.com/app/apple-store/id6761457001';
const FIRST_TOUCH_STORAGE_KEY = 'jazzify_first_touch';

describe('appStoreCampaignUrl', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
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
  });

  describe('buildAppStoreCampaignToken', () => {
    it('joins source, campaign, and content', () => {
      expect(
        buildAppStoreCampaignToken({
          utm_source: 'x',
          utm_campaign: 'parry01',
          utm_content: 'post1',
        }),
      ).toBe('x_parry01_post1');
    });

    it('sanitizes invalid characters and lowercases', () => {
      expect(
        buildAppStoreCampaignToken({
          utm_source: 'X / Social',
          utm_campaign: 'Parry 01!',
          utm_content: null,
        }),
      ).toBe('x_social_parry_01');
    });

    it('returns null when no usable segments', () => {
      expect(
        buildAppStoreCampaignToken({
          utm_source: '   ',
          utm_campaign: null,
          utm_content: '!!!',
        }),
      ).toBeNull();
    });

    it('truncates long tokens', () => {
      const token = buildAppStoreCampaignToken({
        utm_source: 'verylongsource',
        utm_campaign: 'verylongcampaignnamehere',
        utm_content: 'verylongcontenttoken',
      });
      expect(token).not.toBeNull();
      expect(token!.length).toBeLessThanOrEqual(40);
    });
  });

  describe('buildAppStoreCampaignUrl', () => {
    it('always sets mt=8', () => {
      const url = new URL(buildAppStoreCampaignUrl({}, BASE));
      expect(url.searchParams.get('mt')).toBe('8');
      expect(url.searchParams.get('ct')).toBeNull();
      expect(url.searchParams.get('pt')).toBeNull();
    });

    it('adds ct from UTM and pt from explicit provider token', () => {
      const url = new URL(
        buildAppStoreCampaignUrl(
          {
            utm_source: 'x',
            utm_campaign: 'parry01',
            providerToken: '123456',
          },
          BASE,
        ),
      );
      expect(url.searchParams.get('ct')).toBe('x_parry01');
      expect(url.searchParams.get('pt')).toBe('123456');
      expect(url.searchParams.get('mt')).toBe('8');
    });

    it('reads provider token from env when not passed', () => {
      vi.stubEnv('VITE_APP_STORE_PROVIDER_TOKEN', '998877');
      const url = new URL(buildAppStoreCampaignUrl({ utm_source: 'ig' }, BASE));
      expect(url.searchParams.get('pt')).toBe('998877');
      expect(url.searchParams.get('ct')).toBe('ig');
    });
  });

  describe('buildAppStoreCampaignUrlFromFirstTouch', () => {
    it('uses stored first touch UTM', () => {
      window.localStorage.setItem(
        FIRST_TOUCH_STORAGE_KEY,
        JSON.stringify({
          utm_source: 'x',
          utm_medium: 'social',
          utm_campaign: 'parry01',
          utm_content: 'cta',
          utm_term: null,
          referrer: null,
          landing_path: '/',
          captured_at: '2026-07-13T00:00:00.000Z',
        }),
      );

      const url = new URL(buildAppStoreCampaignUrlFromFirstTouch());
      expect(url.searchParams.get('ct')).toBe('x_parry01_cta');
      expect(url.searchParams.get('mt')).toBe('8');
    });

    it('falls back to base campaign url without ct when no first touch', () => {
      const url = new URL(buildAppStoreCampaignUrlFromFirstTouch(null));
      expect(url.searchParams.get('mt')).toBe('8');
      expect(url.searchParams.get('ct')).toBeNull();
    });
  });
});
