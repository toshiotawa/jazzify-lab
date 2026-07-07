import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import ToastContainer from '@/components/ui/ToastContainer';
import { EnvironmentBadge } from '@/components/ui/EnvironmentBadge';
import {
  isAppPath,
  isLandingPath,
  normalizePathname,
} from '@/utils/appPaths';
import { useGaPageViews } from '@/hooks/useGaPageViews';
import { useAppStylesheets } from '@/hooks/useAppStylesheets';
import {
  resolveAppRouteKind,
  type AppRouteKind,
} from '@/routes/routeKinds';

const PageFallback: React.FC = () => (
  <div className="w-full min-h-screen flex items-center justify-center text-white">
    Loading...
  </div>
);

const loadRouteModule = (kind: AppRouteKind) =>
  import('@/routes/appRouteLoader').then((module) => module.loadRouteModule(kind));

interface LoadedRouteModule {
  kind: AppRouteKind;
  Component: React.ComponentType<{ authReady?: boolean }>;
}

const App: React.FC = () => {
  const location = useLocation();
  useGaPageViews();
  const [authReady, setAuthReady] = useState(false);
  const authBootstrapStartedRef = useRef(false);
  const pathname = normalizePathname(location.pathname);
  const routeKind = useMemo(() => resolveAppRouteKind(pathname), [pathname]);
  const [loadedRoute, setLoadedRoute] = useState<LoadedRouteModule | null>(null);
  const shouldLoadAppAssets = isAppPath(pathname);
  useAppStylesheets(shouldLoadAppAssets);

  useEffect(() => {
    let cancelled = false;
    setLoadedRoute(null);
    void loadRouteModule(routeKind).then((module) => {
      if (!cancelled) {
        setLoadedRoute({ kind: routeKind, Component: module.default });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [routeKind]);

  useEffect(() => {
    if (routeKind !== 'app' || authReady || authBootstrapStartedRef.current) {
      return;
    }
    authBootstrapStartedRef.current = true;

    const initializeAuth = async () => {
      try {
        const { bootstrapAppAuth, prefetchProtectedAppRoute } = await import('@/routes/appAuthBootstrap');
        await bootstrapAppAuth();
        prefetchProtectedAppRoute();
      } catch (e) {
        console.warn('⚠️ App: 認証初期化タイムアウトまたはエラー、続行します', e);
      }
      setAuthReady(true);
    };
    void initializeAuth();
  }, [authReady, routeKind]);

  useEffect(() => {
    if (isLandingPath(pathname)) {
      return;
    }
    void import('@/app-extra.css');
  }, [pathname]);

  if (location.pathname.length > 1 && location.pathname.endsWith('/')) {
    return (
      <Navigate
        to={normalizePathname(location.pathname) + location.search + location.hash}
        replace
      />
    );
  }

  const routeElement = (() => {
    if (!loadedRoute || loadedRoute.kind !== routeKind) {
      return <PageFallback />;
    }
    const { Component } = loadedRoute;
    if (routeKind === 'app') {
      return <Component authReady={authReady} />;
    }
    return <Component />;
  })();

  return (
    <>
      {routeElement}
      <ToastContainer />
      <EnvironmentBadge />
    </>
  );
};

export default App;
