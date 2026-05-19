import { describe, expect, it } from 'vitest';
import {
  earTrainingOsmdNoteColorForMidiInstance,
  resolveEarTrainingOsmdHighlightPhase,
} from '@/utils/earTrainingOsmdHighlight';

describe('resolveEarTrainingOsmdHighlightPhase', () => {
  it('優先順位: completed > failed > judgment > idle', () => {
    expect(
      resolveEarTrainingOsmdHighlightPhase({
        completed: true,
        failed: true,
        inJudgmentWindow: true,
      }),
    ).toBe('completed');
    expect(
      resolveEarTrainingOsmdHighlightPhase({
        completed: false,
        failed: true,
        inJudgmentWindow: true,
      }),
    ).toBe('failed');
    expect(
      resolveEarTrainingOsmdHighlightPhase({
        completed: false,
        failed: false,
        inJudgmentWindow: true,
      }),
    ).toBe('judgment');
    expect(
      resolveEarTrainingOsmdHighlightPhase({
        completed: false,
        failed: false,
        inJudgmentWindow: false,
      }),
    ).toBe('idle');
  });
});

describe('earTrainingOsmdNoteColorForMidiInstance', () => {
  it('judgment で残りに応じて緑／マリンゴールド', () => {
    expect(
      earTrainingOsmdNoteColorForMidiInstance('judgment', 0, 2, 2),
    ).toBe('#f39800');
    expect(
      earTrainingOsmdNoteColorForMidiInstance('judgment', 0, 2, 1),
    ).toBe('#22c55e');
    expect(
      earTrainingOsmdNoteColorForMidiInstance('judgment', 1, 2, 1),
    ).toBe('#f39800');
  });
});
