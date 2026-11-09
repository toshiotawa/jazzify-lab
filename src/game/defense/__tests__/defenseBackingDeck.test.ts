import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DefensePhraseBackingPlayback } from '@/game/defense/defensePhraseBacking';

const startedSources: Array<{ stop: ReturnType<typeof vi.fn> }> = [];

vi.mock('@soundtouchjs/audio-worklet', () => ({ processOffline: vi.fn() }));
vi.mock('@/utils/audioFetchCache', () => ({ fetchCachedFullAudioBuffer: vi.fn() }));

const playback = (): DefensePhraseBackingPlayback => ({
  buffer: { duration: 8 } as AudioBuffer,
  loopStart: 0,
  loopEnd: 2,
  startOffset: 0,
  barCount: 1,
});

const installMockAudioContext = (currentTime = 1): void => {
  startedSources.length = 0;
  class MockGain {
    gain = {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
    };

    connect = vi.fn();

    disconnect = vi.fn();
  }
  class MockSource {
    loop = false;

    loopStart = 0;

    loopEnd = 0;

    buffer: AudioBuffer | null = null;

    connect = vi.fn();

    disconnect = vi.fn();

    stop = vi.fn();

    start = vi.fn(() => {
      startedSources.push(this);
    });
  }
  vi.stubGlobal('AudioContext', class {
    state = 'running';

    get currentTime() {
      return currentTime;
    }

    destination = {};

    createGain() {
      return new MockGain();
    }

    createBufferSource() {
      return new MockSource();
    }
  });
};

describe('defenseBackingDeck pending switch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    startedSources.length = 0;
  });

  it('disposes the previous incoming source when scheduleSwitch is called again', async () => {
    vi.resetModules();
    installMockAudioContext();
    const { defenseBackingDeck } = await import('../defenseBackingDeck');
    defenseBackingDeck.setTransportConfig(120, 4);
    defenseBackingDeck.start(playback());
    const activeCount = startedSources.length;
    defenseBackingDeck.scheduleSwitch(playback());
    const firstIncoming = startedSources[startedSources.length - 1];
    defenseBackingDeck.scheduleSwitch(playback());
    expect(firstIncoming.stop).toHaveBeenCalled();
    expect(startedSources.length - activeCount).toBeLessThanOrEqual(2);
  });

  it('stop the pending incoming source when cancelPendingSwitch is called', async () => {
    vi.resetModules();
    installMockAudioContext();
    const { defenseBackingDeck } = await import('../defenseBackingDeck');
    defenseBackingDeck.setTransportConfig(120, 4);
    defenseBackingDeck.start(playback());
    defenseBackingDeck.scheduleSwitch(playback());
    const incoming = startedSources[startedSources.length - 1];
    defenseBackingDeck.cancelPendingSwitch();
    expect(incoming.stop).toHaveBeenCalled();
  });
});
