import { useEffect, useState } from 'react';

/** window.location.hash を React state として監視 */
export const useHashMonitor = (): string => {
  const [hash, setHash] = useState(() =>
    typeof window === 'undefined' ? '' : window.location.hash,
  );

  useEffect(() => {
    const onHashChange = (): void => {
      setHash(window.location.hash);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return hash;
};

export const getHashBase = (hash: string): string => hash.split('?')[0];
