// Setup file for tests
import '@testing-library/jest-dom';
import { vi } from 'vitest';

/** JSDOM では `document.fonts` が無い／`ready` が解決しない場合があり、本番同様の load+check ゲートでテストが壊れる。テスト用に最小スタブする。 */
const bravuraLoaded = (font: string): boolean => /Bravura(SMuFL|SvgStaff)/u.test(font);

if (!document.fonts) {
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: {
      add: () => {},
      check: (font: string, _text?: string) => bravuraLoaded(font),
      load: async () => [],
      ready: Promise.resolve(),
    },
  });
} else {
  const fontsApi = document.fonts;
  vi.spyOn(fontsApi, 'load').mockResolvedValue([]);
  if (typeof fontsApi.check === 'function') {
    const originalCheck = fontsApi.check.bind(fontsApi);
    vi.spyOn(fontsApi, 'check').mockImplementation((font: string, text?: string) => {
      if (bravuraLoaded(font)) {
        return true;
      }
      return originalCheck(font, text);
    });
  }
  Object.defineProperty(fontsApi, 'ready', {
    configurable: true,
    enumerable: true,
    get: () => Promise.resolve(),
  });
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as unknown as typeof IntersectionObserver;