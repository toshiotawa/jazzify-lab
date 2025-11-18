/**
 * 高音質ピアノ音源のプリロードを一元管理
 * - ファンタジー/レジェンド/レッスン各画面で共有し、重複ロードを防ぐ
 */

import { devLog } from '@/utils/logger';

let preloadPromise: Promise<void> | null = null;

export const preloadHighQualityPiano = async (): Promise<void> => {
  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = (async () => {
    try {
      const midiModule = await import('@/utils/MidiController');
      if (typeof midiModule.initializeAudioSystem === 'function') {
        await midiModule.initializeAudioSystem({ light: false });
      }
      if (typeof midiModule.upgradeAudioSystemToFull === 'function') {
        await midiModule.upgradeAudioSystemToFull();
      }
    } catch (error) {
      devLog.error('高音質ピアノのプリロードに失敗しました:', error);
      preloadPromise = null;
      throw error;
    }
  })();

  return preloadPromise;
};
