import { describe, expect, it } from 'vitest';
import {
  computeTrialMetrics,
  effeTuneLevelsToActiveMidis,
  pitchPleaseProbsToActiveMidis,
} from '../polyPitchMetrics';
import type { PolyPitchFrame } from '../polyPitchTypes';

const frame = (
  content: number,
  emit: number,
  midis: number[],
): PolyPitchFrame => ({
  engineId: 'pitchplease-fast',
  contentTimeSec: content,
  emitTimeSec: emit,
  activeMidis: midis,
});

describe('computeTrialMetrics', () => {
  it('3フレーム連続の完全一致で和音確定と遅延を返す', () => {
    const frames = [
      frame(0.05, 0.09, [60, 64, 67]),
      frame(0.06, 0.1, [60, 64, 67]),
      frame(0.07, 0.11, [60, 64, 67]),
      frame(0.08, 0.12, [60, 64, 67]),
    ];
    const metrics = computeTrialMetrics(frames, {
      onsetTimeSec: 0.05,
      sustainEndTimeSec: 0.2,
      expectedMidis: [60, 64, 67],
    });
    expect(metrics.chordConfirmed).toBe(true);
    expect(metrics.confirmLatencyMs).toBeCloseTo(60, 0);
    expect(metrics.missingMidiRate).toBe(0);
  });

  it('余剰音とオクターブ誤りを分離する', () => {
    const frames = [frame(0.1, 0.14, [60, 64, 67, 72])];
    const metrics = computeTrialMetrics(frames, {
      onsetTimeSec: 0.1,
      sustainEndTimeSec: 0.15,
      expectedMidis: [60, 64, 67],
    });
    expect(metrics.octaveErrorRate).toBeCloseTo(0.25, 2);
    expect(metrics.spuriousMidiRate).toBeCloseTo(0, 2);
  });

  it('単音ヒットは期待1音が一度でもオンなら true', () => {
    const frames = [frame(0.1, 0.12, [61])];
    const hit = computeTrialMetrics(frames, {
      onsetTimeSec: 0.1,
      sustainEndTimeSec: 0.2,
      expectedMidis: [60],
    });
    expect(hit.monoHit).toBe(false);
    const ok = computeTrialMetrics([frame(0.1, 0.12, [60])], {
      onsetTimeSec: 0.1,
      sustainEndTimeSec: 0.2,
      expectedMidis: [60],
    });
    expect(ok.monoHit).toBe(true);
  });
});

describe('effeTuneLevelsToActiveMidis', () => {
  it('5ビンの最大が閾値以上なら MIDI を返す', () => {
    const levels = new Float32Array(440);
    const firstMidi = 21;
    const dps = 5;
    const idx = 2 + (60 - firstMidi) * dps;
    levels[idx + 2] = 0.6;
    const active = effeTuneLevelsToActiveMidis(levels, firstMidi, dps, 0.5);
    expect(active).toContain(60);
  });
});

describe('pitchPleaseProbsToActiveMidis', () => {
  it('ヒステリシスで on/off を切り替える', () => {
    const probs = new Float32Array(88);
    probs[39] = 0.75;
    const { active, onMask } = pitchPleaseProbsToActiveMidis(probs, 0.7, 0.42, []);
    expect(active).toEqual([60]);
    expect(onMask[39]).toBe(true);
    probs[39] = 0.5;
    const held = pitchPleaseProbsToActiveMidis(probs, 0.7, 0.42, onMask);
    expect(held.active).toEqual([60]);
  });
});
