import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from '@/components/LandingPage';
import AuthLanding from '@/components/auth/AuthLanding';
import AuthCallback from '@/components/auth/AuthCallback';
import VerifyOtpPage from '@/components/auth/VerifyOtpPage';
import { useAuthStore } from '@/stores/authStore';
import ToastContainer from '@/components/ui/ToastContainer';

// LegacyApp はバンドルサイズが大きいため遅延読み込みする
const LegacyApp = React.lazy(() => import('./LegacyApp'));

const App: React.FC = () => {
  const { user, isGuest } = useAuthStore();
  const location = useLocation();

  // 認証済みユーザーが / にアクセスした場合、/main#dashboard にリダイレクト
  if ((user || isGuest) && location.pathname === '/') {
    return <Navigate to="/main#dashboard" replace />;
  }

  if ((user || isGuest) && location.pathname === '/auth') {
    return <Navigate to="/main" replace />;
  }

  return (
    <>
      <Suspense
        fallback={
          <div className="w-full h-screen flex items-center justify-center text-white">
            Loading...
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthLanding />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/main" element={<LegacyApp />} />
          <Route path="/*" element={<LegacyApp />} />
        </Routes>
      </Suspense>
      <ToastContainer />
    </>
  );
};

export default App;
