import type { ComponentType } from 'react';
import type { AppRouteKind } from '@/routes/routeKinds';

type RouteModule = { default: ComponentType<{ authReady?: boolean }> };

const loadRouteModuleInternal = (
  kind: AppRouteKind,
): Promise<RouteModule> => {
  switch (kind) {
    case 'landing':
      return import('@/routes/LandingOnlyRoutes');
    case 'public':
      return import('@/routes/PublicInfoRoutes');
    case 'embed':
      return import('@/routes/EmbedRoutes');
    case 'app':
      return import('@/routes/AuthenticatedAppRoutes');
  }
};

const pendingModules = new Map<AppRouteKind, Promise<RouteModule>>();
const resolvedModules = new Map<AppRouteKind, RouteModule>();

const cacheRouteModule = async (kind: AppRouteKind): Promise<RouteModule> => {
  const cached = resolvedModules.get(kind);
  if (cached) {
    return cached;
  }

  const pending = pendingModules.get(kind);
  if (pending) {
    return pending;
  }

  const promise = loadRouteModuleInternal(kind).then((module) => {
    resolvedModules.set(kind, module);
    pendingModules.delete(kind);
    return module;
  });
  pendingModules.set(kind, promise);
  return promise;
};

export const loadRouteModule = (kind: AppRouteKind): Promise<RouteModule> =>
  cacheRouteModule(kind);

export const preloadRouteModule = (kind: AppRouteKind): Promise<RouteModule> =>
  cacheRouteModule(kind);

export const getPreloadedRouteModule = (kind: AppRouteKind): RouteModule | null =>
  resolvedModules.get(kind) ?? null;
