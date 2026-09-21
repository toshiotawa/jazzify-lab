import { describe, expect, it } from 'vitest';

import vectors from '@/game/defense/fixtures/separateTracksTransport.vectors.json';
import {
  advanceTransportByElapsedFrames,
  computeBeatInForm,
  computeBgmReadFrame,
  computePhraseLoopWindow,
  computeSeparateTracksGrid,
  mapPhaseFrameForSpeedChange,
  planPhraseReservation,
  validatePhraseLoopMeasures,
  validateSeparateTracksStageNumbers,
  isSeparateTracksSourceFrameCountValid,
} from '@/game/defense/defenseSeparateTracksTransport';

describe('defenseSeparateTracksTransport vectors', () => {
  it('matches shared grid fixtures', () => {
    for (const fixture of vectors.gridCases) {
      const grid = computeSeparateTracksGrid({
        sampleRate: fixture.sampleRate,
        bpm: fixture.bpm,
        beatsPerBar: fixture.beatsPerBar,
        phraseBars: fixture.phraseBars as 1 | 2 | 4,
        progressionBars: fixture.progressionBars,
        playbackRatio: fixture.playbackRatio,
      });
      expect(grid.cycleFrames, fixture.id).toBe(fixture.cycleFrames);
      expect(grid.cyclesPerForm, fixture.id).toBe(fixture.cyclesPerForm);
      expect(grid.bgmFrames, fixture.id).toBe(fixture.bgmFrames);
    }
  });

  it('matches phrase window fixtures', () => {
    for (const fixture of vectors.phraseWindowCases) {
      const window = computePhraseLoopWindow(
        fixture.rank,
        fixture.phraseBars as 1 | 2 | 4,
        fixture.bpm,
        fixture.beatsPerBar,
        fixture.sampleRate,
      );
      expect(window.startMeasure, fixture.id).toBe(fixture.startMeasure);
      expect(window.endMeasure, fixture.id).toBe(fixture.endMeasure);
      expect(window.sourceStartFrame, fixture.id).toBe(fixture.sourceStartFrame);
      expect(window.sourceEndFrame, fixture.id).toBe(fixture.sourceEndFrame);
    }
  });

  it('matches reservation fixtures', () => {
    for (const fixture of vectors.reservationCases) {
      const plan = planPhraseReservation({
        absoluteCycle: fixture.absoluteCycle,
        phaseFrame: fixture.phaseFrame,
        cycleFrames: fixture.cycleFrames,
        leadFrames: fixture.leadFrames,
        phraseIndex: fixture.phraseIndex,
        revision: fixture.revision,
        generation: fixture.generation,
      });
      expect(plan.targetCycle, fixture.id).toBe(fixture.targetCycle);
      expect(plan.phraseIndex, fixture.id).toBe(fixture.phraseIndex);
    }
  });

  it('matches beatInForm fixtures', () => {
    for (const fixture of vectors.beatInFormCases) {
      const beat = computeBeatInForm(
        fixture.absoluteCycle,
        fixture.phaseFrame,
        fixture.cycleFrames,
        fixture.phraseBars,
        fixture.beatsPerBar,
        fixture.cyclesPerForm,
      );
      expect(beat, fixture.id).toBeCloseTo(fixture.beatInForm, 5);
    }
  });
});

describe('defenseSeparateTracksTransport validation', () => {
  it('rejects invalid N % K', () => {
    expect(validateSeparateTracksStageNumbers({ progressionBars: 10, phraseBars: 4 }))
      .not.toBeNull();
  });

  it('accepts valid stage numbers', () => {
    expect(validateSeparateTracksStageNumbers({ progressionBars: 12, phraseBars: 2 }))
      .toBeNull();
  });

  it('accepts source WAV lengths within one frame', () => {
    expect(isSeparateTracksSourceFrameCountValid(793800, 793800)).toBe(true);
    expect(isSeparateTracksSourceFrameCountValid(793801, 793800)).toBe(true);
    expect(isSeparateTracksSourceFrameCountValid(793802, 793800)).toBe(false);
  });

  it('validates contiguous phrase loop measures by rank', () => {
    expect(validatePhraseLoopMeasures([
      { loopStartMeasure: 1, loopEndMeasure: 2 },
      { loopStartMeasure: 3, loopEndMeasure: 4 },
      { loopStartMeasure: 5, loopEndMeasure: 6 },
    ], 2)).toBeNull();

    expect(validatePhraseLoopMeasures([
      { loopStartMeasure: 1, loopEndMeasure: 2 },
      { loopStartMeasure: 4, loopEndMeasure: 5 },
    ], 2)).not.toBeNull();
  });
});

describe('defenseSeparateTracksTransport helpers', () => {
  it('maps phase frame across speed change without snapping to bar head', () => {
    const mapped = mapPhaseFrameForSpeedChange(88200, 176400, 352800);
    expect(mapped).toBe(176400);
  });

  it('computes bgm read frame within form loop', () => {
    expect(computeBgmReadFrame(7, 100, 176400, 6)).toBe(176400 + 100);
    expect(computeBgmReadFrame(6, 0, 176400, 6)).toBe(0);
  });

  it('advances cycle and phase by elapsed frames without drift', () => {
    expect(advanceTransportByElapsedFrames(2, 176399, 176400, 2)).toEqual({
      absoluteCycle: 3,
      phaseFrame: 1,
    });
  });
});
