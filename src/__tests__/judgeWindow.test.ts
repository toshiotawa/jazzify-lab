import { describe, it, expect } from 'vitest';
import { inJudgeWindow } from '@/utils/judgeWindow';

describe('judgeWindow', () => {
  it('±200ms 内は success', () => {
    expect(inJudgeWindow(1000, 1100)).toBeTruthy();
    expect(inJudgeWindow(1000, 800)).toBeTruthy();
  });
  it('201ms 外は miss', () => {
    expect(inJudgeWindow(1000, 1202)).toBeFalsy();
  });
});