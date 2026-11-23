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

const installMockAudioContext = (
  clock: { currentTime: number; outputLatency: number; state?: AudioContextState } = {
    currentTime: 1,
    outputLatency: 0,
  },
): void => {
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
    state: AudioContextState = clock.state ?? 'running';

    get currentTime() {
      return clock.currentTime;
    }

    outputLatency = clock.outputLatency;

    resume = vi.fn(async () => {
      this.state = 'running';
      clock.state = 'running';
    });

    destination = {};

    createGain() {
      return new MockGain();
    }

    createBufferSource() {
      return new MockSource();
    }

    decodeAudioData = vi.fn(async () => ({ duration: 16 }) as AudioBuffer);
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

  it('schedules at the next bar head and resets phrase elapsed on forceNextBar commit', async () => {
    const clock = { currentTime: 1, outputLatency: 0 };
    installMockAudioContext(clock);
    const { defenseBackingDeck } = await import('../defenseBackingDeck');
    defenseBackingDeck.setTransportConfig(120, 4);
    defenseBackingDeck.start({ ...playback(), barCount: 8, loopEnd: 16 });
    // transportStart = 1.15, barSec = 2.0. Move 0.1s into bar 0 (within 1 beat).
    clock.currentTime = 1.25;
    const switchAt = defenseBackingDeck.scheduleSwitch(
      { ...playback(), barCount: 8, loopEnd: 16 },
      { forceNextBar: true },
    );
    expect(switchAt).toBeCloseTo(3.15, 6);
    clock.currentTime = 3.15;
    defenseBackingDeck.commitSwitch();
    expect(defenseBackingDeck.getElapsedFromTransportStart()).toBeCloseTo(0, 6);
  });

  it('forceNextBar switch stays on ctx.currentTime axis with output latency', async () => {
    const clock = { currentTime: 1, outputLatency: 0.1 };
    installMockAudioContext(clock);
    const { defenseBackingDeck } = await import('../defenseBackingDeck');
    defenseBackingDeck.setTransportConfig(120, 4);
    defenseBackingDeck.start({ ...playback(), barCount: 4, loopEnd: 8 });
    clock.currentTime = 3.16;
    const switchAt = defenseBackingDeck.scheduleSwitch(playback(), { forceNextBar: true });
    expect(switchAt).toBeGreaterThanOrEqual(clock.currentTime);
    expect(switchAt).toBeCloseTo(5.15, 6);
    const incoming = startedSources[startedSources.length - 1];
    const startCall = incoming.start.mock.calls[0];
    expect(startCall[0]).toBeGreaterThanOrEqual(clock.currentTime);
  });

  it('clears active transport and stops sources on clearTransportForRestart before endless restart', async () => {
    const clock = { currentTime: 5, outputLatency: 0 };
    installMockAudioContext(clock);
    const { defenseBackingDeck } = await import('../defenseBackingDeck');
    defenseBackingDeck.setTransportConfig(120, 4);
    defenseBackingDeck.start({ ...playback(), barCount: 4, loopEnd: 8 });
    const firstSource = startedSources[startedSources.length - 1];
    clock.currentTime = 10.25;
    expect(defenseBackingDeck.getElapsedFromTransportStart()).toBeCloseTo(5.1, 6);

    defenseBackingDeck.clearTransportForRestart();
    expect(firstSource.stop).toHaveBeenCalled();
    expect(defenseBackingDeck.getElapsedFromTransportStart()).toBeNull();

    defenseBackingDeck.start({ ...playback(), barCount: 4, loopEnd: 8 });
    clock.currentTime = 10.40; // 0.15s start lead elapsed -> exactly bar 0 (Listen)
    expect(defenseBackingDeck.getElapsedFromTransportStart()).toBeCloseTo(0, 6);
  });

  it('starts at bar 0 after ensureContextRunning when context was suspended', async () => {
    const clock = { currentTime: 20, outputLatency: 0, state: 'suspended' as const };
    installMockAudioContext(clock);
    const { defenseBackingDeck } = await import('../defenseBackingDeck');
    const runAt = await defenseBackingDeck.ensureContextRunning();
    expect(runAt).toBe(clock.currentTime);
    defenseBackingDeck.setTransportConfig(120, 4);
    defenseBackingDeck.start({ ...playback(), barCount: 4, loopEnd: 8 });
    clock.currentTime = runAt + 0.15;
    expect(defenseBackingDeck.getElapsedFromTransportStart()).toBeCloseTo(0, 6);
  });

  it('falls back to bundled local sozai path when CDN returns 404', async () => {
    installMockAudioContext();
    const { fetchCachedFullAudioBuffer } = await import('@/utils/audioFetchCache');
    const mockFetch = vi.mocked(fetchCachedFullAudioBuffer);
    mockFetch.mockReset();
    mockFetch.mockRejectedValueOnce(new Error('HTTP 404'));
    mockFetch.mockResolvedValueOnce(new ArrayBuffer(16));

    const { defenseBackingDeck } = await import('../defenseBackingDeck');
    const stage = {
      id: 'cr-1',
      slug: 'cr-1',
      stageNumber: 101,
      title: 'CR',
      titleEn: 'CR',
      bpm: 120,
      beatsPerBar: 4,
      audioRegistrationMode: 'per_phrase' as const,
      audioUrl: null,
      melodyAudioUrl: null,
      progressionBars: null,
      phraseBars: 1,
      audioLoopBars: 8,
      callResponseBars: 1,
      staffLayout: 'treble' as const,
      attackTrigger: 'note' as const,
      keyFifths: 0,
      requiredCompletionCount: 3,
      difficultyLevel: 5,
      surviveSeconds: 96,
      playerHp: 16,
      productionStaffHintMode: 'always' as const,
      productionKeyboardHintMode: 'always' as const,
      playStyle: 'phrase' as const,
      voicingKeyMode: null,
      voicingLowestKey: null,
      voicingStartKey: null,
      voicingMinLowestNote: null,
      playRootOnChordChange: false,
      phrases: [],
      progressionChords: [],
    };
    const phrase = {
      id: 'p1',
      orderIndex: 0,
      title: 'P1',
      audioUrl: 'https://jazzify-cdn.com/sozai/defense-call-response/defense-stage-1-1-cr-phrase-1-bpm120.mp3',
      loopStartMeasure: null,
      loopEndMeasure: null,
      keyFifths: null,
      requiredCompletionCount: null,
      chords: [],
    };
    const prepared = await defenseBackingDeck.preparePhraseBacking(stage, phrase, 1);
    expect(prepared.barCount).toBe(8);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1]?.[0]).toContain('sozai/defense-call-response/defense-stage-1-1-cr-phrase-1-bpm120.mp3');
  });

  it('evicts failed audio cache entries so retries can succeed later', async () => {
    installMockAudioContext();
    const { fetchCachedFullAudioBuffer } = await import('@/utils/audioFetchCache');
    const mockFetch = vi.mocked(fetchCachedFullAudioBuffer);
    mockFetch.mockReset();
    mockFetch.mockRejectedValueOnce(new Error('HTTP 404'));
    mockFetch.mockRejectedValueOnce(new Error('HTTP 404'));
    mockFetch.mockResolvedValueOnce(new ArrayBuffer(16));

    const { defenseBackingDeck } = await import('../defenseBackingDeck');
    const url = 'https://jazzify-cdn.com/sozai/defense-call-response/retry.mp3';
    const stage = {
      id: 'cr-1',
      slug: 'cr-1',
      stageNumber: 101,
      title: 'CR',
      titleEn: 'CR',
      bpm: 120,
      beatsPerBar: 4,
      audioRegistrationMode: 'per_phrase' as const,
      audioUrl: null,
      melodyAudioUrl: null,
      progressionBars: null,
      phraseBars: 1,
      audioLoopBars: 8,
      callResponseBars: 1,
      staffLayout: 'treble' as const,
      attackTrigger: 'note' as const,
      keyFifths: 0,
      requiredCompletionCount: 3,
      difficultyLevel: 5,
      surviveSeconds: 96,
      playerHp: 16,
      productionStaffHintMode: 'always' as const,
      productionKeyboardHintMode: 'always' as const,
      playStyle: 'phrase' as const,
      voicingKeyMode: null,
      voicingLowestKey: null,
      voicingStartKey: null,
      voicingMinLowestNote: null,
      playRootOnChordChange: false,
      phrases: [],
      progressionChords: [],
    };
    const phrase = {
      id: 'p1',
      orderIndex: 0,
      title: 'P1',
      audioUrl: url,
      loopStartMeasure: null,
      loopEndMeasure: null,
      keyFifths: null,
      requiredCompletionCount: null,
      chords: [],
    };
    await expect(defenseBackingDeck.preparePhraseBacking(stage, phrase, 1)).rejects.toThrow();
    const retried = await defenseBackingDeck.preparePhraseBacking(stage, phrase, 1);
    expect(retried.barCount).toBe(8);
  });

  it('falls back to local tutorial root MP3 when CDN returns 404', async () => {
    installMockAudioContext();
    const { fetchCachedFullAudioBuffer } = await import('@/utils/audioFetchCache');
    const mockFetch = vi.mocked(fetchCachedFullAudioBuffer);
    mockFetch.mockReset();
    mockFetch.mockRejectedValueOnce(new Error('HTTP 404'));
    mockFetch.mockResolvedValueOnce(new ArrayBuffer(16));

    const { defenseBackingDeck } = await import('../defenseBackingDeck');
    const { buildDefenseTutorialPhrase, defaultTutorialNotationSettings } = await import(
      '@/game/defense/tutorial/buildDefenseTutorialPhrase'
    );
    const { stage, phrase } = buildDefenseTutorialPhrase(defaultTutorialNotationSettings('trumpet_bb'));
    expect(phrase.audioUrl).toBe(
      'https://jazzify-cdn.com/sozai/defense-call-response/defense-tutorial-call-response-root-58-bpm60.mp3',
    );
    const prepared = await defenseBackingDeck.preparePhraseBacking(stage, phrase, 1);
    expect(prepared.barCount).toBe(8);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1]?.[0]).toContain(
      'sozai/defense-call-response/defense-tutorial-call-response-root-58-bpm60.mp3',
    );
  });
});
