import { useEffect } from 'react';
import { devLog } from '@/utils/logger';

interface PianoPreloadOptions {
  enabled?: boolean;
  context?: string;
}

let preloadPromise: Promise<void> | null = null;

const isBrowser = typeof window !== 'undefined';

export const preloadHighQualityPiano = (context?: string): Promise<void> => {
  if (!isBrowser) {
    return Promise.resolve();
  }

  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = (async () => {
    try {
      const { initializeAudioSystem, upgradeAudioSystemToFull } = await import('@/utils/MidiController');
      // 初期化済みであっても safety のためにフルモードを要求
      await initializeAudioSystem({ light: false });
      await upgradeAudioSystemToFull();
      devLog.debug('🎹 高音質ピアノプリロード完了', { context });
    } catch (error) {
      devLog.debug('⚠️ 高音質ピアノプリロードに失敗', { context, error });
      preloadPromise = null; // 再試行を許可
      throw error;
    }
  })();

  return preloadPromise;
};

export const useHighQualityPianoPreload = (options?: PianoPreloadOptions): void => {
  const { enabled = true, context } = options || {};

  useEffect(() => {
    if (!enabled) return;

    preloadHighQualityPiano(context).catch(() => {
      // エラーは devLog で処理済み。ユーザー操作後に再試行される。
    });

  }, [enabled, context]);
};

