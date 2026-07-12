import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WEB_KEYBOARD_DISPLAY_MODE,
  expandMidiRangeWithWhiteKeyPadding,
  FULL_88_KEYBOARD_RANGE,
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
