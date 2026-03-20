import { describe, expect, it, vi } from 'vitest';
import {
  ROOT_CORRECT_NOISE_LOOP_SAMPLES,
  fillRootCorrectNoiseLoop,
} from '@/utils/rootCorrectFamicomNoise';

describe('rootCorrectFamicomNoise', () => {
  it('ROOT_CORRECT_NOISE_LOOP_SAMPLES が正の整数である', () => {
    expect(ROOT_CORRECT_NOISE_LOOP_SAMPLES).toBeGreaterThan(0);
    expect(Number.isInteger(ROOT_CORRECT_NOISE_LOOP_SAMPLES)).toBe(true);
  });

  it('空配列では何もしない', () => {
    const empty = new Float32Array(0);
    fillRootCorrectNoiseLoop(empty);
    expect(empty.length).toBe(0);
  });

  it('指定長を埋め、値は [-1, 1] に収まる', () => {
    const spy = vi.spyOn(Math, 'random');
    spy.mockReturnValueOnce(0).mockReturnValueOnce(1).mockReturnValue(0.25);
    const buf = new Float32Array(3);
    fillRootCorrectNoiseLoop(buf);
    expect(buf[0]).toBe(-1);
    expect(buf[1]).toBe(1);
    expect(buf[2]).toBeCloseTo(-0.5);
    spy.mockRestore();
  });
});
