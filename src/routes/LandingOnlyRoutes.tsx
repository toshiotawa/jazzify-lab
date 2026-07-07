import React, { Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { buildAppUrl, shouldRedirectLegacyAppHash } from '@/utils/appPaths';

const LandingPage = React.lazy(() => import('@/components/LandingPage'));

const PageFallback: React.FC = () => (
  <div className="w-full min-h-screen flex items-center justify-center text-white">
    Loading...
  </div>
);

const LandingRoute: React.FC = () => {
  const location = useLocation();
  if (shouldRedirectLegacyAppHash(location.pathname, location.hash)) {
    return (
      <Navigate
        to={buildAppUrl(location.hash, location.search)}
        replace
      />
    );
  }
  return (
    <Suspense fallback={<PageFallback />}>
      <LandingPage />
    </Suspense>
  );
};

const LandingOnlyRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<LandingRoute />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default LandingOnlyRoutes;
