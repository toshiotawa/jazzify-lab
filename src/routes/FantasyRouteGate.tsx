import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { dashboardPath } from '@/utils/appNavigation';
import { isFantasyRouteAllowedForLimitedUser } from '@/utils/lessonPlayRouteAccess';

const LazyFantasyMain = React.lazy(() => import('@/components/fantasy/FantasyMain'));

interface FantasyRouteGateProps {
  isPremiumMember: boolean;
}

export const FantasyRouteGate: React.FC<FantasyRouteGateProps> = ({ isPremiumMember }) => {
  const location = useLocation();
  if (isPremiumMember || isFantasyRouteAllowedForLimitedUser(location)) {
    return (
      <React.Suspense fallback={<LoadingScreen />}>
        <LazyFantasyMain />
      </React.Suspense>
    );
  }
  return <Navigate to={dashboardPath()} replace />;
};
