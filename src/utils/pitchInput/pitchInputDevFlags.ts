import type { PestoShiftSemitones } from '@/utils/pitchInput/pitchInputTypes';

const parseShift = (value: string | null): PestoShiftSemitones => {
  if (value === '12') return 12;
  if (value === '24') return 24;
  return 0;
};

/** 開発時のみ localStorage `jazzify_pitch_shift` = 0|12|24 で +12/+24 実験を有効化。 */
export const readPitchShiftDevFlag = (): PestoShiftSemitones => {
  if (!import.meta.env.DEV || typeof localStorage === 'undefined') {
    return 0;
  }
  return parseShift(localStorage.getItem('jazzify_pitch_shift'));
};

export const isPitchDiagnosticsEnabled = (): boolean =>
  import.meta.env.DEV;
