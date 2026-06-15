import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { preloadFireMagicSe, unlockFireMagicSe } from '@/utils/earTrainingFireMagicSe';
import { initializeAudioSystem, playNote, stopNote } from '@/utils/MidiController';

const TUTORIAL_PREVIEW_NOTE_MS = 420;

type TutorialPreviewAudioMode = 'gm' | 'fm' | 'legend';

async function resolveTutorialPreviewAudioMode(
  waitInit?: Promise<void>,
): Promise<TutorialPreviewAudioMode | null> {
  try {
    if (waitInit) {
      await waitInit;
    }
    await FantasySoundManager.waitForGMReady();
    FantasySoundManager.ensureContextsRunning();
    if (!FantasySoundManager.isGmAudioRunning()) {
      await FantasySoundManager.unlock();
      FantasySoundManager.ensureContextsRunning();
    }
    if (FantasySoundManager.isGmAudioRunning()) {
      return 'gm';
    }
    if (FantasySoundManager.isFMSynthReady()) {
      return 'fm';
    }
    if (FantasySoundManager.isGMReady()) {
      return 'gm';
    }
    return 'legend';
  } catch {
    return null;
  }
}

function playTutorialPreviewNote(midi: number, mode: TutorialPreviewAudioMode): void {
  if (mode === 'gm') {
    void playNote(midi, 90);
    window.setTimeout(() => stopNote(midi), TUTORIAL_PREVIEW_NOTE_MS);
    return;
  }
  if (mode === 'fm') {
    FantasySoundManager.playFMNote(midi, 0.85);
    return;
  }
  FantasySoundManager.playLegendBgmDemoNote(
    midi,
    TUTORIAL_PREVIEW_NOTE_MS / 1000,
    0.75,
  );
}

/** ユーザー操作直後に呼び、チュートリアル用 GM ピアノを解放する */
export async function unlockTutorialAudio(): Promise<void> {
  try {
    preloadFireMagicSe();
    unlockFireMagicSe();
    await Promise.all([
      initializeAudioSystem(),
      FantasySoundManager.init(0.8, 0.7, true),
    ]);
    FantasySoundManager.ensureContextsRunning();
    await FantasySoundManager.unlock();
    await FantasySoundManager.waitForGMReady();
    unlockFireMagicSe();
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
  const mode = await resolveTutorialPreviewAudioMode(waitInit);
  if (mode === null) return;
  for (const m of midis) {
    playTutorialPreviewNote(m, mode);
  }
}

export function releaseTutorialPianoAudio(): void {
  FantasySoundManager.releaseAllGmNotes();
}
