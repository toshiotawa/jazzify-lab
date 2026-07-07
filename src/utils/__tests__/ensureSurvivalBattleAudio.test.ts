import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/stores/gameStore', () => ({
  useGameStore: {
    getState: vi.fn(() => ({
      settings: {
        soundEffectVolume: 0.8,
        rootSoundVolume: 0.7,
        midiVolume: 0.9,
      },
    })),
  },
}));

vi.mock('@/utils/FantasySoundManager', () => ({
  FantasySoundManager: {
    setRootVolume: vi.fn(),
    enableRootSound: vi.fn(),
    preloadCorrectRootBassSoundFont: vi.fn(() => Promise.resolve()),
    init: vi.fn(() => Promise.resolve()),
    ensureContextsRunning: vi.fn(),
  },
}));

vi.mock('@/utils/MidiController', () => ({
  initializeAudioSystem: vi.fn(() => Promise.resolve()),
  updateGlobalVolume: vi.fn(),
  warmupIOSBattleSoundFonts: vi.fn(),
}));

vi.mock('@/utils/iosbridge', () => ({
  isIOSWebView: vi.fn(() => false),
}));

const loadModule = async () => {
  vi.resetModules();
  const { FantasySoundManager } = await import('@/utils/FantasySoundManager');
  const { initializeAudioSystem, updateGlobalVolume } = await import('@/utils/MidiController');
  const { isIOSWebView } = await import('@/utils/iosbridge');
  const { ensureSurvivalBattleAudio } = await import('@/utils/ensureSurvivalBattleAudio');
  return {
    ensureSurvivalBattleAudio,
    FantasySoundManager,
    initializeAudioSystem,
    updateGlobalVolume,
    isIOSWebView,
  };
};

describe('ensureSurvivalBattleAudio', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('GM / SF2 / Tone を並列で初期化する', async () => {
    const {
      ensureSurvivalBattleAudio,
      FantasySoundManager,
      initializeAudioSystem,
      updateGlobalVolume,
    } = await loadModule();

    await ensureSurvivalBattleAudio();

    expect(FantasySoundManager.preloadCorrectRootBassSoundFont).toHaveBeenCalled();
    expect(initializeAudioSystem).toHaveBeenCalled();
    expect(FantasySoundManager.init).toHaveBeenCalled();
    expect(updateGlobalVolume).toHaveBeenCalledWith(0.9);
    expect(FantasySoundManager.ensureContextsRunning).toHaveBeenCalled();
  });

  it('2 回目の呼び出しは同じ Promise を再利用する', async () => {
    const { ensureSurvivalBattleAudio, initializeAudioSystem } = await loadModule();

    const first = ensureSurvivalBattleAudio();
    const second = ensureSurvivalBattleAudio();

    expect(first).toBe(second);
    await first;

    expect(initializeAudioSystem).toHaveBeenCalledTimes(1);
  });

  it('iOS WebView では FantasySoundManager のみ初期化する', async () => {
    const {
      ensureSurvivalBattleAudio,
      FantasySoundManager,
      initializeAudioSystem,
      isIOSWebView,
    } = await loadModule();
    vi.mocked(isIOSWebView).mockReturnValue(true);

    await ensureSurvivalBattleAudio();

    expect(FantasySoundManager.init).toHaveBeenCalled();
    expect(initializeAudioSystem).not.toHaveBeenCalled();
  });
});
