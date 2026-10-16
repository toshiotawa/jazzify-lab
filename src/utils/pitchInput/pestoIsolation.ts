/** Keep external lesson videos, public pages and account screens outside COEP. */
export const isPestoIsolatedPath = (pathname: string): boolean => (
  pathname === '/main/play' || pathname.startsWith('/main/play/')
);
