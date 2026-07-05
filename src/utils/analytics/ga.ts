declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type GaEventParams = Record<string, string | number | boolean | undefined>;

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

let initialized = false;

const isGaEnabled = (): boolean =>
  typeof GA_MEASUREMENT_ID === 'string' && GA_MEASUREMENT_ID.length > 0;

export const initGa = (): void => {
  if (initialized || !isGaEnabled() || typeof window === 'undefined') {
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  // gtag.js expects Arguments objects in dataLayer, not Arrays.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params -- GA4 dataLayer contract requires `arguments`
    window.dataLayer?.push(arguments);
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });

  initialized = true;
};

export const trackEvent = (name: string, params?: GaEventParams): void => {
  if (!initialized || !window.gtag) {
    return;
  }
  window.gtag('event', name, params ?? {});
};

export const trackPageView = (path: string): void => {
  if (!initialized || !window.gtag || !GA_MEASUREMENT_ID) {
    return;
  }
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: `${window.location.origin}${path}`,
    page_title: document.title,
  });
};

export const getGaClientId = (): Promise<string | null> => {
  if (!initialized || !window.gtag || !GA_MEASUREMENT_ID) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    window.gtag?.('get', GA_MEASUREMENT_ID, 'client_id', (clientId: unknown) => {
      resolve(typeof clientId === 'string' && clientId.length > 0 ? clientId : null);
    });
  });
};
