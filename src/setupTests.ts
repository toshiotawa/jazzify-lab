// Setup file for tests
import '@testing-library/jest-dom';

// Simple mock implementation
const mockFn = (implementation?: Function) => {
  const fn = implementation || (() => {});
  return Object.assign(fn, {
    mockImplementation: (newImpl: Function) => mockFn(newImpl),
  });
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockFn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: mockFn(), // deprecated
    removeListener: mockFn(), // deprecated
    addEventListener: mockFn(),
    removeEventListener: mockFn(),
    dispatchEvent: mockFn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

global.IntersectionObserver = MockIntersectionObserver as any;