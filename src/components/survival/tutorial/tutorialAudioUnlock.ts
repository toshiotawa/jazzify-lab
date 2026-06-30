import { preloadFireMagicSe, unlockFireMagicSe } from '@/utils/earTrainingFireMagicSe';
import { preloadBattleGmPianoAsync } from '@/utils/ensureBattlePianoAudio';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { playNote, stopNote } from '@/utils/MidiController';

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
  FantasySoundManager.playTutorialBgmDemoNote(
    midi,
    TUTORIAL_PREVIEW_NOTE_MS / 1000,
    0.75,
  );
}

/** ユーザー操作直後に呼び、チュートリアル用オーディオコンテキストを解放する（軽量） */
export async function unlockTutorialAudio(): Promise<void> {
  try {
    preloadFireMagicSe();
    unlockFireMagicSe();
    await FantasySoundManager.unlock();
    FantasySoundManager.ensureContextsRunning();
    unlockFireMagicSe();
  } catch {
    /* noop */
  }
}

/** dialogue 中にバトル用 GM ピアノを先読みする */
export async function preloadTutorialBattleAudio(): Promise<void> {
  await preloadBattleGmPianoAsync();
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

const demoSustainMidis = new Set<number>();
let demoSustainMode: TutorialPreviewAudioMode | null = null;

async function ensureDemoSustainMode(waitInit?: Promise<void>): Promise<TutorialPreviewAudioMode | null> {
  if (demoSustainMode !== null) {
    return demoSustainMode;
  }
  demoSustainMode = await resolveTutorialPreviewAudioMode(waitInit);
  return demoSustainMode;
}

function playDemoSustainNote(midi: number, mode: TutorialPreviewAudioMode): void {
  if (mode === 'gm') {
    void playNote(midi, 90);
    return;
  }
  if (mode === 'fm') {
    FantasySoundManager.playFMNote(midi, 0.85);
    return;
  }
  FantasySoundManager.playTutorialBgmDemoNote(midi, 8, 0.75);
}

function stopDemoSustainNote(midi: number, mode: TutorialPreviewAudioMode): void {
  if (mode === 'gm' || mode === 'legend') {
    stopNote(midi);
    return;
  }
  if (mode === 'fm') {
    FantasySoundManager.stopFMNote(midi);
  }
}

/** demo ロール和音: 新音のみ sustain 発音(既存 sustain 音は維持)。 */
export async function playDemoSustainNotes(
  midis: readonly number[],
  waitInit?: Promise<void>,
): Promise<void> {
  if (midis.length === 0) return;
  const mode = await ensureDemoSustainMode(waitInit);
  if (mode === null) return;
  for (const midi of midis) {
    if (demoSustainMidis.has(midi)) continue;
    playDemoSustainNote(midi, mode);
    demoSustainMidis.add(midi);
  }
}

/** demo ロール和音: sustain 中の音を note-off。引数省略時は全 release。 */
export function releaseDemoSustainNotes(midis?: readonly number[]): void {
  const mode = demoSustainMode;
  if (mode === null) {
    demoSustainMidis.clear();
    return;
  }
  const targets = midis ?? [...demoSustainMidis];
  for (const midi of targets) {
    if (!demoSustainMidis.has(midi)) continue;
    stopDemoSustainNote(midi, mode);
    demoSustainMidis.delete(midi);
  }
}

export function releaseTutorialPianoAudio(): void {
  releaseDemoSustainNotes();
  FantasySoundManager.releaseAllGmNotes();
}
