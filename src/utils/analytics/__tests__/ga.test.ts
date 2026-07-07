import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const GA_MEASUREMENT_ID = 'G-TESTMEASURE1';

describe('initGa dataLayer contract', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', GA_MEASUREMENT_ID);
    document.head.innerHTML = '';
    window.dataLayer = undefined;
    window.gtag = undefined;
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('pushes Arguments objects to dataLayer so gtag.js can process commands', async () => {
    const pushed: unknown[] = [];
    const dataLayer: unknown[] = [];
    Object.defineProperty(dataLayer, 'push', {
      value: (...items: unknown[]) => {
        pushed.push(...items);
        return pushed.length;
      },
    });
    window.dataLayer = dataLayer;

    const { initGa } = await import('@/utils/analytics/ga');
    initGa();

    expect(window.gtag).toBeTypeOf('function');
    expect(pushed.length).toBeGreaterThanOrEqual(2);
    expect(pushed.every((item) => Object.prototype.toString.call(item) === '[object Arguments]')).toBe(true);
    expect(pushed.some((item) => (item as IArguments)[0] === 'config')).toBe(true);
  });

  it('queues manual page_view events in Arguments form', async () => {
    const pushed: unknown[] = [];
    const dataLayer: unknown[] = [];
    Object.defineProperty(dataLayer, 'push', {
      value: (...items: unknown[]) => {
        pushed.push(...items);
        return pushed.length;
      },
    });
    window.dataLayer = dataLayer;

    const { initGa, trackPageView } = await import('@/utils/analytics/ga');
    initGa();
    trackPageView('/signup?utm_source=test');

    const pageViewCommand = pushed.find(
      (item) => !Array.isArray(item) && (item as IArguments)[0] === 'event' && (item as IArguments)[1] === 'page_view',
    ) as IArguments | undefined;

    expect(pageViewCommand).toBeDefined();
    expect(pageViewCommand?.[2]).toEqual({
      page_path: '/signup?utm_source=test',
      page_location: `${window.location.origin}/signup?utm_source=test`,
      page_title: '',
    });
  });

  it('attaches lp context to major funnel events', async () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        hostname: 'en.jazzify.jp',
        pathname: '/signup',
        search: '',
        hash: '',
        origin: 'https://en.jazzify.jp',
      },
    });

    const pushed: unknown[] = [];
    const dataLayer: unknown[] = [];
    Object.defineProperty(dataLayer, 'push', {
      value: (...items: unknown[]) => {
        pushed.push(...items);
        return pushed.length;
      },
    });
    window.dataLayer = dataLayer;

    const { initGa, trackEvent } = await import('@/utils/analytics/ga');
    initGa();
    trackEvent('sign_up', { method: 'email_otp' });

    const signUpCommand = pushed.find(
      (item) => !Array.isArray(item) && (item as IArguments)[0] === 'event' && (item as IArguments)[1] === 'sign_up',
    ) as IArguments | undefined;

    expect(signUpCommand?.[2]).toEqual({
      device_category: 'desktop',
      device_os: 'other',
      device_browser: 'other',
      lp_locale: 'en',
      lp_hostname: 'en.jazzify.jp',
      lp_path: '/signup',
      method: 'email_otp',
    });
  });

  it('attaches device context to auth funnel events', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      value: 0,
    });

    const pushed: unknown[] = [];
    const dataLayer: unknown[] = [];
    Object.defineProperty(dataLayer, 'push', {
      value: (...items: unknown[]) => {
        pushed.push(...items);
        return pushed.length;
      },
    });
    window.dataLayer = dataLayer;

    const { initGa, trackEvent } = await import('@/utils/analytics/ga');
    initGa();
    trackEvent('sign_up_click', { method: 'email_otp' });

    const signUpClickCommand = pushed.find(
      (item) => !Array.isArray(item) && (item as IArguments)[0] === 'event' && (item as IArguments)[1] === 'sign_up_click',
    ) as IArguments | undefined;

    expect(signUpClickCommand?.[2]).toEqual({
      device_category: 'desktop',
      device_os: 'windows',
      device_browser: 'chrome',
      method: 'email_otp',
    });
  });

  it('does not attach lp context to non-funnel events', async () => {
    const pushed: unknown[] = [];
    const dataLayer: unknown[] = [];
    Object.defineProperty(dataLayer, 'push', {
      value: (...items: unknown[]) => {
        pushed.push(...items);
        return pushed.length;
      },
    });
    window.dataLayer = dataLayer;

    const { initGa, trackEvent } = await import('@/utils/analytics/ga');
    initGa();
    trackEvent('tutorial_begin', { tutorial_name: 'lp_demo' });

    const demoBeginCommand = pushed.find(
      (item) => !Array.isArray(item) && (item as IArguments)[0] === 'event' && (item as IArguments)[1] === 'tutorial_begin',
    ) as IArguments | undefined;

    expect(demoBeginCommand?.[2]).toEqual({ tutorial_name: 'lp_demo' });
  });
});
