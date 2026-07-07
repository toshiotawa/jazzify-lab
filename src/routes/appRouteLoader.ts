import type { ComponentType } from 'react';
import type { AppRouteKind } from '@/routes/routeKinds';

export const loadRouteModule = (
  kind: AppRouteKind,
): Promise<{ default: ComponentType<{ authReady?: boolean }> }> => {
  switch (kind) {
    case 'landing':
      return import('@/routes/LandingOnlyRoutes');
    case 'public':
      return import('@/routes/PublicInfoRoutes');
    case 'app':
      return import('@/routes/AuthenticatedAppRoutes');
  }
};
