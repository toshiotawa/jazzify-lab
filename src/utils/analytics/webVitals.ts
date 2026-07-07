import { trackEvent } from '@/utils/analytics/ga';

const reportWebVital = (metricName: string, value: number): void => {
  if (!Number.isFinite(value) || value < 0) {
    return;
  }
  trackEvent('web_vital', {
    metric_name: metricName,
    value: Math.round(value),
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
  });
};

const observeLcp = (): void => {
  if (typeof PerformanceObserver === 'undefined') {
    return;
  }
  try {
    let reported = false;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (!last || reported) {
        return;
      }
      reported = true;
      reportWebVital('LCP', last.startTime);
      observer.disconnect();
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    /* unsupported */
  }
};

const reportNavigationTiming = (): void => {
  if (typeof performance === 'undefined') {
    return;
  }
  const [navigation] = performance.getEntriesByType('navigation');
  if (!navigation || !('responseStart' in navigation)) {
    return;
  }
  const timing = navigation as PerformanceNavigationTiming;
  reportWebVital('TTFB', timing.responseStart);
  if (timing.domContentLoadedEventEnd > 0) {
    reportWebVital('DCL', timing.domContentLoadedEventEnd);
  }
};

const observeInp = (): void => {
  if (typeof PerformanceObserver === 'undefined') {
    return;
  }
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if ('duration' in entry) {
          reportWebVital('INP', entry.duration);
        }
      }
    });
    observer.observe({ type: 'event', buffered: true });
  } catch {
    /* unsupported */
  }
};

export const initWebVitalsRum = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  observeLcp();
  observeInp();
  if (document.readyState === 'complete') {
    reportNavigationTiming();
  } else {
    window.addEventListener('load', reportNavigationTiming, { once: true });
  }
};
