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

const installMockAudioContext = (clock = { currentTime: 1, outputLatency: 0 }): void => {
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
      return clock.currentTime;
    }

    outputLatency = clock.outputLatency;

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

  it('waits for audible output and follows the four-bar recording across its loop point', async () => {
    const clock = { currentTime: 1, outputLatency: 0.1 };
    installMockAudioContext(clock);
    const { defenseBackingDeck } = await import('../defenseBackingDeck');
    defenseBackingDeck.setTransportConfig(160, 4);
    defenseBackingDeck.start({ ...playback(), barCount: 4, loopEnd: 6 });

    clock.currentTime = 1.24; // 150 ms scheduling lead plus 100 ms of device latency
    expect(defenseBackingDeck.getBeatInLoop()).toBeNull();
    for (const [seconds, beat] of [[0, 0], [1.5, 4], [3, 8], [4.5, 12], [6, 0]]) {
      clock.currentTime = 1.25 + seconds;
      expect(defenseBackingDeck.getBeatInLoop()).toBeCloseTo(beat);
    }
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
