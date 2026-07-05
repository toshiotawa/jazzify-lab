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
});
