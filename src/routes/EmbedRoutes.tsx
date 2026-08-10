import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const EmbedCodeRunPage = React.lazy(() => import('@/embed/EmbedCodeRunPage'));

const PageFallback: React.FC = () => (
  <div className="flex min-h-screen w-full items-center justify-center bg-black text-white">
    Loading...
  </div>
);

const EmbedRoutes: React.FC = () => (
  <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/embed/code-run" element={<EmbedCodeRunPage />} />
    </Routes>
  </Suspense>
);

export default EmbedRoutes;
