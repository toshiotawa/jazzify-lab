import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from '@/components/LandingPage';
import AuthLanding from '@/components/auth/AuthLanding';
import LegacyApp from './LegacyApp';
import { useAuthStore } from '@/stores/authStore';

const App: React.FC = () => {
  const { user, isGuest } = useAuthStore();
  const location = useLocation();

  if ((user || isGuest) && location.pathname === '/auth') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthLanding />} />
      <Route path="/*" element={<LegacyApp />} />
    </Routes>
  );
};

export default App;
