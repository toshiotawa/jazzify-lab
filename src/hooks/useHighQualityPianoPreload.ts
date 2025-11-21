import { useEffect } from 'react';
import { devLog } from '@/utils/logger';

let preloadPromise: Promise<void> | null = null;

/**
 * 高音質ピアノ音源のロードを保証する
 * - 既にロード済みの場合は同じ Promise を共有
 * - 軽量音源のみ初期化済みの場合はアップグレードを実行
 */
export const ensureHighQualityPianoLoaded = async (): Promise<void> => {
  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = (async () => {
    const {
      initializeAudioSystem,
      upgradeAudioSystemToFull,
    } = await import('@/utils/MidiController');

    try {
      await initializeAudioSystem({ light: false });
    } catch (error) {
      // 既に初期化済みの場合などはエラーになることがあるため、デバッグログのみに留める
      devLog.debug('High-quality piano init skipped or already initialized', error);
    }

    await upgradeAudioSystemToFull();
    devLog.info('🎹 High-quality piano samples are ready');
  })().catch((error) => {
    preloadPromise = null;
    throw error;
  });

  return preloadPromise;
};

/**
 * ページ表示時に自動的に高音質ピアノをプリロードするフック
 */
export const useHighQualityPianoPreload = (options?: { enabled?: boolean }): void => {
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    ensureHighQualityPianoLoaded().catch((error) => {
      if (cancelled) {
        return;
      }
      devLog.error('Failed to preload high-quality piano', error);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);
};
