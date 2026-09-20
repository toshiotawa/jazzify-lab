import {
  buildDefensePhraseBackingPlayback,
  prepareDefensePhraseBackingPlayback,
  resolveDefensePhrasePreloadUrls,
  sliceAudioBuffer,
} from '@/game/defense/defensePhraseBacking';
import type { DefensePhrase, DefenseStage } from '@/game/defense/defenseTypes';

const createMockAudioContext = (sampleRate = 44100): AudioContext => ({
  sampleRate,
  createBuffer: (channels: number, length: number, rate: number) => {
    const channelData = Array.from({ length: channels }, () => new Float32Array(length));
    return {
      numberOfChannels: channels,
      length,
      sampleRate: rate,
      duration: length / rate,
      getChannelData: (channel: number) => channelData[channel] ?? new Float32Array(length),
    } as AudioBuffer;
  },
} as AudioContext);

const createTestBuffer = (ctx: AudioContext, durationSec: number): AudioBuffer => (
  ctx.createBuffer(1, Math.ceil(durationSec * ctx.sampleRate), ctx.sampleRate)
);

const baseStage = (overrides: Partial<DefenseStage> = {}): DefenseStage => ({
  id: 'stage-1',
  slug: 'stage-1',
  stageNumber: 1,
  title: 'Stage',
  titleEn: 'Stage',
  bpm: 120,
  beatsPerBar: 4,
  audioRegistrationMode: 'single_source',
  audioUrl: 'https://example.com/shared.mp3',
  melodyAudioUrl: null,
  progressionBars: null,
  phraseBars: 4,
  staffLayout: 'treble',
  attackTrigger: 'note',
  keyFifths: 0,
  requiredCompletionCount: 1,
  difficultyLevel: 1,
  surviveSeconds: 120,
  playerHp: 5,
  productionStaffHintMode: 'fade_15s',
  productionKeyboardHintMode: 'fade_15s',
  phrases: [],
  progressionChords: [],
  ...overrides,
});

const phrase = (overrides: Partial<DefensePhrase> = {}): DefensePhrase => ({
  id: 'phrase-1',
  orderIndex: 0,
  title: 'Phrase',
  audioUrl: 'https://example.com/shared.mp3',
  loopStartMeasure: 1,
  loopEndMeasure: 4,
  keyFifths: null,
  requiredCompletionCount: null,
  chords: [],
  ...overrides,
});

describe('resolveDefensePhrasePreloadUrls', () => {
  it('preloads only the shared stage URL for single_source stages', () => {
    const stage = baseStage({
      phrases: [
        phrase({ id: 'p1', orderIndex: 0, loopStartMeasure: 1, loopEndMeasure: 4 }),
        phrase({ id: 'p2', orderIndex: 1, loopStartMeasure: 5, loopEndMeasure: 8 }),
      ],
    });
    expect(resolveDefensePhrasePreloadUrls(stage, [0, 1])).toEqual([
      'https://example.com/shared.mp3',
    ]);
  });

  it('preloads all phrase URLs for shared_progression stages', () => {
    const stage = baseStage({
      audioRegistrationMode: 'shared_progression',
      progressionBars: 12,
      phraseBars: 4,
      audioUrl: null,
      phrases: [
        phrase({ audioUrl: 'https://example.com/a.mp3', loopStartMeasure: null, loopEndMeasure: null }),
        phrase({ id: 'p2', orderIndex: 1, audioUrl: 'https://example.com/b.mp3', loopStartMeasure: null, loopEndMeasure: null }),
      ],
    });
    expect(resolveDefensePhrasePreloadUrls(stage, [0])).toEqual([
      'https://example.com/a.mp3',
      'https://example.com/b.mp3',
    ]);
  });

  it('preloads per-phrase URLs for per_phrase stages', () => {
    const stage = baseStage({
      audioRegistrationMode: 'per_phrase',
      audioUrl: null,
      phrases: [
        phrase({ audioUrl: 'https://example.com/a.mp3', loopStartMeasure: null, loopEndMeasure: null }),
        phrase({ id: 'p2', orderIndex: 1, audioUrl: 'https://example.com/b.mp3', loopStartMeasure: null, loopEndMeasure: null }),
      ],
    });
    expect(resolveDefensePhrasePreloadUrls(stage, [0, 1])).toEqual([
      'https://example.com/a.mp3',
      'https://example.com/b.mp3',
    ]);
  });

  it('preloads only stage BGM and melody URLs for separate tracks stages', () => {
    const stage = baseStage({
      audioRegistrationMode: 'shared_progression_separate_tracks',
      audioUrl: 'https://example.com/bgm.wav',
      melodyAudioUrl: 'https://example.com/melody.wav',
      progressionBars: 12,
      phraseBars: 2,
      phrases: [
        phrase({ audioUrl: '', loopStartMeasure: 1, loopEndMeasure: 2 }),
        phrase({ id: 'p2', orderIndex: 1, audioUrl: '', loopStartMeasure: 3, loopEndMeasure: 4 }),
      ],
    });
    expect(resolveDefensePhrasePreloadUrls(stage, [0, 1])).toEqual([
      'https://example.com/bgm.wav',
      'https://example.com/melody.wav',
    ]);
  });
});

describe('buildDefensePhraseBackingPlayback', () => {
  it('shares one buffer with loopStart/loopEnd for single_source at normal speed', () => {
    const ctx = createMockAudioContext();
    const decoded = createTestBuffer(ctx, 32);
    const playback = buildDefensePhraseBackingPlayback(
      decoded,
      baseStage(),
      phrase({ loopStartMeasure: 5, loopEndMeasure: 8 }),
      ctx,
    );
    expect(playback.buffer).toBe(decoded);
    expect(playback.loopStart).toBeCloseTo(8);
    expect(playback.loopEnd).toBeCloseTo(16);
    expect(playback.startOffset).toBeCloseTo(8);
    expect(playback.barCount).toBe(4);
  });

  it('uses progressionBars for shared_progression barCount', () => {
    const ctx = createMockAudioContext();
    const decoded = createTestBuffer(ctx, 24);
    const playback = buildDefensePhraseBackingPlayback(
      decoded,
      baseStage({
        audioRegistrationMode: 'shared_progression',
        progressionBars: 12,
        phraseBars: 4,
        audioUrl: null,
      }),
      phrase({ loopStartMeasure: null, loopEndMeasure: null }),
      ctx,
    );
    expect(playback.barCount).toBe(12);
    expect(playback.startOffset).toBe(0);
  });

  it('falls back to stage phraseBars when loop measures are absent', () => {
    const ctx = createMockAudioContext();
    const decoded = createTestBuffer(ctx, 8);
    const playback = buildDefensePhraseBackingPlayback(
      decoded,
      baseStage({
        audioRegistrationMode: 'per_phrase',
        audioUrl: null,
        phraseBars: 8,
      }),
      phrase({ loopStartMeasure: null, loopEndMeasure: null }),
      ctx,
    );
    expect(playback.barCount).toBe(8);
    expect(playback.loopEnd).toBeCloseTo(8);
  });

  it('prepares sliced playback before speed change for single_source stages', async () => {
    const ctx = createMockAudioContext();
    const decoded = createTestBuffer(ctx, 32);
    const playback = await prepareDefensePhraseBackingPlayback(
      ctx,
      baseStage(),
      phrase(),
      0.8,
      async () => decoded,
      async (buffer) => buffer,
    );
    expect(playback.buffer).not.toBe(decoded);
    expect(playback.buffer.duration).toBeCloseTo(10);
    expect(playback.loopStart).toBe(0);
    expect(playback.loopEnd).toBeCloseTo(10);
    expect(playback.barCount).toBe(4);
  });

  it('snaps stretched playback to the musical loop duration', async () => {
    const ctx = createMockAudioContext();
    const decoded = createTestBuffer(ctx, 32);
    const playback = await prepareDefensePhraseBackingPlayback(
      ctx,
      baseStage(),
      phrase(),
      0.8,
      async () => decoded,
      async (buffer) => ctx.createBuffer(1, buffer.length + 180, buffer.sampleRate),
    );
    expect(playback.loopEnd).toBeCloseTo(10);
    expect(playback.buffer.duration).toBeCloseTo(10);
  });
});

describe('sliceAudioBuffer', () => {
  it('copies the requested time range', () => {
    const ctx = createMockAudioContext();
    const source = createTestBuffer(ctx, 4);
    source.getChannelData(0).fill(0.5, 44100 * 2, 44100 * 3);
    const sliced = sliceAudioBuffer(ctx, source, 2, 3);
    expect(sliced.duration).toBeCloseTo(1);
    expect(sliced.getChannelData(0)[0]).toBeCloseTo(0.5);
  });
});
