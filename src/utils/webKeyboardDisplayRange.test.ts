import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WEB_KEYBOARD_DISPLAY_MODE,
  ensureMinimumDisplaySpan,
  expandMidiRangeWithWhiteKeyPadding,
  FULL_88_KEYBOARD_RANGE,
  MIN_DISPLAY_SPAN_SEMITONES,
  normalizeWebKeyboardDisplayMode,
  resolveWebKeyboardDisplayRange,
} from '@/utils/webKeyboardDisplayRange';

describe('expandMidiRangeWithWhiteKeyPadding', () => {
  it('adds one white key on each side for C4-G4', () => {
    expect(expandMidiRangeWithWhiteKeyPadding(60, 67)).toEqual({
      minMidi: 59,
      maxMidi: 69,
    });
  });

  it('handles black-key-only note with adjacent white keys', () => {
    expect(expandMidiRangeWithWhiteKeyPadding(61, 61)).toEqual({
      minMidi: 60,
      maxMidi: 62,
    });
  });

  it('clamps at A0', () => {
    expect(expandMidiRangeWithWhiteKeyPadding(21, 21)).toEqual({
      minMidi: 21,
      maxMidi: 23,
    });
  });

  it('clamps at C8', () => {
    expect(expandMidiRangeWithWhiteKeyPadding(108, 108)).toEqual({
      minMidi: 107,
      maxMidi: 108,
    });
  });
});

describe('resolveWebKeyboardDisplayRange', () => {
  it('returns full 88 keys in full88 mode', () => {
    expect(resolveWebKeyboardDisplayRange([60, 67], 'full88')).toEqual(FULL_88_KEYBOARD_RANGE);
  });

  it('returns padded range in questionRangeFit mode', () => {
    expect(resolveWebKeyboardDisplayRange([60, 67], 'questionRangeFit')).toEqual({
      minMidi: 59,
      maxMidi: 69,
    });
  });

  it('falls back to full 88 keys when no notes are available', () => {
    expect(resolveWebKeyboardDisplayRange([], 'questionRangeFit')).toEqual(FULL_88_KEYBOARD_RANGE);
  });

  it('keeps smartphone-style padding when ensureMinTwoOctaves is false', () => {
    expect(resolveWebKeyboardDisplayRange([60, 67], 'questionRangeFit', { ensureMinTwoOctaves: false }))
      .toEqual({ minMidi: 59, maxMidi: 69 });
  });

  it('ensures at least two octaves on PC/tablet when ensureMinTwoOctaves is true', () => {
    const range = resolveWebKeyboardDisplayRange([60, 67], 'questionRangeFit', { ensureMinTwoOctaves: true });
    expect(range.maxMidi - range.minMidi).toBeGreaterThanOrEqual(MIN_DISPLAY_SPAN_SEMITONES);
    expect(range.minMidi).toBeLessThanOrEqual(60);
    expect(range.maxMidi).toBeGreaterThanOrEqual(67);
  });

  it('does not expand ranges that already span two octaves', () => {
    const wideMidis = [60, 84];
    const withoutMin = resolveWebKeyboardDisplayRange(wideMidis, 'questionRangeFit');
    const withMin = resolveWebKeyboardDisplayRange(wideMidis, 'questionRangeFit', { ensureMinTwoOctaves: true });
    expect(withMin).toEqual(withoutMin);
  });
});

describe('ensureMinimumDisplaySpan', () => {
  it('expands narrow padded ranges to at least two octaves', () => {
    const padded = expandMidiRangeWithWhiteKeyPadding(60, 67);
    const expanded = ensureMinimumDisplaySpan(padded);
    expect(expanded.maxMidi - expanded.minMidi).toBeGreaterThanOrEqual(MIN_DISPLAY_SPAN_SEMITONES);
  });

  it('leaves ranges that already meet the minimum unchanged', () => {
    const range = { minMidi: 48, maxMidi: 84 };
    expect(ensureMinimumDisplaySpan(range)).toEqual(range);
  });

  it('clamps at A0 and reallocates expansion upward', () => {
    const padded = expandMidiRangeWithWhiteKeyPadding(21, 23);
    const expanded = ensureMinimumDisplaySpan(padded);
    expect(expanded.minMidi).toBe(21);
    expect(expanded.maxMidi - expanded.minMidi).toBeGreaterThanOrEqual(MIN_DISPLAY_SPAN_SEMITONES);
  });

  it('clamps at C8 and reallocates expansion downward', () => {
    const padded = expandMidiRangeWithWhiteKeyPadding(105, 108);
    const expanded = ensureMinimumDisplaySpan(padded);
    expect(expanded.maxMidi).toBe(108);
    expect(expanded.maxMidi - expanded.minMidi).toBeGreaterThanOrEqual(MIN_DISPLAY_SPAN_SEMITONES);
  });
});

describe('normalizeWebKeyboardDisplayMode', () => {
  it('defaults to questionRangeFit', () => {
    expect(normalizeWebKeyboardDisplayMode(undefined)).toBe(DEFAULT_WEB_KEYBOARD_DISPLAY_MODE);
    expect(normalizeWebKeyboardDisplayMode('invalid')).toBe(DEFAULT_WEB_KEYBOARD_DISPLAY_MODE);
  });

  it('accepts full88', () => {
    expect(normalizeWebKeyboardDisplayMode('full88')).toBe('full88');
  });
});
