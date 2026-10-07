import { vi } from 'vitest';

const { instrument, play, voice } = vi.hoisted(() => {
  const voice = { connect: vi.fn(), disconnect: vi.fn(), stop: vi.fn() };
  const play = vi.fn(() => voice);
  return { instrument: vi.fn(async () => ({ play })), play, voice };
});
vi.mock('soundfont-player', () => ({ default: { instrument } }));
vi.mock('tone', () => ({}));
vi.mock('@/platform', () => ({ getWindow: () => window }));
vi.mock('@/utils/iosbridge', () => ({ requestWebPlaybackAudioSession: vi.fn() }));

describe('shared piano output volume', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('changes the live gain without multiplying note velocity twice and routes each voice through it', async () => {
    vi.resetModules();
    const gains: { gain: { value: number; setValueAtTime: ReturnType<typeof vi.fn> }; connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = [];
    vi.stubGlobal('AudioContext', class {
      state = 'running';
      currentTime = 10;
      destination = {};
      createGain() {
        const gain = { gain: { value: 1, setValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() };
        gains.push(gain);
        return gain;
      }
    });
    const { FantasySoundManager } = await import('@/utils/FantasySoundManager');
    FantasySoundManager.setGMPianoVolume(0.25);
    await FantasySoundManager.preloadGM();
    expect(gains[0].gain.value).toBe(0.25);
    await FantasySoundManager.playGMNote(60, 0.5);
    expect(play).toHaveBeenCalledWith('60', 10, expect.objectContaining({ gain: 4 }));
    expect(voice.disconnect).toHaveBeenCalled();
    expect(voice.connect).toHaveBeenCalledWith(gains[1]);
    expect(gains[1].connect).toHaveBeenCalledWith(gains[0]);
    FantasySoundManager.setGMPianoVolume(0);
    expect(gains[0].gain.setValueAtTime).toHaveBeenLastCalledWith(0, 10);
    const calls = play.mock.calls.length;
    await FantasySoundManager.playGMNote(62, 0.5);
    expect(play).toHaveBeenCalledTimes(calls);
    FantasySoundManager.setGMPianoVolume(0.6);
    expect(gains[0].gain.setValueAtTime).toHaveBeenLastCalledWith(0.6, 10);
  });
});
