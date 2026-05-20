import { describe, expect, it } from 'vitest';
import { computeUnpressedNoteOpacity } from './survivalStaffHintOpacity';

const stageOptions = {
  hintMode: false,
  hintBuffActive: false,
  isStageMode: true,
  isPlaying: true,
  isGameOver: false,
} as const;

describe('computeUnpressedNoteOpacity', () => {
  it('HINT ON / 練習 / 非ステージでは常に 1.0', () => {
    expect(computeUnpressedNoteOpacity(29, { ...stageOptions, hintMode: true })).toBe(1);
    expect(computeUnpressedNoteOpacity(29, { ...stageOptions, hintBuffActive: true })).toBe(1);
    expect(computeUnpressedNoteOpacity(29, { ...stageOptions, isStageMode: false })).toBe(1);
    expect(computeUnpressedNoteOpacity(29, { ...stageOptions, isPlaying: false })).toBe(1);
    expect(computeUnpressedNoteOpacity(29, { ...stageOptions, isGameOver: true })).toBe(1);
  });

  it('第一ブロック通常ステージのアシスト中は常に 1.0', () => {
    expect(computeUnpressedNoteOpacity(45, { ...stageOptions, beginnerAssistActive: true })).toBe(1);
  });

  it('25秒までは 1.0、26〜29秒で段階的に暗くなり、30秒以降 0.0', () => {
    expect(computeUnpressedNoteOpacity(24.9, stageOptions)).toBe(1);
    expect(computeUnpressedNoteOpacity(25, stageOptions)).toBe(1);
    expect(computeUnpressedNoteOpacity(25.9, stageOptions)).toBe(1);
    expect(computeUnpressedNoteOpacity(26, stageOptions)).toBe(0.8);
    expect(computeUnpressedNoteOpacity(27, stageOptions)).toBe(0.6);
    expect(computeUnpressedNoteOpacity(28, stageOptions)).toBe(0.4);
    expect(computeUnpressedNoteOpacity(29, stageOptions)).toBe(0.2);
    expect(computeUnpressedNoteOpacity(30, stageOptions)).toBe(0);
    expect(computeUnpressedNoteOpacity(45, stageOptions)).toBe(0);
  });
});
