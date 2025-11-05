import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { getWindow } from '@/platform';
import { STORAGE_KEY_GEO_COUNTRY } from '@/constants/storageKeys';

type GeoStatus = 'idle' | 'loading' | 'success' | 'error';

interface GeoState {
  country: string | null;
  status: GeoStatus;
  error: string | null;
  detectedAt: number | null;
  ensureCountry: () => Promise<void>;
  setCountryHint: (country: string | null) => void;
  resetCountryHint: () => void;
}

const normalizeCountry = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.toUpperCase();
};

const getStoredCountry = (): string | null => {
  try {
    const platformWindow = getWindow();
    const stored = platformWindow?.localStorage?.getItem(STORAGE_KEY_GEO_COUNTRY) ?? null;
    return normalizeCountry(stored);
  } catch {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(STORAGE_KEY_GEO_COUNTRY);
        return normalizeCountry(stored);
      }
    } catch {
      return null;
    }
  }
  return null;
};

const setStoredCountry = (country: string | null): void => {
  try {
    const platformWindow = getWindow();
    if (!country) {
      platformWindow?.localStorage?.removeItem(STORAGE_KEY_GEO_COUNTRY);
    } else {
      platformWindow?.localStorage?.setItem(STORAGE_KEY_GEO_COUNTRY, country);
    }
  } catch {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (!country) {
          window.localStorage.removeItem(STORAGE_KEY_GEO_COUNTRY);
        } else {
          window.localStorage.setItem(STORAGE_KEY_GEO_COUNTRY, country);
        }
      }
    } catch {
      // ignore storage errors
    }
  }
};

const fetchGeoCountry = async (): Promise<string | null> => {
  const response = await fetch('/.netlify/functions/getGeoCountry', {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Geo API responded with ${response.status}`);
  }

  const data: unknown = await response.json();
  if (typeof data === 'object' && data !== null && 'country' in data) {
    const country = (data as { country: unknown }).country;
    if (typeof country === 'string') {
      return normalizeCountry(country);
    }
  }

  return null;
};

const initialCountry = getStoredCountry();

export const useGeoStore = create<GeoState>()(
  immer((set, get) => ({
    country: initialCountry,
    status: initialCountry ? 'success' : 'idle',
    error: null,
    detectedAt: initialCountry ? Date.now() : null,

    ensureCountry: async () => {
      const { status, country } = get();
      if (status === 'loading') {
        return;
      }
      if (country) {
        return;
      }

      set(draft => {
        draft.status = 'loading';
        draft.error = null;
      });

      try {
        const detectedCountry = await fetchGeoCountry();
        set(draft => {
          draft.country = detectedCountry;
          draft.status = 'success';
          draft.error = null;
          draft.detectedAt = Date.now();
        });
        setStoredCountry(detectedCountry);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set(draft => {
          draft.status = 'error';
          draft.error = message;
        });
      }
    },

    setCountryHint: (country: string | null) => {
      const normalized = normalizeCountry(country);
      set(draft => {
        draft.country = normalized;
        draft.status = normalized ? 'success' : 'idle';
        draft.error = null;
        draft.detectedAt = normalized ? Date.now() : null;
      });
      setStoredCountry(normalized);
    },

    resetCountryHint: () => {
      set(draft => {
        draft.country = null;
        draft.status = 'idle';
        draft.error = null;
        draft.detectedAt = null;
      });
      setStoredCountry(null);
    },
  }))
);

export type { GeoState };
