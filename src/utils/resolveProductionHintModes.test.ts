import { describe, expect, it } from 'vitest';
import { resolveProductionHintModes, parseProductionHintMode } from './resolveProductionHintModes';

describe('parseProductionHintMode', () => {
  it('有効値をパースし、未知値は fade_15s', () => {
    expect(parseProductionHintMode('always')).toBe('always');
    expect(parseProductionHintMode('invalid')).toBe('fade_15s');
    expect(parseProductionHintMode(null)).toBe('fade_15s');
  });
});

describe('resolveProductionHintModes', () => {
  it('ステージ既定を使用', () => {
    expect(resolveProductionHintModes({
      stageStaffMode: 'always',
      stageKeyboardMode: 'fade_15s',
    })).toEqual({
      staffHintMode: 'always',
      keyboardHintMode: 'fade_15s',
    });
  });

  it('レッスン override がステージ既定を上書き', () => {
    expect(resolveProductionHintModes({
      stageStaffMode: 'fade_15s',
      stageKeyboardMode: 'fade_15s',
      lessonOverrideStaff: 'hidden_until_pressed',
      lessonOverrideKeyboard: 'always',
    })).toEqual({
      staffHintMode: 'hidden_until_pressed',
      keyboardHintMode: 'always',
    });
  });

  it('override が null のときステージ既定', () => {
    expect(resolveProductionHintModes({
      stageStaffMode: 'always',
      lessonOverrideStaff: null,
    })).toEqual({
      staffHintMode: 'always',
      keyboardHintMode: 'fade_15s',
    });
  });
});
