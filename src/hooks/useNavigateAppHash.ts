import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { hashToAppPath, normalizeAppHash, setAppHash } from '@/utils/appNavigation';
import { isIOSWebView } from '@/utils/iosbridge';

/**
 * WEB の play ルート間をフルリロードせず遷移する。
 * `setAppHash` の `location.assign` だと AudioContext が切れて OSMD が無音・未開始になる。
 */
export const useNavigateAppHash = (): ((hash: string) => void) => {
  const navigate = useNavigate();
  return useCallback((hash: string) => {
    const normalized = normalizeAppHash(hash);
    if (isIOSWebView()) {
      window.location.hash = normalized;
      return;
    }
    const path = hashToAppPath(normalized);
    if (path) {
      navigate(path);
      return;
    }
    setAppHash(normalized);
  }, [navigate]);
};
