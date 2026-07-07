import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppAuthSkeleton from '@/components/ui/AppAuthSkeleton';
import { navigateToDashboardPath } from '@/utils/appNavigation';

const ProtectedAppRoute = React.lazy(() => import('@/routes/ProtectedAppRoute'));

const PageFallback: React.FC = () => (
  <div className="w-full min-h-screen flex items-center justify-center text-white">
    Loading...
  </div>
);

interface AuthenticatedAppRoutesProps {
  authReady?: boolean;
}

const AuthenticatedAppRoutes: React.FC<AuthenticatedAppRoutesProps> = ({ authReady = false }) => {
  const protectedElement = authReady ? (
    <ProtectedAppRoute />
  ) : (
    <AppAuthSkeleton />
  );

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/main" element={protectedElement} />
        <Route path="/main/*" element={protectedElement} />
        <Route path="*" element={<Navigate to={navigateToDashboardPath()} replace />} />
      </Routes>
    </Suspense>
  );
};

export default AuthenticatedAppRoutes;
