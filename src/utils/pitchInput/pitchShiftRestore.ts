import type { PestoShiftSemitones } from '@/utils/pitchInput/pitchInputTypes';

/** 有限かつ有効なモデル MIDI を実音へ復元。 */
export const restoreConcertMidi = (
  modelMidi: number,
  shiftSemitones: PestoShiftSemitones,
): number | null => {
  if (!Number.isFinite(modelMidi) || modelMidi <= 0 || modelMidi >= 128) {
    return null;
  }
  const concert = modelMidi - shiftSemitones;
  if (concert <= 0 || concert >= 128) return null;
  return concert;
};
