export const PUBLIC_INFO_PATHS = new Set([
  '/',
  '/help/ios-midi',
  '/help/midi-keyboard-choice',
  '/contact',
  '/terms',
  '/terms/ios',
  '/privacy',
  '/privacy/ios',
  '/legal/tokushoho',
  '/legal/tokushoho/ios',
  '/withdrawal-complete',
  '/login',
  '/signup',
  '/login/verify-otp',
]);

export type AppRouteKind = 'landing' | 'public' | 'embed' | 'app';

export const resolveAppRouteKind = (pathname: string): AppRouteKind => {
  if (pathname === '/' || pathname === '') {
    return 'landing';
  }
  if (pathname.startsWith('/embed/')) {
    return 'embed';
  }
  if (pathname === '/main' || pathname.startsWith('/main/')) {
    return 'app';
  }
  return 'public';
};
