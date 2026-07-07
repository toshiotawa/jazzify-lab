import { useGameStore } from '@/stores/gameStore';
import {
  initializeAudioSystem,
  updateGlobalVolume,
  warmupIOSBattleSoundFonts,
} from '@/utils/MidiController';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { isIOSWebView } from '@/utils/iosbridge';

let survivalAudioPreparePromise: Promise<void> | null = null;

/** サバイバル戦闘開始前に GM / SF2 / 共通 MIDI を読み込む（ロビー表示では呼ばない） */
export const ensureSurvivalBattleAudio = (): Promise<void> => {
  if (survivalAudioPreparePromise) {
    return survivalAudioPreparePromise;
  }
  survivalAudioPreparePromise = doEnsureSurvivalBattleAudio().catch((error: unknown) => {
    survivalAudioPreparePromise = null;
    throw error;
  });
  return survivalAudioPreparePromise;
};

const doEnsureSurvivalBattleAudio = async (): Promise<void> => {
  const { soundEffectVolume, rootSoundVolume, midiVolume } = useGameStore.getState().settings;
  const seVol = soundEffectVolume ?? 0.8;
  const rootVol = rootSoundVolume ?? 0.7;

  FantasySoundManager.setRootVolume(rootVol);
  FantasySoundManager.enableRootSound(true);
  warmupIOSBattleSoundFonts();
  FantasySoundManager.preloadCorrectRootBassSoundFont().catch(() => undefined);

  if (isIOSWebView()) {
    await FantasySoundManager.init(seVol, rootVol, true).catch(() => undefined);
    return;
  }

  await Promise.all([
    initializeAudioSystem().then(() => {
      updateGlobalVolume(midiVolume ?? 0.8);
    }),
    FantasySoundManager.init(seVol, rootVol, true).then(() => {
      FantasySoundManager.enableRootSound(true);
    }),
  ]);
  FantasySoundManager.ensureContextsRunning();
};
