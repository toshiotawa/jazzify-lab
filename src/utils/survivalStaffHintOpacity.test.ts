import { describe, expect, it } from 'vitest';
import {
  computeKeyboardHintOpacity,
  computeUnpressedNoteOpacity,
} from './survivalStaffHintOpacity';

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

  it('フレーズモードでは経過時間に関係なく常に 1.0', () => {
    expect(computeUnpressedNoteOpacity(45, { ...stageOptions, isPhraseMode: true })).toBe(1);
  });

  it('5秒までは 1.0、6〜9秒で段階的に暗くなり、10秒以降 0.0', () => {
    expect(computeUnpressedNoteOpacity(5.9, stageOptions)).toBe(1);
    expect(computeUnpressedNoteOpacity(6, stageOptions)).toBe(0.8);
    expect(computeUnpressedNoteOpacity(7, stageOptions)).toBe(0.6);
    expect(computeUnpressedNoteOpacity(8, stageOptions)).toBe(0.4);
    expect(computeUnpressedNoteOpacity(9, stageOptions)).toBe(0.2);
    expect(computeUnpressedNoteOpacity(10, stageOptions)).toBe(0);
    expect(computeUnpressedNoteOpacity(45, stageOptions)).toBe(0);
  });
});

describe('computeKeyboardHintOpacity', () => {
  it('第一ブロックアシスト中は常に 1.0', () => {
    expect(computeKeyboardHintOpacity(45, { ...stageOptions, beginnerAssistActive: true })).toBe(1);
  });

  it('第二ブロック以降の挑戦は約 10 秒フェード', () => {
    expect(computeKeyboardHintOpacity(5, stageOptions)).toBe(1);
    expect(computeKeyboardHintOpacity(9, stageOptions)).toBe(0.2);
    expect(computeKeyboardHintOpacity(10, stageOptions)).toBe(0);
  });
});
