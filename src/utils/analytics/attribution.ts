const FIRST_TOUCH_STORAGE_KEY = 'jazzify_first_touch';

export interface FirstTouchData {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  landing_path: string;
  captured_at: string;
}

const readSearchParam = (params: URLSearchParams, key: string): string | null => {
  const value = params.get(key)?.trim();
  return value && value.length > 0 ? value : null;
};

export const parseFirstTouchFromLocation = (
  search: string,
  pathname: string,
  referrer: string,
): FirstTouchData => {
  const params = new URLSearchParams(search);
  const trimmedReferrer = referrer.trim();

  return {
    utm_source: readSearchParam(params, 'utm_source'),
    utm_medium: readSearchParam(params, 'utm_medium'),
    utm_campaign: readSearchParam(params, 'utm_campaign'),
    utm_content: readSearchParam(params, 'utm_content'),
    utm_term: readSearchParam(params, 'utm_term'),
    referrer: trimmedReferrer.length > 0 ? trimmedReferrer : null,
    landing_path: pathname || '/',
    captured_at: new Date().toISOString(),
  };
};

export const captureFirstTouch = (): void => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  if (localStorage.getItem(FIRST_TOUCH_STORAGE_KEY)) {
    return;
  }

  const firstTouch = parseFirstTouchFromLocation(
    window.location.search,
    window.location.pathname,
    document.referrer,
  );

  localStorage.setItem(FIRST_TOUCH_STORAGE_KEY, JSON.stringify(firstTouch));
};

export const getStoredFirstTouch = (): FirstTouchData | null => {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(FIRST_TOUCH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object'
      && parsed !== null
      && 'landing_path' in parsed
      && typeof (parsed as FirstTouchData).landing_path === 'string'
    ) {
      return parsed as FirstTouchData;
    }
  } catch {
    return null;
  }

  return null;
};
