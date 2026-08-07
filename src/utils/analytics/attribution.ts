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

const REFERRER_UTM_MAP: ReadonlyArray<{ hosts: readonly string[]; source: string; medium: string }> = [
  { hosts: ['t.co'], source: 'x', medium: 'social' },
  { hosts: ['twitter.com', 'x.com'], source: 'x', medium: 'social' },
  { hosts: ['instagram.com', 'l.instagram.com'], source: 'instagram', medium: 'social' },
  { hosts: ['google.com', 'google.co.jp'], source: 'google', medium: 'organic' },
  { hosts: ['jazzpianodays.com', 'www.jazzpianodays.com'], source: 'jazzpianodays', medium: 'referral' },
  { hosts: ['en.jazzify.jp'], source: 'en_blog', medium: 'organic' },
  { hosts: ['jazzify.jp', 'www.jazzify.jp'], source: 'jazzify', medium: 'referral' },
];

export const inferUtmFromReferrer = (
  referrer: string | null,
): Pick<FirstTouchData, 'utm_source' | 'utm_medium'> => {
  if (!referrer) {
    return { utm_source: null, utm_medium: null };
  }

  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    for (const entry of REFERRER_UTM_MAP) {
      if (entry.hosts.some((h) => host === h || host.endsWith(`.${h}`))) {
        return { utm_source: entry.source, utm_medium: entry.medium };
      }
    }
  } catch {
    return { utm_source: null, utm_medium: null };
  }

  return { utm_source: null, utm_medium: null };
};

export const hasUtmParams = (touch: FirstTouchData): boolean =>
  Boolean(touch.utm_source || touch.utm_medium || touch.utm_campaign || touch.utm_content || touch.utm_term);

export const hasAttributionSignal = (touch: FirstTouchData): boolean =>
  hasUtmParams(touch) || Boolean(touch.referrer);

export const enrichFirstTouch = (touch: FirstTouchData): FirstTouchData => {
  if (touch.utm_source) {
    return touch;
  }
  const inferred = inferUtmFromReferrer(touch.referrer);
  if (!inferred.utm_source) {
    return touch;
  }
  return {
    ...touch,
    utm_source: inferred.utm_source,
    utm_medium: touch.utm_medium ?? inferred.utm_medium,
  };
};

export const parseFirstTouchFromLocation = (
  search: string,
  pathname: string,
  referrer: string,
): FirstTouchData => {
  const params = new URLSearchParams(search);
  const trimmedReferrer = referrer.trim();

  return enrichFirstTouch({
    utm_source: readSearchParam(params, 'utm_source'),
    utm_medium: readSearchParam(params, 'utm_medium'),
    utm_campaign: readSearchParam(params, 'utm_campaign'),
    utm_content: readSearchParam(params, 'utm_content'),
    utm_term: readSearchParam(params, 'utm_term'),
    referrer: trimmedReferrer.length > 0 ? trimmedReferrer : null,
    landing_path: pathname || '/',
    captured_at: new Date().toISOString(),
  });
};

const shouldReplaceStoredTouch = (stored: FirstTouchData, incoming: FirstTouchData): boolean => {
  if (hasUtmParams(incoming) && !hasUtmParams(stored)) {
    return true;
  }
  if (!stored.referrer && incoming.referrer) {
    return true;
  }
  if (!hasUtmParams(stored) && hasAttributionSignal(incoming) && !hasAttributionSignal(stored)) {
    return true;
  }
  return false;
};

export const captureFirstTouch = (): void => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  const incoming = parseFirstTouchFromLocation(
    window.location.search,
    window.location.pathname,
    document.referrer,
  );

  const rawStored = localStorage.getItem(FIRST_TOUCH_STORAGE_KEY);
  if (!rawStored) {
    localStorage.setItem(FIRST_TOUCH_STORAGE_KEY, JSON.stringify(incoming));
    return;
  }

  try {
    const stored = JSON.parse(rawStored) as FirstTouchData;
    if (shouldReplaceStoredTouch(stored, incoming)) {
      localStorage.setItem(
        FIRST_TOUCH_STORAGE_KEY,
        JSON.stringify({
          ...incoming,
          landing_path: stored.landing_path || incoming.landing_path,
          captured_at: stored.captured_at || incoming.captured_at,
        }),
      );
    }
  } catch {
    localStorage.setItem(FIRST_TOUCH_STORAGE_KEY, JSON.stringify(incoming));
  }
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
      return enrichFirstTouch(parsed as FirstTouchData);
    }
  } catch {
    return null;
  }

  return null;
};

/** サインアップ時: localStorage + 現在URL をマージ（計測漏れ対策） */
export const resolveFirstTouchForSignup = (): FirstTouchData | null => {
  if (typeof window === 'undefined') {
    return getStoredFirstTouch();
  }

  const stored = getStoredFirstTouch();
  const fresh = parseFirstTouchFromLocation(
    window.location.search,
    window.location.pathname,
    document.referrer,
  );

  if (!stored) {
    return fresh;
  }

  if (shouldReplaceStoredTouch(stored, fresh)) {
    return {
      ...fresh,
      landing_path: stored.landing_path || fresh.landing_path,
      captured_at: stored.captured_at || fresh.captured_at,
    };
  }

  return enrichFirstTouch(stored);
};
