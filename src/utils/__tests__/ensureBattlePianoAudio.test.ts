import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/FantasySoundManager', () => ({
  FantasySoundManager: {
    preloadGM: vi.fn(() => Promise.resolve()),
    waitForGMReady: vi.fn(() => Promise.resolve()),
    isGMReady: vi.fn(() => true),
    setRootVolume: vi.fn(),
    enableRootSound: vi.fn(),
    init: vi.fn(() => Promise.resolve()),
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

vi.mock('@/utils/audioFetchCache', () => ({
  fetchCachedFullAudioBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(4))),
}));

const { FantasySoundManager } = await import('@/utils/FantasySoundManager');
const { initializeAudioSystem, updateGlobalVolume } = await import('@/utils/MidiController');
const { fetchCachedFullAudioBuffer } = await import('@/utils/audioFetchCache');
const {
  ensureBattlePianoAudio,
  preloadBattleCountInClick,
  preloadBattleGmPiano,
} = await import('@/utils/ensureBattlePianoAudio');

describe('ensureBattlePianoAudio', () => {
  beforeEach(() => {
    vi.mocked(FantasySoundManager.isGMReady).mockReturnValue(true);
    vi.mocked(FantasySoundManager.preloadGM).mockResolvedValue(undefined);
    vi.mocked(FantasySoundManager.waitForGMReady).mockResolvedValue(undefined);
    vi.mocked(FantasySoundManager.init).mockResolvedValue(undefined);
    vi.mocked(initializeAudioSystem).mockResolvedValue(undefined);
    vi.mocked(fetchCachedFullAudioBuffer).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('preloadBattleGmPiano は GM 先読みを開始する', () => {
    preloadBattleGmPiano();
    expect(FantasySoundManager.preloadGM).toHaveBeenCalledTimes(1);
  });

  it('preloadBattleCountInClick はカウントイン MP3 を先読みする', () => {
    preloadBattleCountInClick();
    expect(fetchCachedFullAudioBuffer).toHaveBeenCalledWith('/drumstick-count.mp3');
  });

  it('GM 準備済みなら Tone 初期化をスキップする', async () => {
    await ensureBattlePianoAudio({ midiVolume: 0.7 });

    expect(FantasySoundManager.waitForGMReady).toHaveBeenCalled();
    expect(updateGlobalVolume).toHaveBeenCalledWith(0.7);
    expect(initializeAudioSystem).not.toHaveBeenCalled();
    expect(FantasySoundManager.init).toHaveBeenCalled();
  });

  it('GM 未準備なら Tone 初期化にフォールバックする', async () => {
    vi.mocked(FantasySoundManager.isGMReady).mockReturnValue(false);

    await ensureBattlePianoAudio({ midiVolume: 0.6 });

    expect(initializeAudioSystem).toHaveBeenCalled();
    expect(updateGlobalVolume).toHaveBeenCalledWith(0.6);
  });
});
