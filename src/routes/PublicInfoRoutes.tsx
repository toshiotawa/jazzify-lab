import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { navigateToDashboardPath } from '@/utils/appNavigation';

const AuthLanding = React.lazy(() => import('@/components/auth/AuthLanding'));
const VerifyOtpPage = React.lazy(() => import('@/components/auth/VerifyOtpPage'));
const HelpIosMidi = React.lazy(() => import('@/components/help/HelpIosMidi'));
const HelpMidiKeyboardChoice = React.lazy(() => import('@/components/help/HelpMidiKeyboardChoice'));
const ContactPage = React.lazy(() => import('@/components/contact/ContactPage'));
const TermsPage = React.lazy(() => import('@/components/legal/TermsPage'));
const PrivacyPage = React.lazy(() => import('@/components/legal/PrivacyPage'));
const TokushohoPage = React.lazy(() => import('@/components/legal/TokushohoPage'));
const TokushohoIosPage = React.lazy(() => import('@/components/legal/TokushohoIosPage'));
const WithdrawalCompletePage = React.lazy(() => import('@/components/auth/WithdrawalCompletePage'));

const PageFallback: React.FC = () => (
  <div className="w-full min-h-screen flex items-center justify-center text-white">
    Loading...
  </div>
);

const PublicInfoRoutes: React.FC = () => (
  <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/help/ios-midi" element={<HelpIosMidi />} />
      <Route path="/help/midi-keyboard-choice" element={<HelpMidiKeyboardChoice />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/terms" element={<TermsPage variant="web" />} />
      <Route path="/terms/ios" element={<TermsPage variant="ios" />} />
      <Route path="/privacy" element={<PrivacyPage variant="web" />} />
      <Route path="/privacy/ios" element={<PrivacyPage variant="ios" />} />
      <Route path="/legal/tokushoho" element={<TokushohoPage />} />
      <Route path="/legal/tokushoho/ios" element={<TokushohoIosPage />} />
      <Route path="/withdrawal-complete" element={<WithdrawalCompletePage />} />
      <Route path="/login" element={<AuthLanding mode="login" />} />
      <Route path="/signup" element={<AuthLanding mode="signup" />} />
      <Route path="/login/verify-otp" element={<VerifyOtpPage />} />
      <Route path="*" element={<Navigate to={navigateToDashboardPath()} replace />} />
    </Routes>
  </Suspense>
);

export default PublicInfoRoutes;
