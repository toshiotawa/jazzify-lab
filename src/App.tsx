import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from '@/components/LandingPage';
import AuthLanding from '@/components/auth/AuthLanding';
import AuthCallback from '@/components/auth/AuthCallback';
import VerifyOtpPage from '@/components/auth/VerifyOtpPage';
import AuthGate from '@/components/auth/AuthGate';
import ToastContainer from '@/components/ui/ToastContainer';

// LegacyApp はバンドルサイズが大きいため遅延読み込みする
const LegacyApp = React.lazy(() => import('./LegacyApp'));

const App: React.FC = () => {
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
          {/* ========== 公開ルート (AuthGateの外) ========== */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthLanding />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/login/verify-otp" element={<VerifyOtpPage />} />

          {/* ========== 保護ルート (AuthGateの内側) ========== */}
          {/* '/*' を使い、上記以外のすべてのパスを保護対象にする */}
          <Route
            path="/*"
            element={
              <AuthGate>
                <LegacyApp />
              </AuthGate>
            }
          />
        </Routes>
      </Suspense>
      <ToastContainer />
    </>
  );
};

export default App;
