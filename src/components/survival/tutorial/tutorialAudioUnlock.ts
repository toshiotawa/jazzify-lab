import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { initializeAudioSystem, playNote, stopNote } from '@/utils/MidiController';

/** ユーザー操作直後に呼び、チュートリアル用 GM ピアノを解放する */
export async function unlockTutorialAudio(): Promise<void> {
  try {
    await Promise.all([
      initializeAudioSystem(),
      FantasySoundManager.init(0.8, 0.7, true),
    ]);
    FantasySoundManager.ensureContextsRunning();
    await FantasySoundManager.unlock();
  } catch {
    /* noop */
  }
}

export function isTutorialPianoAudioReady(): boolean {
  return FantasySoundManager.isGMReady() && FantasySoundManager.isGmAudioRunning();
}

export async function playTutorialChordPreview(
  midis: readonly number[],
  waitInit?: Promise<void>,
): Promise<void> {
  if (midis.length === 0) return;
  try {
    if (waitInit) await waitInit;
  } catch {
    /* noop */
  }
  if (!isTutorialPianoAudioReady()) return;
  for (const m of midis) {
    void playNote(m, 90);
    window.setTimeout(() => stopNote(m), 420);
  }
}

export function releaseTutorialPianoAudio(): void {
  FantasySoundManager.releaseAllGmNotes();
}
