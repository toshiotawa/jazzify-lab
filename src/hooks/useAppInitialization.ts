import { useEffect, useState } from 'react';

interface AppInitializationState {
  isInitialized: boolean;
  initError: string | null;
  initProgress: number;
  retry: () => void;
}

export const useAppInitialization = (): AppInitializationState => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [initProgress, setInitProgress] = useState(0);

  useEffect(() => {
    const initializeApp = async (): Promise<void> => {
      try {
        if (typeof window === 'undefined') {
          throw new Error('Window object not available');
        }
        setInitProgress(0.5);
        setTimeout(() => {
          if (
            typeof AudioContext === 'undefined'
            && typeof (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
              === 'undefined'
          ) {
            console.warn('⚠️ Web Audio API not supported');
          }
          if (typeof navigator !== 'undefined' && navigator.requestMIDIAccess === undefined) {
            console.warn('⚠️ Web MIDI API not supported');
          }
        }, 0);
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 30);
        });
        setInitProgress(1.0);
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error occurred');
        setInitProgress(0);
      }
    };

    const timeoutId = setTimeout(() => {
      void initializeApp();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  const retry = (): void => {
    setInitError(null);
    setIsInitialized(false);
    setInitProgress(0);
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return { isInitialized, initError, initProgress, retry };
};
