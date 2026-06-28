import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isIOSWebView } from '@/utils/iosbridge';
import { hashToAppPath } from '@/utils/appNavigation';

/** WEB: legacy hash URL を path route へ正規化 */
const AppHashRedirect: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isIOSWebView()) return;
    const hash = location.hash;
    if (!hash || hash === '#') return;

    const target = hashToAppPath(hash);
    if (!target) return;

    const current = `${location.pathname}${location.search}`;
    if (target === current || target.startsWith(`${current}#`)) return;

    navigate(target, { replace: true });
  }, [location.hash, location.pathname, location.search, navigate]);

  return null;
};

export default AppHashRedirect;
