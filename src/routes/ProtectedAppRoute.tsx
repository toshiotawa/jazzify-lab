import React from 'react';
import AuthGate from '@/components/auth/AuthGate';
import LegacyApp from '@/LegacyApp';

const ProtectedAppRoute: React.FC = () => (
  <AuthGate>
    <LegacyApp />
  </AuthGate>
);

export default ProtectedAppRoute;
