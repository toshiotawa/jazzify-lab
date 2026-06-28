import { FantasySoundManager } from '@/utils/FantasySoundManager';
import {
  initializeAudioSystem,
  updateGlobalVolume,
  warmupIOSBattleSoundFonts,
} from '@/utils/MidiController';
import { isIOSWebView } from '@/utils/iosbridge';

export interface BattlePianoAudioSettings {
  midiVolume?: number;
  soundEffectVolume?: number;
  rootSoundVolume?: number;
}

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

  await Promise.all([
    initializeAudioSystem().then(() => {
      updateGlobalVolume(midiVol);
    }),
    FantasySoundManager.init(seVol, rootVol, true),
  ]);
  void FantasySoundManager.waitForGMReady().catch(() => undefined);
};
