import { fetchCachedFullAudioBuffer } from '@/utils/audioFetchCache';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import {
  initializeAudioSystem,
  updateGlobalVolume,
  warmupIOSBattleSoundFonts,
} from '@/utils/MidiController';
import { isIOSWebView } from '@/utils/iosbridge';

const BATTLE_COUNT_IN_CLICK_URL = '/drumstick-count.mp3';

export interface BattlePianoAudioSettings {
  midiVolume?: number;
  soundEffectVolume?: number;
  rootSoundVolume?: number;
}

/** ロビー表示中などに GM ピアノの読込を開始する（非ブロッキング） */
export const preloadBattleGmPiano = (): void => {
  void FantasySoundManager.preloadGM().catch(() => undefined);
};

/** dialogue / ロビー中に GM ピアノの読込完了を待つ */
export const preloadBattleGmPianoAsync = async (): Promise<void> => {
  try {
    await FantasySoundManager.preloadGM();
    await FantasySoundManager.waitForGMReady();
  } catch {
    /* noop */
  }
};

/** カウントインクリック MP3 を先読みする */
export const preloadBattleCountInClick = (): void => {
  void fetchCachedFullAudioBuffer(BATTLE_COUNT_IN_CLICK_URL).catch(() => undefined);
};

export const ensureBattlePianoAudio = async (
  settings: BattlePianoAudioSettings,
): Promise<void> => {
  const seVol = settings.soundEffectVolume ?? 0.8;
  const rootVol = settings.rootSoundVolume ?? 0.7;
  const midiVol = settings.midiVolume ?? 0.8;

  FantasySoundManager.setRootVolume(rootVol);
  FantasySoundManager.enableRootSound(false);
  warmupIOSBattleSoundFonts();

  if (isIOSWebView()) {
    await FantasySoundManager.init(seVol, rootVol, true).catch(() => undefined);
    await initializeAudioSystem().catch(() => undefined);
    updateGlobalVolume(midiVol);
    return;
  }

  await FantasySoundManager.waitForGMReady().catch(() => undefined);

  if (FantasySoundManager.isGMReady()) {
    updateGlobalVolume(midiVol);
  } else {
    await initializeAudioSystem().then(() => {
      updateGlobalVolume(midiVol);
    }).catch(() => undefined);
  }

  void FantasySoundManager.init(seVol, rootVol, true).catch(() => undefined);
};
