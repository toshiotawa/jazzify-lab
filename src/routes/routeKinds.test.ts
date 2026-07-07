import { resolveAppRouteKind } from '@/routes/routeKinds';

describe('resolveAppRouteKind', () => {
  it('returns landing for root path', () => {
    expect(resolveAppRouteKind('/')).toBe('landing');
    expect(resolveAppRouteKind('')).toBe('landing');
  });

  it('returns app for /main paths', () => {
    expect(resolveAppRouteKind('/main')).toBe('app');
    expect(resolveAppRouteKind('/main/dashboard')).toBe('app');
  });

  it('returns public for info and auth pages', () => {
    expect(resolveAppRouteKind('/login')).toBe('public');
    expect(resolveAppRouteKind('/help/ios-midi')).toBe('public');
  });
});
