import { useEffect } from 'react';
import { devLog } from '@/utils/logger';

type PianoPreloadStatus = 'idle' | 'loading' | 'ready' | 'error';

let preloadPromise: Promise<void> | null = null;
let status: PianoPreloadStatus = 'idle';

const runHighQualityPreload = async (): Promise<void> => {
  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = (async () => {
    try {
      status = 'loading';
      const [{ initializeAudioSystem, upgradeAudioSystemToFull }] = await Promise.all([
        import('@/utils/MidiController'),
      ]);

      await initializeAudioSystem({ light: false });
      await upgradeAudioSystemToFull();

      status = 'ready';
      devLog.debug('🎹 高音質ピアノのプリロードが完了しました');
    } catch (error) {
      status = 'error';
      preloadPromise = null;
      devLog.warn('⚠️ 高音質ピアノのプリロードに失敗しました', error);
      throw error;
    }
  })();

  return preloadPromise;
};

export const preloadHighQualityPiano = (): Promise<void> => runHighQualityPreload();

export const useHighQualityPianoPreload = (label: string = 'default'): void => {
  useEffect(() => {
    let isMounted = true;

    runHighQualityPreload().catch((error) => {
      if (!isMounted) {
        return;
      }
      devLog.warn('⚠️ useHighQualityPianoPreload: プリロードに失敗しました', { label, error });
    });

    return () => {
      isMounted = false;
    };
  }, [label]);
};

export const getHighQualityPianoStatus = (): PianoPreloadStatus => status;
