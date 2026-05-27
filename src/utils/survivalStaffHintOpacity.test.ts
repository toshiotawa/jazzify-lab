import { describe, expect, it } from 'vitest';
import {
  computeKeyboardHintOpacity,
  computeUnpressedNoteOpacity,
  opacityForProductionHintMode,
} from './survivalStaffHintOpacity';

const stageOptions = {
  hintMode: false,
  hintBuffActive: false,
  productionHintMode: 'fade_15s' as const,
  isStageMode: true,
  isPlaying: true,
  isGameOver: false,
};

describe('opacityForProductionHintMode', () => {
  it('always は常に 1.0', () => {
    expect(opacityForProductionHintMode(100, 'always')).toBe(1);
  });

  it('hidden_until_pressed は常に 0.0', () => {
    expect(opacityForProductionHintMode(0, 'hidden_until_pressed')).toBe(0);
  });

  it('fade_15s: 0〜10秒 1.0、11〜14秒 段階フェード、15秒以降 0.0', () => {
    expect(opacityForProductionHintMode(10.9, 'fade_15s')).toBe(1);
    expect(opacityForProductionHintMode(11, 'fade_15s')).toBe(0.8);
    expect(opacityForProductionHintMode(12, 'fade_15s')).toBe(0.6);
    expect(opacityForProductionHintMode(13, 'fade_15s')).toBe(0.4);
    expect(opacityForProductionHintMode(14, 'fade_15s')).toBe(0.2);
    expect(opacityForProductionHintMode(15, 'fade_15s')).toBe(0);
    expect(opacityForProductionHintMode(45, 'fade_15s')).toBe(0);
  });
});

describe('computeUnpressedNoteOpacity', () => {
  it('HINT ON / 練習 / 非ステージでは常に 1.0', () => {
    expect(computeUnpressedNoteOpacity(29, { ...stageOptions, hintMode: true })).toBe(1);
    expect(computeUnpressedNoteOpacity(29, { ...stageOptions, hintBuffActive: true })).toBe(1);
    expect(computeUnpressedNoteOpacity(29, { ...stageOptions, isStageMode: false })).toBe(1);
    expect(computeUnpressedNoteOpacity(29, { ...stageOptions, isPlaying: false })).toBe(1);
    expect(computeUnpressedNoteOpacity(29, { ...stageOptions, isGameOver: true })).toBe(1);
  });

  it('always / hidden_until_pressed モード', () => {
    expect(computeUnpressedNoteOpacity(45, {
      ...stageOptions,
      productionHintMode: 'always',
    })).toBe(1);
    expect(computeUnpressedNoteOpacity(0, {
      ...stageOptions,
      productionHintMode: 'hidden_until_pressed',
    })).toBe(0);
  });

  it('fade_15s は経過時間に応じてフェード', () => {
    expect(computeUnpressedNoteOpacity(10, stageOptions)).toBe(1);
    expect(computeUnpressedNoteOpacity(14, stageOptions)).toBe(0.2);
    expect(computeUnpressedNoteOpacity(15, stageOptions)).toBe(0);
  });
});

describe('computeKeyboardHintOpacity', () => {
  it('fade_15s は 15 秒で 0', () => {
    expect(computeKeyboardHintOpacity(10, stageOptions)).toBe(1);
    expect(computeKeyboardHintOpacity(14, stageOptions)).toBe(0.2);
    expect(computeKeyboardHintOpacity(15, stageOptions)).toBe(0);
  });
});
