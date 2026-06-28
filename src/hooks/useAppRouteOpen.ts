import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getHashBase } from '@/hooks/useHashMonitor';

type PathMatcher = string | ((pathname: string) => boolean);

const matchPath = (pathname: string, path: PathMatcher): boolean =>
  typeof path === 'string' ? pathname === path : path(pathname);

export interface AppRouteOpenOptions {
  /** legacy hash のベース（例: `#dashboard`）または判定関数 */
  hash?: string | ((hashBase: string, rawHash: string) => boolean);
  /** path routing 用の pathname 一致 */
  path?: PathMatcher;
}

const computeAppRouteOpen = (
  pathname: string,
  rawHash: string,
  options: AppRouteOpenOptions,
): boolean => {
  if (options.path !== undefined && matchPath(pathname, options.path)) {
    return true;
  }
  if (options.hash === undefined) {
    return false;
  }
  const hashBase = getHashBase(rawHash);
  if (typeof options.hash === 'string') {
    return hashBase === options.hash;
  }
  return options.hash(hashBase, rawHash);
};

/** unit test 用 */
export const computeAppRouteOpenForTest = computeAppRouteOpen;

/**
 * hash ルートと path ルートの両方で画面を「開く」状態にする。
 * AppShell から path でマウントされたコンポーネント向け。
 */
export const useAppRouteOpen = (options: AppRouteOpenOptions): boolean => {
  const location = useLocation();
  const [open, setOpen] = useState(() =>
    computeAppRouteOpen(location.pathname, window.location.hash, options),
  );

  useEffect(() => {
    const sync = (): void => {
      setOpen(computeAppRouteOpen(location.pathname, window.location.hash, options));
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [location.pathname, options.hash, options.path]);

  return open;
};

/** ルートマウント時は常に open（path 判定のみ） */
export const usePathRouteOpen = (path: PathMatcher): boolean => {
  const location = useLocation();
  return matchPath(location.pathname, path);
};
