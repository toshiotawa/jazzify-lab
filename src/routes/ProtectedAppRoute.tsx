import React from 'react';
import AuthGate from '@/components/auth/AuthGate';
import { isIOSWebView } from '@/utils/iosbridge';
import AppShell from '@/routes/AppShell';
import IosWebViewShell from '@/routes/IosWebViewShell';

const ProtectedAppRoute: React.FC = () => (
  <AuthGate>
    {isIOSWebView() ? <IosWebViewShell /> : <AppShell />}
  </AuthGate>
);

export default ProtectedAppRoute;
