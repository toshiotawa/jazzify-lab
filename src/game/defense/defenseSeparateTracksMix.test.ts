import { describe, expect, it } from 'vitest';

import {
  computeSeparateTracksGrid,
  type SeparateTracksGrid,
} from '@/game/defense/defenseSeparateTracksTransport';
import {
  createSeparateTracksMixerState,
  renderSeparateTracksBlock,
  simulateSeparateTracksPlayback,
  type SeparateTracksPreparedSet,
} from '@/game/defense/defenseSeparateTracksMix';

const BPM = 120;
const BEATS = 4;
const K = 2;
const N = 12;
const FS = 44100;

const buildRampPcm = (frames: number, start: number, step: number): Float32Array => {
  const data = new Float32Array(frames);
  for (let i = 0; i < frames; i += 1) {
    data[i] = start + i * step;
  }
  return data;
};

const buildTestPreparedSet = (
  phraseCount: number,
  playbackRatio = 1,
  setId = 1,
): SeparateTracksPreparedSet => {
  const grid = computeSeparateTracksGrid({
    sampleRate: FS,
    bpm: BPM,
    beatsPerBar: BEATS,
    phraseBars: K,
    progressionBars: N,
    playbackRatio,
  });

  const bgmLeft = buildRampPcm(grid.bgmFrames, 0, 0.001);
  const bgmRight = buildRampPcm(grid.bgmFrames, 0, 0.001);

  const phrasePcms = Array.from({ length: phraseCount }, (_, index) => ({
    left: buildRampPcm(grid.cycleFrames, 100 * (index + 1), 0.01),
    right: buildRampPcm(grid.cycleFrames, 100 * (index + 1), 0.01),
  }));

  return {
    grid,
    bgmLeft,
    bgmRight,
    phrasePcms,
    speedPercent: Math.round(playbackRatio * 100),
    setId,
  };
};

describe('defenseSeparateTracksMix', () => {
  it('renders without drift over ten minutes of cycles', () => {
    const set = buildTestPreparedSet(3);
    const tenMinutesFrames = 10 * 60 * FS;
    const blockFrames = 128;
    const state = createSeparateTracksMixerState({
      preparedSet: set,
      sessionGeneration: 1,
      initialPhraseIndex: 0,
    });

    const expectedCycles = Math.floor(tenMinutesFrames / set.grid.cycleFrames);

    const { finalState } = simulateSeparateTracksPlayback({
      initialState: state,
      blockFrames,
      totalFrames: expectedCycles * set.grid.cycleFrames,
      phraseRequests: [],
    });

    expect(finalState.absoluteCycle).toBe(expectedCycles);
    expect(finalState.phaseFrame).toBe(0);
  });

  it('applies phrase switch at K-cycle boundary inside render block', () => {
    const set = buildTestPreparedSet(3);
    let state = createSeparateTracksMixerState({
      preparedSet: set,
      sessionGeneration: 1,
      initialPhraseIndex: 0,
    });

    state = {
      ...state,
      phaseFrame: set.grid.cycleFrames - 64,
      absoluteCycle: 0,
    };

    const outputLeft = new Float32Array(128);
    const outputRight = new Float32Array(128);

    const result = renderSeparateTracksBlock({
      state,
      outputLeft,
      outputRight,
      blockFrames: 128,
      phraseRequest: {
        phraseIndex: 1,
        revision: 1,
        generation: 1,
      },
      tempoRequest: null,
    });

    expect(result.state.audiblePhraseIndex).toBe(1);
    expect(result.appliedPhraseAtBoundary).toBe(true);
  });

  it('keeps BGM continuous across phrase switches', () => {
    const set = buildTestPreparedSet(3);
    const totalFrames = set.grid.cycleFrames * 4;

    const state = createSeparateTracksMixerState({
      preparedSet: set,
      sessionGeneration: 1,
      initialPhraseIndex: 0,
    });

    const { bgmDiscontinuities } = simulateSeparateTracksPlayback({
      initialState: state,
      blockFrames: 128,
      totalFrames,
      phraseRequests: [
        {
          atFrame: 1000,
          request: { phraseIndex: 1, revision: 1, generation: 1 },
        },
        {
          atFrame: set.grid.cycleFrames + 500,
          request: { phraseIndex: 2, revision: 2, generation: 1 },
        },
      ],
    });

    expect(bgmDiscontinuities).toBe(0);
  });

  it('preserves absoluteCycle when tempo set is applied at boundary', () => {
    const normalSet = buildTestPreparedSet(3, 1, 1);
    const slowSet = buildTestPreparedSet(3, 0.5, 2);

    let state = createSeparateTracksMixerState({
      preparedSet: normalSet,
      sessionGeneration: 1,
      initialPhraseIndex: 0,
    });

    state = {
      ...state,
      absoluteCycle: 3,
      phaseFrame: normalSet.grid.cycleFrames - 1,
    };

    const outputLeft = new Float32Array(2);
    const outputRight = new Float32Array(2);

    const result = renderSeparateTracksBlock({
      state,
      outputLeft,
      outputRight,
      blockFrames: 2,
      phraseRequest: null,
      tempoRequest: {
        preparedSet: slowSet,
        tempoRevision: 1,
        generation: 1,
      },
    });

    expect(result.appliedTempoAtBoundary).toBe(true);
    expect(result.state.absoluteCycle).toBe(4);
    expect(result.state.activeSet.setId).toBe(2);
    expect(result.state.phaseFrame).toBe(1);
  });

  it('ignores stale generation phrase requests', () => {
    const set = buildTestPreparedSet(3);
    const state = createSeparateTracksMixerState({
      preparedSet: set,
      sessionGeneration: 2,
      initialPhraseIndex: 0,
    });

    const outputLeft = new Float32Array(128);
    const outputRight = new Float32Array(128);

    const result = renderSeparateTracksBlock({
      state,
      outputLeft,
      outputRight,
      blockFrames: 128,
      phraseRequest: {
        phraseIndex: 2,
        revision: 1,
        generation: 1,
      },
      tempoRequest: null,
    });

    expect(result.state.desiredPhraseIndex).toBe(0);
    expect(result.state.scheduled).toBeNull();
  });

  it('keeps a confirmed targetCycle and switches to the latest desired phrase', () => {
    const set = buildTestPreparedSet(3);
    let state = createSeparateTracksMixerState({
      preparedSet: set,
      sessionGeneration: 1,
      initialPhraseIndex: 0,
    });
    state = {
      ...state,
      phaseFrame: set.grid.cycleFrames - 1,
      absoluteCycle: 0,
      scheduled: {
        targetCycle: 1,
        phraseIndex: 1,
        revision: 1,
        generation: 1,
        immediate: false,
      },
      scheduledConfirmed: true,
      desiredPhraseIndex: 1,
    };

    const outputLeft = new Float32Array(1);
    const outputRight = new Float32Array(1);

    const reserved = renderSeparateTracksBlock({
      state,
      outputLeft,
      outputRight,
      blockFrames: 1,
      phraseRequest: { phraseIndex: 2, revision: 2, generation: 1 },
      tempoRequest: null,
    });

    expect(reserved.state.scheduled?.targetCycle).toBe(1);
    expect(reserved.state.scheduled?.phraseIndex).toBe(2);
    expect(reserved.state.audiblePhraseIndex).toBe(0);

    const remaining = set.grid.cycleFrames - reserved.state.phaseFrame;
    const secondLeft = new Float32Array(remaining);
    const secondRight = new Float32Array(remaining);
    const switched = renderSeparateTracksBlock({
      state: reserved.state,
      outputLeft: secondLeft,
      outputRight: secondRight,
      blockFrames: remaining,
      phraseRequest: null,
      tempoRequest: null,
    });

    expect(switched.state.audiblePhraseIndex).toBe(2);
    expect(switched.appliedPhraseAtBoundary).toBe(true);
  });

  it('applies phrase switch immediately within one beat of cycle start', () => {
    const set = buildTestPreparedSet(3);
    const state = createSeparateTracksMixerState({
      preparedSet: set,
      sessionGeneration: 1,
      initialPhraseIndex: 0,
    });

    const outputLeft = new Float32Array(128);
    const outputRight = new Float32Array(128);

    const result = renderSeparateTracksBlock({
      state: {
        ...state,
        absoluteCycle: 2,
        phaseFrame: 1000,
      },
      outputLeft,
      outputRight,
      blockFrames: 128,
      phraseRequest: {
        phraseIndex: 1,
        revision: 1,
        generation: 1,
      },
      tempoRequest: null,
    });

    expect(result.state.audiblePhraseIndex).toBe(1);
    expect(result.state.scheduled).toBeNull();
    expect(result.appliedPhraseAtBoundary).toBe(false);
  });
});
